import React from 'react';
import '../css/mailbox.css';
import '../css/index.css';

function Mailbox() {

  const handleNavigation = () => {
    return location.href='../html/leaderboard.html'
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
    </div>
  );
}

export default Mailbox