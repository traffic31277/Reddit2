import "../css/MakeSuggestion.css";
// import type { Schema } from '../../amplify/data/resource';
// import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';
import NavigationBar from "./navbar";
import React from 'react';
import ReactDOM from 'react-dom/client';
import profanity from 'allprofanity';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
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
        // Check if the text contains profanity.
        if (await profanityCheck()) {
            setError("No profanity allowed :)");
        }
        else {
            setError("");
            console.log("Adding new suggestion: " + text);

            // Get the user's id
            const { userId } = await getCurrentUser();

            // Get the user item from the Users table 
            const user = await docClient.send(
                new GetCommand({
                    TableName: "Users",
                    Key: {
                        userId: userId,
                    }
                })
            );

            // Add a new item to the Suggestions table.
            await docClient.send(
                new PutCommand({
                    TableName: "Suggestions",
                    Item: {
                        userId: userId,                                         // Partition Key
                        suggestionId: `SUGGESTION_${new Date().toISOString()}`, // Sort Key
                        pseudonym: user.Item?.pseudonym,    
                        text: text,
                        likes: 0,
                        comments: 0
                    }
                })
            );

            // Set the hasSuggestion flag for this user to true
            await docClient.send(
                new UpdateCommand({
                  TableName: "Users",
                  Key: {
                    userId: userId
                  },
                  UpdateExpression: "SET #hasSuggestion = :hasSuggestion",
                  ExpressionAttributeNames: { "#hasSuggestion": "hasSuggestion" },
                  ExpressionAttributeValues: { ":hasSuggestion": true } 
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
