import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo-full.png';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="about-page">
      <header className="about-header">
        <div className="container">
          <Link to="/" className="about-header-logo">
            <span>Incentive Vault</span>
          </Link>
        </div>
      </header>

      <section className="about-hero">
        <div className="container">
          <h1>All Incentives in One Place</h1>
          <p>Centralize your incentive program tracking across all disciplines</p>
        </div>
      </section>

      <section className="about-visual">
        <div className="container">
          <div className="visual-wrapper">
            <img src={logoImage} alt="Incentive Vault" className="about-logo" />
            <div className="slideshow-placeholder">
              {/* Slideshow will go here */}
            </div>
          </div>
        </div>
      </section>

      <section className="about-problem">
        <div className="container">
          <div className="content-wrapper">
            <h2>The Challenge</h2>
            <p>
              Tracking multiple incentive programs is chaotic. You juggle deadlines across different websites, 
              manage enrollment fees for each horse, monitor eligibility status, and coordinate payments. 
              Critical deadlines slip through the cracks. Money is left on the table. You never know if you're 
              actually eligible until it's too late.
            </p>
          </div>
        </div>
      </section>

      <section className="about-solution">
        <div className="container">
          <div className="content-wrapper">
            <h2>The Solution</h2>
            <p>
              Incentive Vault brings every program into one centralized dashboard. Track all your deadlines, 
              manage unlimited horses, monitor payment status, and receive smart reminders so you never miss 
              an opportunity again. One platform. Complete clarity. Total peace of mind.
            </p>
          </div>
        </div>
      </section>

      <section className="about-features">
        <div className="container">
          <h2>Why Incentive Vault</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">📍</div>
              <h3>Centralized Deadline Tracking</h3>
              <p>All program deadlines in one place. Never miss an enrollment window or payment deadline across any discipline.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">💰</div>
              <h3>Payment & Eligibility Management</h3>
              <p>Track which programs you've paid for, monitor your eligibility status, and see estimated fees upfront.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🐴</div>
              <h3>Multi-Horse Support</h3>
              <p>Manage unlimited horses with individual eligibility tracking, payment history, and program enrollment.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🔔</div>
              <h3>Smart Reminders</h3>
              <p>Get iOS and Android notifications plus email alerts for upcoming deadlines, so critical dates never slip your mind.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-why-matters">
        <div className="container">
          <div className="content-wrapper">
            <h2>Why It Matters</h2>
            <p>
              Every missed deadline costs money. Every overlooked eligibility requirement wastes opportunity. 
              Incentive Vault eliminates that friction. You focus on what you do best — riding — while we keep 
              track of the programs, the deadlines, and the payments. Peace of mind. Clarity. Control.
            </p>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container">
          <h2>Ready to simplify your incentive tracking?</h2>
          <Link to="/signup" className="cta-button">Start Free Today</Link>
        </div>
      </section>

      <footer className="about-footer">
        <div className="container">
          <p>&copy; 2026 Incentive Vault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AboutPage;