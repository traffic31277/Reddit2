import { useEffect, useState } from 'react';
import type { Schema } from '../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { withAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import outputs from '../amplify_outputs.json';

function App({}) {
  return (
    <div>
      <h1>Hello this is the suggestions tester branch</h1>
    </div>
  );
}

export default withAuthenticator(App);