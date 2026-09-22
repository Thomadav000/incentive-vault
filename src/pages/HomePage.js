import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { UserContext } from '../context/UserContext';
import './HomePage.css';

function HomePage() {
  const { horses, programs, user, loading } = useContext(UserContext);
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
            if (prog.deadline && prog.status !== 'Not Eligible') {
              if (!programDeadlines[prog.name]) {
                programDeadlines[prog.name] = {
                  deadline: prog.deadline,
                  horses: []
                };
              }
              programDeadlines[prog.name].horses.push({
                barnName: horse.barnName,
                status: prog.status,
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
            <span className="logo-icon">🏇</span>
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
          <h2>Never Miss an Incentive Deadline Again</h2>
          <p>Track barrel horse incentive programs, deadlines, and payments all in one place</p>
          <Link to="/signup" className="btn-cta">Get Started Free</Link>
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