import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import LoadingScreen from '../components/LoadingScreen';
import './Dashboard.css';

function Dashboard() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHorses: 0, enrolledPrograms: 0, upcomingDeadlines: 0 });
  const [hoveredMoreBadge, setHoveredMoreBadge] = useState(null);

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

  const handleDeleteHorse = async (horseId) => {
    if (window.confirm('Are you sure you want to delete this horse? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'horses', horseId));
        setHorses(horses.filter(h => h.id !== horseId));
        setStats(prev => ({
          ...prev,
          totalHorses: prev.totalHorses - 1
        }));
      } catch (error) {
        console.error('Error deleting horse:', error);
        alert('Failed to delete horse');
      }
    }
  };

  // Determine badge status and color
  const getBadgeStatus = (program) => {
    // Hide if not eligible
    if (program.status === 'Not Eligible') {
      return null;
    }

    // ONE_TIME programs
    if (program.feeType === 'ONE_TIME') {
      if (program.status === 'Eligible - Paid') {
        return 'paid'; // Green
      } else if (program.status === 'Eligible - Not Paid') {
        return 'not-paid'; // Red
      }
      return null; // Hide if neither
    }

    // ANNUAL programs (Pink/Ruby Buckle)
    if (program.feeType === 'ANNUAL') {
      // Already nominated and paid
      if (program.nominationStatus === 'already-nominated' && program.annualPaidFor !== 'not-paid') {
        return 'paid'; // Green
      }
      // Already nominated but annual not paid
      if (program.nominationStatus === 'already-nominated' && program.annualPaidFor === 'not-paid') {
        return 'not-paid'; // Red
      }
      // Eligible but not yet nominated
      if (program.nominationStatus === 'eligible-not-nominated') {
        return 'not-paid'; // Red
      }
      // Future eligible (waiting to be eligible)
      if (program.nominationStatus === 'future-eligible') {
        return 'not-paid'; // Red
      }
    }

    return null; // Hide by default
  };

  if (loading) {
    return <LoadingScreen />;
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
              {horses.map(horse => {
                // Filter programs: only show if not "Not Eligible"
                const eligiblePrograms = horse.programs?.filter(prog => {
                  const badgeStatus = getBadgeStatus(prog);
                  return badgeStatus !== null;
                }) || [];

                return (
                  <div key={horse.id} className="horse-card">
                    <button 
                      onClick={() => handleDeleteHorse(horse.id)} 
                      className="btn-delete-corner" 
                      title="Delete horse"
                    >
                      ✕
                    </button>
                    {horse.photo && <img src={horse.photo} alt={horse.barnName} />}
                    <div className="horse-info">
                      <h3>{horse.barnName}</h3>
                      <p className="horse-meta">
                        {horse.sire && <span>By {horse.sire}</span>}
                        {horse.age && <span>{horse.age} yrs</span>}
                      </p>
                    </div>
                    <div className="horse-programs">
                      {eligiblePrograms.slice(0, 3).map(program => {
                        const badgeStatus = getBadgeStatus(program);
                        return (
                          <span 
                            key={program.name} 
                            className={`program-badge badge-${badgeStatus}`}
                          >
                            {program.name}
                          </span>
                        );
                      })}
                      {eligiblePrograms.length > 3 && (
                        <div className="more-programs-container"
                          onMouseEnter={() => setHoveredMoreBadge(horse.id)}
                          onMouseLeave={() => setHoveredMoreBadge(null)}
                        >
                          <span className="program-badge more-badge">+{eligiblePrograms.length - 3}</span>
                          {hoveredMoreBadge === horse.id && (
                            <div className="more-programs-tooltip">
                              {eligiblePrograms.slice(3).map(program => {
                                const badgeStatus = getBadgeStatus(program);
                                return (
                                  <div 
                                    key={program.name} 
                                    className={`tooltip-item tooltip-${badgeStatus}`}
                                  >
                                    {program.name}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Link to={`/horse/${horse.id}`} className="btn-secondary">View Details</Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;