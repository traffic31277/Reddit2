import React from 'react';
import '../css/mailbox.css';
import '../css/index.css';
import NavigationBar from './navbar';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from 'aws-amplify/auth';

function Mailbox() {
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

			<button className="submit-btn" onClick={handleNavigation}>
				Submit Suggestion
			</button>
		</main>
		<NavigationBar />
		</div>
	);
}

export default Mailbox