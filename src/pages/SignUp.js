import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, functions } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import logoImage from '../assets/logo-full.png';
import './Auth.css';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedTier, setSelectedTier] = useState('tier2');
  const [isAnnual, setIsAnnual] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [stripe, setStripe] = useState(null);
  const [elements, setElements] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const cardElementRef = useRef(null);
  const navigate = useNavigate();

  const tiers = [
    { id: 'tier1', horses: '1-2 Horses', monthly: 3.99, annual: 38.30, monthlyPriceId: 'price_1UJusgDgYhWF2kJzxnjU4BzH', annualPriceId: 'price_1UJvCcDgYhWF2kJz2XDXdZji' },
    { id: 'tier2', horses: '3-5 Horses', monthly: 6.99, annual: 66.91, monthlyPriceId: 'price_1UJv0HDgYhWF2kJz9UycNSLi', annualPriceId: 'price_1UJvEHDgYhWF2kJzsvGdDlI3' },
    { id: 'tier3', horses: '6-10 Horses', monthly: 9.99, annual: 95.91, monthlyPriceId: 'price_1UJv35DgYhWF2kJzEStdcNGM', annualPriceId: 'price_1UJvGmDgYhWF2kJzShzxnMuM' },
    { id: 'tier4', horses: 'Unlimited Horses', monthly: 14.99, annual: 143.91, monthlyPriceId: 'price_1UJv4PDgYhWF2kJz1s78AMKR', annualPriceId: 'price_1UJvIKDgYhWF2kJz9sds8x33' },
  ];

  // Initialize Stripe
  useEffect(() => {
    const loadStripe = async () => {
      const stripeModule = await import('@stripe/stripe-js');
      const stripeInstance = await stripeModule.loadStripe('pk_test_51UIcg6DgYhWF2kJzEs2AkkH9K9Um5k31YdLfDmiKip701LnB5vjl9zhWkrtJVRjP8OUzu2ffaFZ5gJzd41mSPSSz00JzgepH2X');
      setStripe(stripeInstance);

      if (stripeInstance) {
        const elementsInstance = stripeInstance.elements();
        setElements(elementsInstance);

        const card = elementsInstance.create('card', {
          style: {
            base: {
              color: '#F9F8F6',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontSize: '16px',
              '::placeholder': {
                color: '#666',
              },
            },
            invalid: {
              color: '#FF6B6B',
            },
          },
        });
        setCardElement(card);
      }
    };

    loadStripe();
  }, []);

  // Mount card element when payment modal opens
  useEffect(() => {
    if (showPaymentModal && cardElement && cardElementRef.current && !cardElementRef.current.hasChildNodes()) {
      cardElement.mount(cardElementRef.current);
    }
  }, [showPaymentModal, cardElement]);

  const getPrice = (tier) => {
    return isAnnual ? tier.annual : tier.monthly;
  };

  const getPriceLabel = () => {
    return isAnnual ? '/year' : '/month';
  };

  const getPriceId = (tier) => {
    return isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
  };

  const getTrialEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleSignUpFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    setPaymentError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setLoading(true);

    try {
      if (!stripe || !elements || !cardElement) {
        setPaymentError('Payment system not ready');
        setLoading(false);
        return;
      }

      // Create payment method with Stripe
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: email,
          name: name,
        },
      });

      if (paymentMethodError) {
        setPaymentError(paymentMethodError.message);
        setLoading(false);
        return;
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name
      });

      // Save user profile with payment method ID
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: new Date(),
        selectedTier: selectedTier,
        trialStartDate: new Date(),
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        trialUsed: false,
        subscription: 'trial',
        paymentMethodId: paymentMethod.id,
      });

      // Call Cloud Function to create Stripe subscription
      const createSubscription = httpsCallable(functions, 'createSubscription');
      const selectedTierObj = tiers.find(t => t.id === selectedTier);
      
      await createSubscription({
        email: email,
        tierPrice: getPriceId(selectedTierObj),
        tierName: selectedTier,
        paymentMethodId: paymentMethod.id,
      });

      setShowPaymentModal(false);
      navigate('/dashboard');
    } catch (err) {
      setPaymentError(err.message || 'Payment failed');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentError('');
  };

  const selectedTierObj = tiers.find(t => t.id === selectedTier);
  const trialEndDate = getTrialEndDate();

  return (
    <div className="signup-container">
      <div className="signup-logo-section">
        <img src={logoImage} alt="Incentive Vault" className="signup-logo" />
      </div>

      <div className="signup-content">
        <div className="signup-form-section">
          <h2>Create Account</h2>

          {error && <div className="signup-error-message">{error}</div>}

          <form onSubmit={handleSignUpFormSubmit}>
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
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
          </form>

          <div className="signup-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>

        <div className="signup-pricing-section">
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
                <div className="tier-card-free">
                  <span className="free-text">7 Days FREE ✓</span>
                </div>
                <div className="tier-card-price">
                  <span className="price-label">Then</span>
                  <span className="price">${getPrice(tier).toFixed(2)}</span>
                  <span className="period">{getPriceLabel()}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="tier-reassurance">
            Need more horses later? Upgrade anytime with just a tap.
          </p>
        </div>
      </div>

      {showPaymentModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2>Add Payment Method</h2>
              <button 
                className="payment-modal-close" 
                onClick={closePaymentModal}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className="payment-modal-content">
              <div className="payment-trial-info">
                <p className="trial-message">
                  <strong>7 Days FREE Trial</strong>
                </p>
                <p className="trial-date">
                  Card required. You won't be charged until <strong>{trialEndDate}</strong>
                </p>
              </div>

              {paymentError && <div className="payment-error-message">{paymentError}</div>}

              <form onSubmit={handlePaymentSubmit}>
                <div className="payment-form-group">
                  <label>Card Details</label>
                  <div 
                    ref={cardElementRef}
                    className="stripe-card-element"
                  />
                </div>

                <div className="payment-summary">
                  <p>Plan: <strong>{selectedTierObj?.horses}</strong></p>
                  <p>First charge (in 7 days): <strong>${getPrice(selectedTierObj).toFixed(2)}{getPriceLabel()}</strong></p>
                </div>

                <button type="submit" className="payment-btn-submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm & Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SignUp;