import { useState } from 'react';
import React from 'react';
import { signUp, signOut, getCurrentUser, resetPassword, resendSignUpCode, confirmResetPassword } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
    const [confirmationCode, setConfirmationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleResendCode = async () => {
        const { username } = await getCurrentUser();

        try {
            console.log('Current username is: ', username);
            await resendSignUpCode({ username });
        }

        catch (err: any) {
            console.error("Verification failed", error);
        }

        finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const { username } = await getCurrentUser();

        try {
            console.log('Password Successfully Changed');
            await confirmResetPassword({ username, confirmationCode, newPassword});
            navigate('/login');
        }

        catch (err: any) {
            console.error('Password change failed: ', err);
            setError(err.message);
        }

        finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Reset Password</h1>

                <label htmlFor="email">Confirmation Code</label>
                <input
                    id="confirmation code"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                />

                <label htmlFor="email">New Password</label>
                <input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />

                {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

                <button type="button" onClick={handleResetPassword} disabled={loading}>
                    {loading ? 'Resetting Passsword...' : 'Reset Password'}
                </button>

                <button type="button" onClick={handleResendCode} disabled={loading}>
                    {loading ? 'Resending Code...' : 'Resend Code'}
                </button>
            </div>
            
            <NavigationBar />
        </div>
    );
}