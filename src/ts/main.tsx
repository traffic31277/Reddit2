import React from 'react';
import ReactDOM from 'react-dom/client';
import { Authenticator } from '@aws-amplify/ui-react';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from "aws-amplify";
import Login from './login.tsx';
import MakeSuggestion from './MakeSuggestion.tsx';
import Mailbox from './mailbox.tsx';
import outputs from '../../amplify_outputs.json';
import Leaderboard from './leaderboard.tsx';
import '@aws-amplify/ui-react/styles.css';
import '../css/index.css';
import {
    BrowserRouter as Router,
    Routes, Route,
    Link
} from 'react-router-dom';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/mail' element={<Mailbox/>}/> 
        <Route path='/leaderboard' element={<Leaderboard/>}/>
        <Route path='/suggest' element={<MakeSuggestion/>}/>
      </Routes>
    </Router>
  </React.StrictMode>
);
