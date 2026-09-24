import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import logoImage from '../assets/logo-full.png';
import './Auth.css';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState('tier2'); // Default to 3-5 horses
  const [isAnnual, setIsAnnual] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const tiers = [
    { id: 'tier1', horses: '1-2 Horses', monthly: 3.99, annual: 47.88 },
    { id: 'tier2', horses: '3-5 Horses', monthly: 6.99, annual: 83.88 },
    { id: 'tier3', horses: '6-10 Horses', monthly: 9.99, annual: 119.88 },
    { id: 'tier4', horses: 'Unlimited Horses', monthly: 14.99, annual: 179.88 },
  ];

  const getPrice = (tier) => {
    return isAnnual ? tier.annual : tier.monthly;
  };

  const getPriceLabel = () => {
    return isAnnual ? '/year' : '/month';
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set display name in Firebase Auth
      await updateProfile(user, {
        displayName: name
      });

      // Create user profile in Firestore with tier selection
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date(),
        selectedTier: selectedTier,
        trialStartDate: new Date(),
        trialUsed: false,
        subscription: 'trial',
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Logo centered at top */}
      <div className="signup-logo-section">
        <img src={logoImage} alt="Incentive Vault" className="signup-logo" />
      </div>

      {/* Main content: two columns */}
      <div className="signup-content">
        {/* LEFT: Form */}
        <div className="signup-form-section">
          <h2>Create Account</h2>

          {error && <div className="signup-error-message">{error}</div>}

          <form onSubmit={handleSignUp}>
            <div className="signup-form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="signup-form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="signup-form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="signup-form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="signup-btn-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>

        {/* RIGHT: Pricing Tiers */}
        <div className="signup-pricing-section">
          {/* Toggle buttons */}
          <div className="pricing-toggle">
            <button
              className={`toggle-btn ${!isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${isAnnual ? 'active' : ''}`}
              onClick={() => setIsAnnual(true)}
            >
              Annual — SAVE 20%
            </button>
          </div>

          {/* Tier cards grid: 2x2 */}
          <div className="tier-cards-grid">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
                onClick={() => setSelectedTier(tier.id)}
              >
                <div className="tier-card-header">
                  <h3>{tier.horses}</h3>
                </div>
                <div className="tier-card-price">
                  <span className="price">${getPrice(tier).toFixed(2)}</span>
                  <span className="period">{getPriceLabel()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reassurance text */}
          <p className="tier-reassurance">
            Need more horses later? Upgrade anytime with just a tap.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;