import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-icon">🏇</span>
            <h1>Incentive Vault</h1>
          </div>
          <div className="header-nav">
            <Link to="/login" className="btn-link">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h2>Never Miss an Incentive Deadline Again</h2>
          <p>Track barrel horse incentive programs, deadlines, and payments all in one place</p>
          <Link to="/signup" className="btn-cta">Get Started Free</Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h3>Why Incentive Vault?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h4>Track All Programs</h4>
              <p>Monitor all 5 major barrel racing incentive programs in one dashboard</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h4>Smart Reminders</h4>
              <p>Get email reminders 1 week, 3 days, and 1 day before important deadlines</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🐴</div>
              <h4>Manage Multiple Horses</h4>
              <p>Add unlimited horses and track each one's eligibility and payments</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h4>Calendar View</h4>
              <p>See all enrollment deadlines, payments, and race dates at a glance</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h4>Payment Tracking</h4>
              <p>Monitor which programs you've paid and which need attention</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h4>Document Storage</h4>
              <p>Upload and store registration papers, pedigrees, and payment proofs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <h3>Simple, Transparent Pricing</h3>
          <div className="pricing-grid">
            <div className="pricing-card free">
              <h4>Free</h4>
              <div className="price">$0<span>/month</span></div>
              <ul className="pricing-features">
                <li>✓ 2 horses</li>
                <li>✓ View all programs</li>
                <li>✓ Manual tracking</li>
                <li>✓ Basic reminders</li>
              </ul>
              <button className="btn-secondary" disabled>Get Started</button>
            </div>

            <div className="pricing-card rider">
              <h4>Rider</h4>
              <div className="price">$6.99<span>/month</span></div>
              <p className="or">or $59.99/year</p>
              <ul className="pricing-features">
                <li>✓ Unlimited horses</li>
                <li>✓ All 5 programs</li>
                <li>✓ Smart reminders</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment tracking</li>
                <li>✓ Document upload</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>

            <div className="pricing-card trainer">
              <h4>Trainer</h4>
              <div className="price">$19.99<span>/month</span></div>
              <p className="or">or $149.99/year</p>
              <ul className="pricing-features">
                <li>✓ Everything in Rider</li>
                <li>✓ Multi-user access</li>
                <li>✓ Client management</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h3>Ready to take control of your barrel racing incentives?</h3>
          <Link to="/signup" className="btn-cta">Create Your Account Today</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Incentive Vault. All rights reserved.</p>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
