import "../css/MakeSuggestion.css";
// import type { Schema } from '../../amplify/data/resource';
// import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';
import NavigationBar from "./navbar";
import React from 'react';
import ReactDOM from 'react-dom/client';
import profanity from 'allprofanity';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { fromIni, fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import { getCurrentUser } from 'aws-amplify/auth';
// const client = generateClient<Schema>();

function MakeSuggestion() {
    const client = new DynamoDBClient(
        {
            region: "us-east-2",
            credentials: fromCognitoIdentityPool({
                identityPoolId: 'us-east-2:12e12612-5d7f-4e29-b566-432accd9bcca',
            }),
        });
    const docClient = DynamoDBDocumentClient.from(client);

    const [text, setText] = useState("");
    const [error, setError] = useState('');

    function handleChange(e) {
        setText(e.target.value);
    }

    async function profanityCheck() {
        // alert("testing: " + text);
        const containsProfanity = profanity.check(text);
        return containsProfanity;
    }

    async function addSuggestion() {
        if (await profanityCheck()) {
            setError("No profanity allowed :)");
        }
        else {
            setError("");
            console.log("Adding new suggestion: " + text);

            const { userId } = await getCurrentUser();

            // console.log(userId);

            await docClient.send(
                new PutCommand({
                    TableName: "Suggestions",
                    Item: {
                        userId: userId,                             // Partition Key
                        timestamp: new Date().toISOString(),        // Sort Key
                        suggestionId: "SUGGESTION_",
                        pseudonym: "INSERT USER PSEUDONYM HERE",    
                        text: text,
                        likes: 0,
                        comments: 0,
                        
                    }
                })
            );
        }
    }

    return (
        <main>
            <h1>Make Your Suggestion!</h1>
            <div>
                <input className='input_box_background'
                    type="text"
                    value={text}
                    onChange={handleChange}
                    placeholder='Input Suggestion Here...'>
                </input>
            </div>

            <div>
                <div className='error_message'>{error}</div>
                <button className='suggestion_button' onClick={addSuggestion}>
                    Submit Suggestion
                </button>
            </div>
            <NavigationBar />
        </main>
    )
};

export default MakeSuggestion
