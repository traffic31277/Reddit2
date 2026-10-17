import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from "aws-amplify";
import App from './App.tsx';
import Leaderboard from './leaderboard_page.tsx';
import NavigationBar from './navbar.tsx';
import '@aws-amplify/ui-react/styles.css';
import '../css/index.css';

// Finds the HTML element with id="root" and renders the React application inside it
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Leaderboard></Leaderboard>
    <NavigationBar></NavigationBar>
  </React.StrictMode>
);
