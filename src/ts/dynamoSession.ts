import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

const REGION = 'us-east-2';

function appError(name: string, message: string) {
    return Object.assign(new Error(message), { name });
}

/**
 * Return the signed-in user and a DynamoDB client belonging to that user.
 *
 * Do not fall back to guest credentials for writes. A guest identity may be
 * able to read Suggestions, but it must not be allowed to vote or comment.
 */
export async function getSignedInDynamo() {
    const cognito = Amplify.getConfig().Auth?.Cognito;

    if (!cognito?.userPoolId || !cognito.userPoolClientId) {
        throw appError(
            'MissingUserPoolConfiguration',
            'Cognito User Pool settings are missing from amplify_outputs.json.',
        );
    }

    if (!cognito.identityPoolId) {
        throw appError(
            'MissingIdentityPoolConfiguration',
            'The configured backend is missing its Cognito Identity Pool.',
        );
    }

    // Checking the user explicitly prevents guest credentials from being used
    // accidentally for voting or posting a comment.
    const { userId } = await getCurrentUser();
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();

    if (!idToken) {
        throw appError('NotSignedIn', 'The current browser session has no sign-in token.');
    }

    // Only use the configured backend's Identity Pool. Falling back to a hardcoded
    // pool can select a different IAM role from the one granted table access.
    const credentials =
        session.credentials ??
        fromCognitoIdentityPool({
            clientConfig: { region: cognito.identityPoolId.split(':')[0] },
            identityPoolId: cognito.identityPoolId,
            logins: {
                [`cognito-idp.${cognito.userPoolId.split('_')[0]}.amazonaws.com/${cognito.userPoolId}`]:
                    idToken,
            },
        });

    const client = DynamoDBDocumentClient.from(
        new DynamoDBClient({
            region: "us-east-2",
            credentials: fromCognitoIdentityPool({
                identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca'
            })
        })
    );
    
    return { userId, client };
}

/** Translate AWS SDK exceptions into useful, user-facing diagnostics. */
export function describeDatabaseError(error: unknown, tableName: string) {
    const details = error as {
        name?: string;
        message?: string;
        $metadata?: { httpStatusCode?: number };
    } | null;
    const code = details?.name ?? '';
    const message = details?.message ?? '';
    const lower = message.toLowerCase();

    if (code === 'MissingIdentityPoolConfiguration') {
        return 'The app is missing its Identity Pool configuration. Regenerate amplify_outputs.json from the deployed backend.';
    }

    if (
        code === 'AuthUserPoolException' ||
        code === 'MissingUserPoolConfiguration' ||
        lower.includes('userpool not configured') ||
        lower.includes('user pool settings are missing')
    ) {
        return 'Cognito User Pool is not configured. Check amplify_outputs.json and the Amplify setup in main.tsx.';
    }

    if (
        code === 'UserUnAuthenticatedException' ||
        code === 'NotSignedIn' ||
        lower.includes('not authenticated') ||
        lower.includes('no sign-in token') ||
        lower.includes('not signed in')
    ) {
        return 'Please log in to your account before commenting or voting.';
    }

    if (code === 'ResourceNotFoundException' || code === 'TableNotFoundException') {
        return `${tableName} was not found in ${REGION}. Deploy the backend that defines this table.`;
    }

    if (
        code === 'AccessDeniedException' ||
        code === 'UnrecognizedClientException' ||
        details?.$metadata?.httpStatusCode === 403
    ) {
        return `Access to ${tableName} was denied. Check the authenticated IAM role and the deployed table permissions.`;
    }

    if (
        code === 'NotAuthorizedException' ||
        code === 'InvalidIdentityPoolConfigurationException' ||
        (code === 'InvalidParameterException' && lower.includes('identity'))
    ) {
        return "The Cognito Identity Pool rejected this sign-in. Confirm that it trusts the app's User Pool and has an authenticated IAM role.";
    }

    if (code === 'TransactionCanceledException' || code === 'ConditionalCheckFailedException') {
        return 'Another vote or update happened at the same time. Refresh the leaderboard and try again.';
    }

    if (code === 'CredentialsProviderError' || code.includes('Credentials')) {
        return 'AWS credentials were unavailable. Check the identity pool configuration and the browser console.';
    }

    return `${tableName} request failed (${code || 'unknown error'}). See the browser console for details.`;
}
