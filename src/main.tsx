import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from "aws-amplify";
import App from './App.tsx';
// import Leaderboard from './Leaderboard/leaderboard.tsx';
import Login from './ts/login.tsx';

import '@aws-amplify/ui-react/styles.css';
import './index.css';

// Finds the HTML element with id="root" and renders the React application inside it
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Login />
  </React.StrictMode>
);
