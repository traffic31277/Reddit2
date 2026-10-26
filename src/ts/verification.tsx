import { useState } from 'react';
import React from 'react';
import { signUp, confirmSignUp, getCurrentUser } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Verification() {
    const [confirmationCode, setConfirmationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { user, setUser } = useAuth();
    const navigate = useNavigate();


    const handleConfirmSignUp = async () => {
        setError('');

        if (!user?.username) {
            console.error("No user session found, returning to login page");
            navigate('/login');
            return;
        }
        

        try {
            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username: user.username,
                confirmationCode
            });

            if (isSignUpComplete) {
                console.log('Account verified!');

                try {
                    const user = await getCurrentUser();
                    setUser(user);
                }

                catch (err: any) {
                    setUser(null);
                }

                navigate('/mail');
            }
            
            else {
                console.log('Sign up not complete, next step required: ', nextStep.signUpStep);

                if (nextStep.signUpStep == "DONE") {
                    navigate('/login');
                }
            }
        }

        catch (err: any) {
            console.error("Verification failed", error);
        }

        finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-card">
                <h1>Email Verification</h1>

                <label htmlFor="code">Confirmation Code</label>
                <input
                    id="confirmation"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                />

                {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

                <button type="button" onClick={handleConfirmSignUp} disabled={loading}>
                    {loading ? 'Checking Code...' : 'Check Code'}
                </button>
            </div>

            <NavigationBar />
        </div>
    );
}