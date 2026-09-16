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
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏇</span>
          Incentive Vault
        </Link>

        <div className={`nav-menu ${showMenu ? 'active' : ''}`}>
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/dashboard" className="nav-link">
            Your Barn
          </Link>
          <Link to="/calendar" className="nav-link">
            Calendar
          </Link>
          <Link to="/add-horse" className="nav-link">
            Add Horse
          </Link>
          <button onClick={handleLogout} className="nav-link logout-btn">
            Logout
          </button>
        </div>

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