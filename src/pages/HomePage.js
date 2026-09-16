import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import './HomePage.css';

function HomePage() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [horses, setHorses] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // Fetch user's name
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserName(userDocSnap.data().name);
          }

          // Fetch user's horses
          const horsesRef = collection(db, 'horses');
          const horsesQuery = query(horsesRef, where('userId', '==', currentUser.uid));
          const horsesSnapshot = await getDocs(horsesQuery);
          const horsesList = horsesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHorses(horsesList);

          // Fetch all programs
          const programsRef = collection(db, 'programs');
          const programsSnapshot = await getDocs(programsRef);
          const programsList = programsSnapshot.docs.map(doc => doc.data());

          // Calculate upcoming deadlines
          const deadlines = [];
          horsesList.forEach(horse => {
            if (horse.programs && Array.isArray(horse.programs)) {
              horse.programs.forEach(programName => {
                const program = programsList.find(p => p.name === programName);
                if (program) {
                  deadlines.push({
                    horseName: horse.name,
                    programName: program.name,
                    deadline: program.deadline,
                    horseId: horse.id
                  });
                }
              });
            }
          });

          // Sort by deadline
          deadlines.sort((a, b) => {
            const monthOrder = {
              'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5,
              'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10,
              'November': 11, 'December': 12
            };
            const monthA = a.deadline.split(' ')[0];
            const monthB = b.deadline.split(' ')[0];
            return monthOrder[monthA] - monthOrder[monthB];
          });

          setUpcomingDeadlines(deadlines.slice(0, 5));
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserName('');
        setHorses([]);
        setUpcomingDeadlines([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="home-page">Loading...</div>;
  }

  // LOGGED IN VIEW - DASHBOARD
  if (user) {
    return (
      <div className="home-page dashboard-page">
        <header className="home-header">
          <div className="header-content">
            <div 
              className="header-logo" 
              onClick={() => navigate('/')} 
              style={{ cursor: 'pointer' }}
            >
              <span className="logo-icon">🏇</span>
              <h1>Incentive Vault</h1>
            </div>
          </div>
        </header>

        <section className="dashboard-hero">
          <div className="container">
            <h2>Welcome back, {userName}!</h2>
            <p>{horses.length} horse{horses.length !== 1 ? 's' : ''} • {upcomingDeadlines.length} upcoming deadlines</p>
          </div>
        </section>

        <section className="dashboard-container">
          <div className="container">
            <div className="dashboard-grid">
              {/* Upcoming Deadlines Column */}
              <div className="dashboard-column deadlines-column">
                <h3>📅 Next Deadlines</h3>
                {upcomingDeadlines.length > 0 ? (
                  <div className="cards-stack">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="compact-card deadline-card">
                        <div className="card-header">{deadline.programName}</div>
                        <div className="card-body">
                          <p className="card-horse">{deadline.horseName}</p>
                          <p className="card-date">{deadline.deadline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No upcoming deadlines</p>
                )}
              </div>

              {/* Horses Column */}
              <div className="dashboard-column horses-column">
                <h3>🐴 Your Horses</h3>
                {horses.length > 0 ? (
                  <div className="cards-stack">
                    {horses.map(horse => (
                      <div 
                        key={horse.id} 
                        className="compact-card horse-card"
                        onClick={() => navigate(`/horse/${horse.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="card-header">{horse.name}</div>
                        <div className="card-body">
                          <p className="card-detail">{horse.color}</p>
                          <p className="card-detail">{horse.age} years old</p>
                          <p className="card-programs">{horse.programs ? horse.programs.length : 0} programs</p>
                        </div>
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

              {/* Actions Column */}
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
                    <span className="stat-value">{upcomingDeadlines.length}</span>
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

  // NOT LOGGED IN VIEW (original homepage)
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