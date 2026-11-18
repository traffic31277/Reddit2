import { useState } from 'react';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReactDOM from "react-dom/client";
import '../css/navbar.css';

// object for one button
function NavigationButton ({label, destination}: {label:String; destination:String}) {
  return (
    <a href={destination} className='navButton'>
      <h2><b>{label}</b></h2>
    </a>
  );
};

// full bar
function NavigationBar () {
    return (
      <div className='navbar'>
        <div><NavigationButton label='Home' destination='/mail'/></div>
        <div><NavigationButton label='Leaderboard' destination='/leaderboard'/></div>
        <div><NavigationButton label='Archive' destination='/archive'/></div>
      </div>
    );
};

export default NavigationBar;