import React from 'react';
import '../css/mailbox.css';

export default function SuggestionPage() {
  const handleSubmit = () => {
    alert('Submit suggestion clicked!');
  };

  return (
    <div className="suggestion-container">
   
      <main className="content-section">
        <img
          src="/mailbox.png" 
          alt="Mailbox with letter" 
          className="mailbox-icon"
        />

        <button className="submit-btn" onClick={handleSubmit}>
          Submit Suggestion
        </button>
      </main>
    </div>
  );
}