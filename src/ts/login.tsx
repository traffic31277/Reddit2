import { useState } from 'react';
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { signIn } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';

export default function Login() {
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

	// Activates from login button, will call signIn() function
	const handleLogin = async () => {
		setError('');
		setLoading(true);

		// Checks if user is already logged in
		// (This is just for testing, after login the user should not be able to go back to the login page)
		try {
			await getCurrentUser();
			console.log('User is already logged in!');
			navigate('/mail');
		}

		// User is not already logged in, now sign them in
		catch (err: any) {
			try {
				await signIn({ username, password });
				console.log('Logged in successfully!');
				navigate('/mail');
			} 
			
			// A different error occured, (wrong password, wrong email, etc.)
			catch (err: any) {
				console.error('Sign In failed!');
				setError(err.message || 'Failed to sign in. Please check your credentials.');
			}
		}

		finally {
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