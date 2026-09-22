import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import logoImage from '../assets/logo-full.png';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <img src={logoImage} alt="Incentive Vault" className="auth-logo" />
            <h1>Incentive Vault</h1>
          </div>

          <p className="auth-subtitle">Track. Manage. Never Miss a Deadline.</p>

          <h2>Welcome Back</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up here</Link></p>
            <Link to="/" className="back-home">← Back to Home</Link>
          </div>
        </div>

        <div className="auth-side">
          <div className="auth-side-content">
            <h3>Simplify Your Incentive Tracking</h3>
            <ul className="auth-features">
              <li>Track all programs in one place</li>
              <li>Never miss a deadline</li>
              <li>Manage unlimited horses</li>
              <li>Smart reminders & alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;