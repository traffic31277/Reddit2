import React from 'react';
import '../css/mailbox.css';
import { useNavigate } from 'react-router-dom';


export default function MyComponent() {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/suggestion'); 
  };


  return (
    <div className="suggestion-container">
   
      <main className="content-section">
        <img
          src="/mailbox.png" 
          alt="Mailbox with letter" 
          className="mailbox-icon"
        />

        <button className="submit-btn" onClick={handleNavigate}>
          Submit Suggestion
        </button>
      </main>
    </div>
  );
}