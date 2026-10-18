/* 
    Code Review
    Mark Masenda
    10/17/2026
*/

import "./MakeSuggestion.css";
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useState } from 'react';

const client = generateClient<Schema>();

function MakeSuggestion() {

    const [text, setText] = useState("");

    function handleChange(e) {
        setText(e.target.value);
    }

    /* listSuggestions() is not used in this iteration, might use it later */

    async function listSuggestions() {
        const { data: suggestions} = await client.models.Suggestion.list();

        alert(suggestions.map((suggestion) => suggestion.text).join('\n'));
    }

    /* Changed the likes input from random, to 0 */

    async function addSuggestion() {
        alert(text);
        await client.models.Suggestion.create({
            userId: "INSERT USER ID HERE",
            text: text,
            likes: 0
        });
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
                <button className='suggestion_button'
                    onClick={addSuggestion}>Submit Suggestion
                </button>
            </div>
        </main>
    )
};

export default MakeSuggestion