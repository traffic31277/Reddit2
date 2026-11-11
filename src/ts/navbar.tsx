import { useState } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReactDOM from "react-dom/client";
import '../css/navbar.css';

// object for one button
function NavigationButton ({label, destination}: {label:String; destination:String}) {
  return (
    <a href={destination} className='navButton'>
      <p>{label}</p>
    </a>
  );
};

// full bar
function NavigationBar () {
    return (
      <div className='navbar'>
        <ul>
          <li><NavigationButton label='Home' destination='/mail'/></li>
          <li><NavigationButton label='Leaderboard' destination='/leaderboard'/></li>
          <li><NavigationButton label='Archive' destination='/archive'/></li>
        </ul>
      </div>
    );
};

export default NavigationBar;