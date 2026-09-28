import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { UserContext } from '../context/UserContext';
import logoImage from '../assets/logo-full.png';
import './HomePage.css';

function HomePage() {
  const { horses, user, loading } = useContext(UserContext);
  const [userName, setUserName] = useState('');
  const [deadlinesByProgram, setDeadlinesByProgram] = useState({});
  const [expandedProgram, setExpandedProgram] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserName(user.displayName || 'there');
      
      const programDeadlines = {};
      
      horses.forEach(horse => {
        if (horse.programs && Array.isArray(horse.programs)) {
          horse.programs.forEach(prog => {
            let hasDeadline = false;
            let deadlineDate = null;
            let statusDisplay = null;

            // ONE_TIME programs (Future Fortunes, Breeders Challenge, Select Stallion Stakes)
            if (prog.deadline && prog.status === 'Eligible - Not Paid') {
              hasDeadline = true;
              deadlineDate = prog.deadline;
              statusDisplay = prog.status;
            } else if (prog.deadline && prog.status === 'Eligible - Paid') {
              // Don't show paid programs
              hasDeadline = false;
            }

            // ANNUAL programs (Pink/Ruby Buckle)
            // Show eligibility reminder if waiting to be eligible
            if (prog.estimatedEligibleDate && prog.nominationStatus === 'not-eligible') {
              hasDeadline = true;
              deadlineDate = prog.estimatedEligibleDate;
              statusDisplay = `Waiting to be Eligible – ${prog.estimatedInitialFee}`;
            }

            // Show annual dues if already nominated and not paid
            if (prog.nominationStatus === 'already-nominated' && prog.annualPaidFor === 'not-paid') {
              hasDeadline = true;
              deadlineDate = 'Aug 1 / Dec 1'; // Annual dues dates
              statusDisplay = 'Annual Dues Due';
            }

            if (hasDeadline && deadlineDate) {
              if (!programDeadlines[prog.name]) {
                programDeadlines[prog.name] = {
                  deadline: deadlineDate,
                  horses: []
                };
              }
              programDeadlines[prog.name].horses.push({
                barnName: horse.barnName,
                status: statusDisplay,
                horseId: horse.id
              });
            }
          });
        }
      });
      
      setDeadlinesByProgram(programDeadlines);
    }
  }, [user, horses]);

  const toggleProgram = (programName) => {
    setExpandedProgram(expandedProgram === programName ? null : programName);
  };

  if (loading) {
    return <div className="home-page">Loading...</div>;
  }

  if (user) {
    return (
      <div className="home-page dashboard-page">
        <section className="dashboard-hero">
          <div className="container">
            <h2>Welcome back, {userName}!</h2>
            <p>{horses.length} horse{horses.length !== 1 ? 's' : ''} • {Object.keys(deadlinesByProgram).length} upcoming deadlines</p>
          </div>
        </section>

        <section className="dashboard-logo">
          <img src={logoImage} alt="Incentive Vault" />
        </section>

        <section className="dashboard-container">
          <div className="container">
            <div className="dashboard-grid">
              <div className="dashboard-column deadlines-column">
                <h3>📅 Next Deadlines</h3>
                {Object.keys(deadlinesByProgram).length > 0 ? (
                  <div className="programs-accordion">
                    {Object.entries(deadlinesByProgram).map(([programName, data]) => (
                      <div key={programName} className="accordion-item">
                        <button 
                          className="accordion-header"
                          onClick={() => toggleProgram(programName)}
                        >
                          <span className="program-info">
                            <span className="program-name">{programName}</span>
                            <span className="program-deadline">{data.deadline}</span>
                          </span>
                          <span className="horse-count">{data.horses.length} horse{data.horses.length !== 1 ? 's' : ''}</span>
                          <span className="accordion-icon">{expandedProgram === programName ? '▼' : '▶'}</span>
                        </button>
                        {expandedProgram === programName && (
                          <div className="accordion-content">
                            {data.horses.map((horse, idx) => (
                              <div key={idx} className="horse-item">
                                <p className="horse-name">{horse.barnName}</p>
                                <p className="horse-status">{horse.status}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No upcoming deadlines</p>
                )}
              </div>

              <div className="dashboard-column horses-column">
                <h3>🐴 Your Horses</h3>
                {horses.length > 0 ? (
                  <div className="horses-list">
                    {horses.map(horse => (
                      <div 
                        key={horse.id} 
                        className="horse-list-item"
                        onClick={() => navigate(`/horse/${horse.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="horse-list-info">
                          <p className="horse-list-name">{horse.barnName}</p>
                          <p className="horse-list-meta">{horse.color} • {horse.age} yrs</p>
                        </div>
                        <p className="horse-list-programs">{horse.programs ? horse.programs.length : 0} programs</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No horses yet</p>
                    <Link to="/add-horse" className="link-action">Add one →</Link>
                  </div>
                )}
              </div>

              <div className="dashboard-column actions-column">
                <h3>⚡ Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    onClick={() => navigate('/add-horse')} 
                    className="action-btn"
                  >
                    <span className="action-icon">➕</span>
                    <span>Add Horse</span>
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')} 
                    className="action-btn"
                  >
                    <span className="action-icon">🏚️</span>
                    <span>Full Barn</span>
                  </button>
                  <button 
                    onClick={() => navigate('/calendar')} 
                    className="action-btn"
                  >
                    <span className="action-icon">📅</span>
                    <span>Calendar</span>
                  </button>
                </div>

                <div className="stats-section">
                  <h4>Stats</h4>
                  <div className="stat-item">
                    <span className="stat-label">Total Horses</span>
                    <span className="stat-value">{horses.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Programs Tracked</span>
                    <span className="stat-value">{Object.keys(deadlinesByProgram).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2026 Incentive Vault. All rights reserved.</p>
            <button onClick={() => auth.signOut()} className="btn-link">Sign Out</button>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <div className="header-logo">
            <img src={logoImage} alt="Incentive Vault" className="home-logo-img" />
            <h1>Incentive Vault</h1>
          </div>
          <div className="header-nav">
            <Link to="/login" className="btn-link">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <div className="hero-wrapper">
            <div className="hero-logo">
              <img src={logoImage} alt="Incentive Vault" className="hero-logo-img" />
            </div>
            <div className="hero-content">
              <h2>Never Miss an Incentive Deadline Again</h2>
              <p>Track barrel horse incentive programs, deadlines, and payments all in one place</p>
              <Link to="/signup" className="btn-cta">Get Started Free</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="slideshow-section">
        <div className="container">
          <div className="slideshow-wrapper">
            <div className="slideshow-column">
              <div className="slideshow-placeholder">
                {/* Barrel horse incentive programs slideshow will go here */}
              </div>
            </div>
            <div className="problem-solution-column">
              <div className="problem-box">
                <h3>The Challenge</h3>
                <p>Tracking multiple incentive programs is chaotic. You juggle deadlines across different websites, manage enrollment fees for each horse, monitor eligibility status, and coordinate payments. Critical deadlines slip through the cracks. Money is left on the table.</p>
              </div>
              <div className="solution-box">
                <h3>The Solution</h3>
                <p>Incentive Vault brings every program into one centralized dashboard. Track all your deadlines, manage unlimited horses, monitor payment status, and receive smart reminders so you never miss an opportunity again. One platform. Complete clarity. Total peace of mind.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="pricing">
        <div className="container">
          <h3>Simple, Transparent Pricing</h3>
          <p className="pricing-subtitle">Pay only for the number of horses you track</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h4>1-2 Horses</h4>
              </div>
              <div className="pricing-free">
                <span className="free-badge">7 Days FREE</span>
              </div>
              <div className="pricing-price">
                <span className="price">$3.99</span>
                <span className="period">/month</span>
              </div>
              <div className="pricing-annual">
                <span className="annual-price">$38.30/year</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Spreadsheet export (Excel/PDF)</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment tracking</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h4>3-5 Horses</h4>
              </div>
              <div className="pricing-free">
                <span className="free-badge">7 Days FREE</span>
              </div>
              <div className="pricing-price">
                <span className="price">$6.99</span>
                <span className="period">/month</span>
              </div>
              <div className="pricing-annual">
                <span className="annual-price">$66.91/year</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Spreadsheet export (Excel/PDF)</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment tracking</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h4>6-10 Horses</h4>
              </div>
              <div className="pricing-free">
                <span className="free-badge">7 Days FREE</span>
              </div>
              <div className="pricing-price">
                <span className="price">$9.99</span>
                <span className="period">/month</span>
              </div>
              <div className="pricing-annual">
                <span className="annual-price">$95.91/year</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Spreadsheet export (Excel/PDF)</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment tracking</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h4>Unlimited Horses</h4>
                <span className="pricing-tagline">Great for Breeders</span>
              </div>
              <div className="pricing-free">
                <span className="free-badge">7 Days FREE</span>
              </div>
              <div className="pricing-price">
                <span className="price">$14.99</span>
                <span className="period">/month</span>
              </div>
              <div className="pricing-annual">
                <span className="annual-price">$143.91/year</span>
              </div>
              <ul className="pricing-features">
                <li>✓ Spreadsheet export (Excel/PDF)</li>
                <li>✓ Calendar view</li>
                <li>✓ Payment tracking</li>
              </ul>
              <Link to="/signup" className="btn-primary">Start Free Trial</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h3>Ready to take control of your barrel racing incentives?</h3>
          <Link to="/signup" className="btn-cta">Create Your Account Today</Link>
        </div>
      </section>

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