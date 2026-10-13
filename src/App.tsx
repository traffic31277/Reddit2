import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import outputs from '../amplify_outputs.json';


// generate database based on Schema
const client = generateClient<Schema>();

// list all messages in the datbase's model (Message)
const { data } = await client.models.Message.list();

// create a message
const { errors, data: newMessage } = await client.models.Message.create({
  text: 'My message text'
});


function App({ signOut, user }) {
  return (
    <Authenticator>
      <h1>Hello {user.username}</h1>
      <button onClick={signOut}>Sign out</button>
    </Authenticator>
  );
}

export default withAuthenticator(App);