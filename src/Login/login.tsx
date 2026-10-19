import { useState } from 'react'
import React from 'react'
import './login.css'

export default function App() {
  return (
    <div className="login-page"> 
      <div className="login-card">
        <h1>Login</h1>

        <label htmlFor="username">Username</label>
        <input id="username" type="text" />

        <label htmlFor="password">Password</label>
        <input id="password" type="password" />

        <button type="button">Login</button>
      </div>
    </div>
  );
}