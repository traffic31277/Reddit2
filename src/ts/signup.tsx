import React, { useState } from 'react';
import { signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Runs at startup, checks for current user session information
    const checkUserAuth = async () => {
        try {
            const { username, userId, signInDetails } = await getCurrentUser();
        
            console.log('User found!');
            console.log('Username: ', username);
            console.log('UserId: ', userId);
            console.log('Sign-In Details: ', signInDetails);
        }

        catch (err: any) {
            console.log('User not found!');
        }
    }

    // checkUserAuth();

    // Activates from Sign Up button, calls the signUp() function
    const handleSignup = async () => {
        setError('');
        setLoading(true);

        try {
            const { isSignUpComplete } = await signUp({ username, password });
            
            // If isSignUpComplete is true, then verification step is complete, so go to login (Account complete)
            if (isSignUpComplete) {
                console.log('Signed up successfully!');
                navigate('/login');
            }

            // If isSignUpComplete is false, then verification step needed, so verify (Account not complete yet)
            else {
                console.log('Missing verification step!');
                navigate('/verify');
            }
        }
        
        catch (err: any) {
            // If user is found in Cognito instance send to login page
            if (err.message == 'User already exists') {
                console.log('User already exists, navigating to login page');
                navigate('/login');
            }

            else {
                setError(err.message || 'Failed to sign in. Please check your credentials.');
            }
        }
        
        finally {
            setLoading(false);
        }
    };

    // Signs the user out of the current session
    const handleSignOut = async () => {
        setLoading(true);
        await signOut();
        setLoading(false);
        console.log('Signed out of current session!');
    }

    // Sends the user to the login page
    const handleLogin = async () => {
        console.log('Sending user to login page!');
        navigate('/login');
    }

    // Sends the user to the reset password page
    const handleResetPassword = async () => {
        console.log('Sending user to reset page!');
        navigate('/reset');
    }

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Sign Up</h1>

                <label htmlFor="email">Email</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label htmlFor="email">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

                <button type="button" onClick={handleSignup} disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign Up'}
                </button>

                <button type="button" onClick={handleSignOut} disabled={loading}>
                    {loading ? 'Signing Out...' : 'Sign Out'}
                </button>

                <button type="button" onClick={handleLogin} disabled={loading}>
                    {loading ? 'Signing Out...' : 'Log In'}
                </button>

                <button type="button" onClick={handleResetPassword} disabled={loading}>
                    {loading ? 'Resetting Passsword...' : 'Reset Password'}
                </button>
            </div>
            
            <NavigationBar />
        </div>
    );
}