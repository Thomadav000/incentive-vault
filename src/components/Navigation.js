import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import './Navigation.css';

function Navigation() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className={`nav-menu ${showMenu ? 'active' : ''}`}>
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/add-horse" className="nav-link">
            Add Horse
          </Link>
          <Link to="/dashboard" className="nav-link">
            Your Barn
          </Link>
          <Link to="/fee-tracker" className="nav-link">
            The Vault
          </Link>
          <Link to="/calendar" className="nav-link">
            Calendar
          </Link>
          <Link to="/profile" className="nav-link">
            Profile
          </Link>
          <button onClick={handleLogout} className="nav-link logout-btn">
            Logout
          </button>
        </div>

        <Link to="/" className="navbar-logo-center">
          <span className="navbar-logo-text">IV</span>
        </Link>

        <button 
          className="hamburger"
          onClick={() => setShowMenu(!showMenu)}
        >
          ☰
        </button>
      </div>
    </nav>
  );
}

export default Navigation;