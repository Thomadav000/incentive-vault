import React from 'react';
import ReactDOM from 'react-dom/client';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from './stripe';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </React.StrictMode>
);