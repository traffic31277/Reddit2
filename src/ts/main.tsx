import React from 'react';
import ReactDOM from 'react-dom/client';

import Login from './login.tsx';
import Signup from './signup.tsx';
import Verification from './verification.tsx';
import MakeSuggestion from './MakeSuggestion.tsx';
import Mailbox from './mailbox.tsx';
import Leaderboard from './leaderboard.tsx';
import Reset from './reset.tsx';
import ResetPassword from './resetPassword.tsx';

import '@aws-amplify/ui-react/styles.css';
import '../css/index.css';

import {
    BrowserRouter as Router,
    Routes, Route,
    Link
} from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Router>
        <Routes>
          <Route path='/' element={<Signup/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/reset' element={<Reset/>}/>
          <Route path='/resetPassword' element={<ResetPassword/>}/>
          <Route path='/verify' element={<Verification/>}/>
          <Route path='/mail' element={<Mailbox/>}/> 
          <Route path='/leaderboard' element={<Leaderboard/>}/>
          <Route path='/suggest' element={<MakeSuggestion/>}/>
        </Routes>
      </Router>
  </React.StrictMode>
);
