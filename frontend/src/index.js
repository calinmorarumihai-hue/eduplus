import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Aceasta va fi componenta ta principală care conține rutele

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
