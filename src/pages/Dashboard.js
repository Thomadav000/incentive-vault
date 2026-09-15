import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';

function Dashboard() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHorses: 0, enrolledPrograms: 0, upcomingDeadlines: 0 });

  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const q = query(collection(db, 'horses'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const horsesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHorses(horsesData);
        setStats({
          totalHorses: horsesData.length,
          enrolledPrograms: horsesData.reduce((sum, h) => sum + (h.programs?.length || 0), 0),
          upcomingDeadlines: 5, // Placeholder - calculate from programs
        });
      } catch (error) {
        console.error('Error fetching horses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchHorses();
    }
  }, []);

  if (loading) {
    return <div className="dashboard">Loading your barn...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Your Barn</h1>
          <Link to="/add-horse" className="btn-add-horse">+ Add Horse</Link>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🐴</div>
            <div className="stat-content">
              <p className="stat-label">Total Horses</p>
              <p className="stat-value">{stats.totalHorses}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <p className="stat-label">Enrolled Programs</p>
              <p className="stat-value">{stats.enrolledPrograms}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔔</div>
            <div className="stat-content">
              <p className="stat-label">Upcoming Deadlines</p>
              <p className="stat-value">{stats.upcomingDeadlines}</p>
            </div>
          </div>
        </div>

        {/* Horses Grid */}
        <section className="horses-section">
          <h2>Your Horses</h2>
          {horses.length === 0 ? (
            <div className="empty-state">
              <p>No horses added yet</p>
              <Link to="/add-horse" className="btn-primary">Add Your First Horse</Link>
            </div>
          ) : (
            <div className="horses-grid">
              {horses.map(horse => (
                <div key={horse.id} className="horse-card">
                  {horse.photo && <img src={horse.photo} alt={horse.name} />}
                  <div className="horse-info">
                    <h3>{horse.name}</h3>
                    <p className="horse-meta">
                      {horse.sire && <span>By {horse.sire}</span>}
                      {horse.age && <span>{horse.age} yrs</span>}
                    </p>
                  </div>
                  <div className="horse-programs">
                    {horse.programs?.slice(0, 3).map(program => (
                      <span key={program} className="program-badge">{program}</span>
                    ))}
                    {horse.programs?.length > 3 && <span className="program-badge">+{horse.programs.length - 3}</span>}
                  </div>
                  <Link to={`/horse/${horse.id}`} className="btn-secondary">View Details</Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
