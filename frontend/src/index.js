import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Schimbă cu './Login' dacă fișierul tău principal se numește direct Login.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
