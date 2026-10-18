/*
  Code Reviewed by Brandon
  October 17, 2026
*/

import { Amplify } from 'aws-amplify';
import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useAuthenticator } from '@aws-amplify/ui-react';


// generate database based on Schema
const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();

  return (
    <>
      <h1>Hello {user.signInDetails?.loginId}</h1>
      <button onClick={signOut}>Sign out</button>
    </>
  )
};

export default App;