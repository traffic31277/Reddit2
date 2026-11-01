import { useState } from 'react';
import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { signIn } from 'aws-amplify/auth';
import '../css/login.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';

import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import type { Schema } from '../../amplify/data/resource';
import { Amplify } from "aws-amplify"
import { generateClient } from 'aws-amplify/data';
import outputs from "../../amplify_outputs.json"

Amplify.configure(outputs)

export default function Login() {
	const dynamoClient = new DynamoDBClient(
		{
			region:"us-east-2",
			credentials: fromCognitoIdentityPool({
				identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
			}),
		});
	const docClient = DynamoDBDocumentClient.from(dynamoClient);

	const schemaClient = generateClient<Schema>();
	
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

				try {
					// Get the userId
					const { userId } = await getCurrentUser();

					// Try to access the user from the Users table
					const response = await docClient.send(
						new GetCommand({
							TableName: "Users",
							Key: {
								userId: userId
							}
						})
					)

					// If the GetCommand succeeded, this user already exists and doesn't need to be added
					if (response.Item) {
						console.log("Response: ", response.Item);
						console.log("User is already in the Users table!");
					}

					// If the GetCommand failed, add them to the Users table
					else {

						// Create a new item in the Users table.
						await docClient.send(
							new PutCommand({
								TableName: "Users",
								Item: {
									userId: userId,
									pseudonym: "PLACEHOLDER",
									hasSuggestion: false
								}
							})
						);
						console.log("Created user in Users table!");
					}

					// Assign the user a Pseudonym if they dont already have one
					if (!response.Item || response.Item.pseudonym === "PLACEHOLDER") {
						const { data, errors } = await schemaClient.queries.assignPseudonym({
							userId: userId,
						});

						console.log(`Pseudonym is: ${data}`);
					}
				}

				catch (err: any) {
					console.error("Creating user account failed", err.message);
				}

				console.log("Sending user to mail homepage!");
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