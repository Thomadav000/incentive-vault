import React from 'react';
import logoImage from '../assets/logo-full.png';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <img src={logoImage} alt="Loading..." className="loading-logo" />
      </div>
    </div>
  );
}

export default LoadingScreen;
