import React from 'react';
import '../css/mailbox.css';
import '../css/index.css';
import { useState } from 'react';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";


function Mailbox() {
	const [allowSubmit, setAllowSubmit] = useState(true);

	const checkUserHasSuggestion = async () => {
		console.log("hello");
		const client = new DynamoDBClient(
			{
				region: "us-east-2",
				credentials: fromCognitoIdentityPool({
					identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
				}),
			});
		const docClient = DynamoDBDocumentClient.from(client);

		try {
			const { userId } = await getCurrentUser();
			const user = await docClient.send(
				new GetCommand({
					TableName: "Users",
					Key: {
						userId: userId
					}
				})
			);
			console.log(user.Item?.pseudonym);
			console.log(user.Item?.hasSuggestion);
			setAllowSubmit(!user.Item?.hasSuggestion);
		}
		catch (error) {
			console.error(`Failed to check if user has suggestion: ${error}`)
		}
	}
	checkUserHasSuggestion();

	const navigate = useNavigate();

	const handleNavigation = () => {
		navigate('/suggest');
	};

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

	return (
		<div className="suggestion-container">
			<main className="content-section">
				<img
					src="/mailbox.png"
					alt="Mailbox with letter"
					className="mailbox-icon"
				/>
				{allowSubmit &&
					<button className="submit-btn" onClick={handleNavigation}>
						Submit Suggestion
					</button>
				}
			</main>
			<NavigationBar />
		</div>
	);
}

export default Mailbox