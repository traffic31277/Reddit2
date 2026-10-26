import { useState } from 'react';
import React from 'react';
import { signIn } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.username) {
    console.log('User is already logged in, navigating to homepage');
    navigate('/mail');
    return;
  }

  else {
    console.log('current user is: ', user);
  }


  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const { isSignedIn, nextStep } = await signIn({ username, password });
      
      if (isSignedIn) {
        console.log('Logged in successfully!');
      }
    } catch (err: any) {
      
      if (err == "There is already a signed in user.") {
        console.log("There is already a signed in user.");
        navigate('/mail');
        return;
      }

      else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page"> 
      <div className="login-card">
        <h1>Login</h1>

        <label htmlFor="username">Username</label>
        <input 
          id="username" 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input 
          id="password" 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

       
        {error && <div className="error-message" style={{ color: 'red', margin: '10px 0', fontSize: '14px' }}>{error}</div>}

        <button type="button" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
      <NavigationBar />
    </div>
  );
}