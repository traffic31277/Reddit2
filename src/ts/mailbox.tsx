import React from 'react';
import '../css/mailbox.css';
import '../css/index.css';
import NavigationBar from './navbar';
import MakeSuggestions from './MakeSuggestion'; 
import { useNavigate } from 'react-router-dom';

function Mailbox() {

  const handleNavigation = () => {
    const navigate = useNavigate();

    const handleNavigation = () => {
    navigate('/MakeSuggestion'); 
    };
  };

  return (
    <div className="suggestion-container">
   
      <main className="content-section">
        <img
          src="/mailbox.png" 
          alt="Mailbox with letter" 
          className="mailbox-icon"
        />

        <button className="submit-btn" onClick={handleNavigation}>
          Submit Suggestion
        </button>
      </main>
      <NavigationBar />
    </div>
  );
}

export default Mailbox