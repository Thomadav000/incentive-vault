import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import './Dashboard.css';

function Dashboard() {
  const { horses, loading, refreshHorses } = useContext(UserContext);
  const [stats, setStats] = useState({ totalHorses: 0, enrolledPrograms: 0, upcomingDeadlines: 0 });
  const [hoveredHorse, setHoveredHorse] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setStats({
      totalHorses: horses.length,
      enrolledPrograms: horses.reduce((sum, h) => sum + (h.programs?.length || 0), 0),
      upcomingDeadlines: 5,
    });
  }, [horses]);

  const handleDeleteHorse = async (horseId, horseName) => {
    try {
      const horseRef = doc(db, 'horses', horseId);
      await deleteDoc(horseRef);
      setDeleteConfirm(null);
      refreshHorses();
      alert(`${horseName} has been removed from your barn.`);
    } catch (error) {
      console.error('Error deleting horse:', error);
      alert('Failed to remove horse');
    }
  };

  if (loading) {
    return <div className="dashboard">Loading your barn...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1>Your Barn</h1>
          <div className="header-buttons">
            <button onClick={() => navigate('/generate-report')} className="btn-generate-report">Generate Report</button>
            <Link to="/add-horse" className="btn-add-horse">+ Add Horse</Link>
          </div>
        </header>

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
                <div 
                  key={horse.id} 
                  className="horse-card"
                  onMouseEnter={() => setHoveredHorse(horse.id)}
                  onMouseLeave={() => setHoveredHorse(null)}
                >
                  {horse.photo && <img src={horse.photo} alt={horse.barnName} />}
                  <div className="horse-info">
                    <h3>⭐ {horse.barnName}</h3>
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
                  
                  {hoveredHorse === horse.id && (
                    <button 
                      className="btn-delete-horse"
                      onClick={() => setDeleteConfirm(horse.id)}
                      title="Remove this horse"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Remove Horse</h2>
            <p>Are you sure you want to remove <strong>⭐ {horses.find(h => h.id === deleteConfirm)?.barnName}</strong>?</p>
            <p className="warning-text">This cannot be undone.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>No</button>
              <button className="btn-remove" onClick={() => handleDeleteHorse(deleteConfirm, horses.find(h => h.id === deleteConfirm)?.barnName)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;