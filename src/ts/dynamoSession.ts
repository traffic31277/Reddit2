import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

const REGION = 'us-east-2';

// Existing identity pool used by the project's working Suggestions/Users code.
// Prefer the identity pool in Amplify's config when one is configured.
const EXISTING_IDENTITY_POOL_ID = 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca';

/**
 * Create a signed-in DynamoDB client for both comments and suggestion votes.
 *
 * Some builds have a valid Cognito User Pool sign-in but no AWS credentials
 * in fetchAuthSession(). In that case, exchange the user's ID token through
 * the same Cognito Identity Pool already used elsewhere in this project.
 */
export async function getDocumentClient() {
    const session = await fetchAuthSession();

    // Amplify might already be providing the correct authenticated IAM role.
    if (session.credentials) {
        return DynamoDBDocumentClient.from(new DynamoDBClient({
            region: REGION,
            credentials: session.credentials,
        }));
    }

    const idToken = session.tokens?.idToken?.toString();
    const cognitoConfig = Amplify.getConfig().Auth?.Cognito;
    const userPoolId = cognitoConfig?.userPoolId;

    if (!idToken) {
        throw new Error('You are not signed in. Please log in and try again.');
    }

    if (!userPoolId) {
        throw new Error('Cognito User Pool is missing from Amplify configuration.');
    }

    const identityPoolId = cognitoConfig?.identityPoolId ?? EXISTING_IDENTITY_POOL_ID;
    const providerName = `cognito-idp.${REGION}.amazonaws.com/${userPoolId}`;

    // Passing `logins` is essential: without it, Cognito Identity may return
    // guest/unauthenticated credentials that cannot access protected tables.
    const credentials = fromCognitoIdentityPool({
        clientConfig: { region: REGION },
        identityPoolId,
        logins: {
            [providerName]: idToken,
        },
    });

    return DynamoDBDocumentClient.from(new DynamoDBClient({
        region: REGION,
        credentials,
    }));
}

export function describeDatabaseError(error: unknown, tableName: string) {
    const details = error as {
        name?: string;
        message?: string;
        $metadata?: { httpStatusCode?: number };
    };
    const code = details?.name ?? '';
    const message = details?.message ?? '';
    const lowerMessage = message.toLowerCase();

    if (code === 'ResourceNotFoundException' || code === 'TableNotFoundException') {
        return `${tableName} table not found in ${REGION}. Check that the backend was deployed in the correct AWS account.`;
    }

    if (code === 'AccessDeniedException' || details?.$metadata?.httpStatusCode === 403 ||
        code === 'UnauthorizedException' || code === 'NotAuthorizedException') {
        return `Access to ${tableName} denied. Check that your Cognito Identity Pool's authenticated role has permission.`;
    }

    if (code === 'InvalidIdentityPoolConfigurationException') {
        return 'Cognito Identity Pool configuration is invalid. Check the identity pool and its IAM roles.';
    }

    if (lowerMessage.includes('not signed in') || lowerMessage.includes('unauthenticated')) {
        return 'You are not signed in. Please log in and try again.';
    }

    if (lowerMessage.includes('user pool') || lowerMessage.includes('amplify configuration')) {
        return 'Amplify Auth configuration is incomplete. Check amplify_outputs.json and Amplify.configure().';
    }

    if (lowerMessage.includes('credentials') || code.includes('Credentials')) {
        return 'Could not get AWS credentials. Check the Cognito Identity Pool configuration and browser console.';
    }

    return `Could not access ${tableName}. See the browser console for the AWS error (${code || 'unknown error'}).`;
}
