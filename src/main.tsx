import React from 'react';
import ReactDOM from 'react-dom/client';

import '@aws-amplify/ui-react/styles.css';

import { Amplify } from "aws-amplify";
import App from './App.tsx';
import MakeSuggestion from "./MakeSuggestion.tsx"
import './index.css';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);

// Finds the HTML element with id="root" and renders the React application inside it
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <MakeSuggestion />
  </React.StrictMode>
);
