import "../css/MakeSuggestion.css";
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';
import NavigationBar from "./navbar";
import React from 'react';
import ReactDOM from 'react-dom/client';
import profanity from 'allprofanity';

const client = generateClient<Schema>();

function MakeSuggestion() {

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
            setError("No profanity allowed :)")
        }
        else {
            setError("");
            console.log("Adding new suggestion: " + text);
            await client.mutations.addSuggestion({
                userId: "INSERT USER ID HERE",
                currentPseudonym: "INSERT USERS PSEUDONYM HERE",
                text: text,
                likes: 0
            });
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
