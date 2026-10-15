import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { Text, useAuthenticator } from '@aws-amplify/ui-react';
import outputs from '../amplify_outputs.json';

// generate database based on Schema
const client = generateClient<Schema>();

function App() {
  // const { user, signOut } = useAuthenticator();

  async function addSuggestion() {
    const text = document.getElementById("suggestion")?.textContent;
    if (text != null) {
      await client.models.Suggestion.create({
        text: text,
        likes: Math.floor(Math.random() * 50),
        dislikes: Math.floor(Math.random() * 50),
      });
    }

    alert("what the heck");
  }

  async function listSuggestions() {
    const { data: suggestions, errors } = await client.models.Suggestion.list();
    
    alert(suggestions.map((suggestion) => suggestion.text).join('\n'));
  }

 

  return (
    <main>
      <h1>Test Suggestion</h1>
      <div>
        <label>Input Suggestion</label>
        <input id="suggestion"></input>
      </div>
      <button onClick={addSuggestion}>Add Suggestion</button>
      <button onClick={listSuggestions}>List Suggestions</button>
      {/* <h1>Hello {user.signInDetails?.loginId}</h1>
      <button onClick={signOut}>Sign out</button> */}
      <div>
        Please work.
      </div>
    </main>
  )
};

export default App;