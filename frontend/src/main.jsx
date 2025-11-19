/*
 * FILE: frontend/src/main.jsx
 * LOCATION: college-social-platform/frontend/src/main.jsx
 * PURPOSE: Application entry point for Vite
 */

// 🔥 FIX FOR SIMPLE-PEER: Add Node process polyfill BEFORE React starts
import process from "process";
window.process = process;

import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWithProviders from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
