import { useState } from 'react';
import React from 'react';
import { signUp, signOut, getCurrentUser, resetPassword } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';

export default function Reset() {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSendCode = async () => {
        try {
            await resetPassword({ username });
            navigate('/resetPassword');
        }

        catch (err: any) {
            console.error('Incorrect email', err);
            setError(err.message);
        }

        finally {
            setLoading(false);
        }
    }

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Reset Password</h1>

                <label htmlFor="email">Email</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

                <button type="button" onClick={handleSendCode} disabled={loading}>
                    {loading ? 'Sending Reset Code...' : 'Send Reset Code'}
                </button>
            </div>
            
            <NavigationBar />
        </div>
    );
}