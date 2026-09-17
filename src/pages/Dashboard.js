import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './Dashboard.css';

function Dashboard() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHorses: 0, enrolledPrograms: 0, upcomingDeadlines: 0 });
  const navigate = useNavigate();

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
          upcomingDeadlines: 5,
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
          <div className="header-buttons">
            <button onClick={() => navigate('/generate-report')} className="btn-generate-report">📄 Generate Report</button>
            <Link to="/add-horse" className="btn-add-horse">+ Add Horse</Link>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🐴</div>
            <div className="stat-content">
              <p