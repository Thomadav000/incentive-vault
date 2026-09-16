import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Change this to your admin password
  const ADMIN_PASSWORD = 'IncVault2026';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password === ADMIN_PASSWORD) {
      // Store admin session in localStorage
      localStorage.setItem('adminSession', 'true');
      navigate('/admin');
    } else {
      setError('Invalid password');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <div className="login-header">
          <span className="logo-icon">🏇</span>
          <h1>Admin Access</h1>
        </div>

        <p className="login-subtitle">Enter admin password</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="login-footer">
          <button 
            onClick={() => navigate('/')} 
            className="btn-back-link"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
