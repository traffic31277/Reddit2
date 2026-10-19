import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from "aws-amplify";
import App from './App.tsx';
import Login from './login.tsx';
import NavigatorBar from './navbar.tsx';
import Mailbox from './mailbox.tsx';
import outputs from '../../amplify_outputs.json';
import Leaderboard from './leaderboard_page.tsx';
import '@aws-amplify/ui-react/styles.css';
import '../css/index.css';


Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Login />
    <NavigatorBar />
  </React.StrictMode>
);
