import { useState } from 'react';
import React from 'react';
import { signUp } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

export default function Signup() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { setUser } = useAuth();

    const handleSignup = async () => {
        setError('');
        setLoading(true);

        try {
            const { isSignUpComplete, userId, nextStep } = await signUp({ username, password });
            
            if (isSignUpComplete) {
                console.log('Signed up successfully!');
                setUser({ username, userId });
                navigate('/verify');
            }
        }
        
        catch (err: any) {
            if (err.message == "User already exists") {
                console.log('User already exists');
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

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Signup</h1>

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
                    {loading ? 'Signing in...' : 'Signup'}
                </button>
            </div>
            
            <NavigationBar />
        </div>
    );
}