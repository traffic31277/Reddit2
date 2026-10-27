import { useState } from 'react';
import React from 'react';
import { signUp, confirmSignUp, getCurrentUser, resendSignUpCode } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';

export default function Verification() {
    const [username, setEmail] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleConfirmSignUp = async () => {
        try {
            await confirmSignUp({ username, confirmationCode });
            console.log('Account Verified!');
            navigate('/login');
        }

        catch (err: any) {
            if (err.message == 'User cannot be confirmed. Current status is CONFIRMED') {
                console.log('Account is already verified!');
                navigate('/login');
            }

            else {
                console.error('Verification failed!', err.message);
                setError(err.message);
            }
        }

        finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        const { username } = await getCurrentUser();

        try {
            await resendSignUpCode({ username });
            console.log('Code resent!');
        }

        catch (err: any) {
            console.error("Verification failed", err.message);
            setError(err.message);
        }

        finally {
            setLoading(false);
        }

    }

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Email Verification</h1>

                <label htmlFor="code">Email</label>
                <input
                    id="email"
                    type="text"
                    value={username}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label htmlFor="code">Confirmation Code</label>
                <input
                    id="confirmation"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                />

                {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

                <button type="button" onClick={handleConfirmSignUp} disabled={loading}>
                    {loading ? 'Checking Code...' : 'Verify Account'}
                </button>

                <button type="button" onClick={handleResendCode} disabled={loading}>
                    {loading ? 'Resending Code...' : 'Resend Code'}
                </button>
            </div>

            <NavigationBar />
        </div>
    );
}