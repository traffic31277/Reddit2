import { useState } from 'react';
import React from 'react';
import '../css/navbar.css';

// just one button
function NavigationButton ({label, destination}) {
    return (
        <a href={destination}>
          <h2>{label}</h2>
        </a>
    );
};

function NavigationBar () {
    return (
      <div className='navbar'>
        <ul>
          <li><NavigationButton label='Home' destination='../html/Home.html'/></li>
          <li><NavigationButton label='Weekly Leaderboard' destination='../html/Leaderboard.html'/></li>
          <li><NavigationButton label='Archive' destination='../html/Home.html'/></li>
        </ul>
      </div>
    );
};

export default NavigationBar;