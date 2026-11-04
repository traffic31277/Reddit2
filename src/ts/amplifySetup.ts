import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// This must execute before using getCurrentUser(), fetchAuthSession(), etc.
// The login page should NOT call Amplify.configure() again.
Amplify.configure(outputs);

// Only report whether the configuration is complete. Never log tokens or keys.
const cognito = Amplify.getConfig().Auth?.Cognito;
if (!cognito?.userPoolId || !cognito.userPoolClientId) {
    console.error(
        'Amplify Auth is missing its Cognito User Pool. Regenerate amplify_outputs.json ' +
            'from the correct backend, then restart Vite.',
    );
}
