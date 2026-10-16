import "./MakeSuggestion.css";
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useState } from 'react';

const client = generateClient<Schema>();

function MakeSuggestion() {

    const [text, setText] = useState("");

    function handleChange(e) {
        setText(e.target.value);
    }

    async function listSuggestions() {
        const { data: suggestions, errors } = await client.models.Suggestion.list();

        alert(suggestions.map((suggestion) => suggestion.text).join('\n'));
    }

    // const { user, signOut } = useAuthenticator();

    async function addSuggestion() {
        alert(text);
        await client.models.Suggestion.create({
            userId: "INSERT USER ID HERE",
            text: text,
            likes: Math.floor(Math.random() * 50)
        });
    }

    return (
        <main>
            <h1>Make Your Suggestion!</h1>
            <div>
                <input class='input_box_background'
                    type="text"
                    value={text}
                    onChange={handleChange}
                    placeholder='Input Suggestion Here...'>
                </input>
            </div>
     
            <div>
                <button class='suggestion_button' onClick={addSuggestion}>Submit Suggestion</button>
            </div>

        </main>
    )
};

export default MakeSuggestion