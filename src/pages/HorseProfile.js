import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import './HorseProfile.css';

function HorseProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { programs } = useContext(UserContext);
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [programPaidStatus, setProgramPaidStatus] = useState({});

  useEffect(() => {
    const fetchHorse = async () => {
      try {
        const horseRef = doc(db, 'horses', id);
        const horseSnap = await getDoc(horseRef);

        if (horseSnap.exists()) {
          const horseData = horseSnap.data();
          setHorse(horseData);
          setProgramPaidStatus(horseData.programsPaid || {});
        } else {
          alert('Horse not found');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching horse:', error);
        alert('Error loading horse');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchHorse();
  }, [id, navigate]);

  const handleMarkAsPaid = async (programName) => {
    try {
      const horseRef = doc(db, 'horses', id);
      const newStatus = { ...programPaidStatus };
      newStatus[programName] = !newStatus[programName];
      setProgramPaidStatus(newStatus);

      await updateDoc(horseRef, {
        programsPaid: newStatus
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  if (loading) {
    return <div className="horse-profile">Loading...</div>;
  }

  if (!horse) {
    return <div className="horse-profile">Horse not found</div>;
  }

  return (
    <div className="horse-profile">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate('/dashboard')}>← Back to Barn</button>

        <div className="profile-header">
          <h1>{horse.barnName}</h1>
          <p className="registered-name">Registered: {horse.registeredName}</p>
          <div className="horse-details">
            <span>Reg# {horse.registrationNumber || 'N/A'}</span>
            <span>{horse.age} years old</span>
            <span>{horse.color}</span>
          </div>
        </div>

        {horse.sire && <p className="sire-info">By {horse.sire}</p>}

        <section className="enrolled-programs">
          <h2>Enrolled Programs</h2>
          {horse.programs && horse.programs.length > 0 ? (
            <div className="programs-list">
              {horse.programs.map(programName => {
                const program = programs[programName];
                const isPaid = programPaidStatus[programName];

                return (
                  <div key={programName} className="program-card">
                    <div className="program-header">
                      <h3>{programName}</h3>
                      <div className={`status-badge ${isPaid ? 'paid' : 'unpaid'}`}>
                        {isPaid ? '✓ Paid' : 'Action Needed'}
                      </div>
                    </div>

                    {program && (
                      <div className="program-info">
                        <p className="deadline">Next Payment Due: {program.deadline}</p>
                        <p className="fee">Fee: {program[`fee${horse.age}yo`] || 'TBD'}</p>
                      </div>
                    )}

                    <div className="program-actions">
                      <a href={program?.website} target="_blank" rel="noopener noreferrer" className="btn-website">
                        Visit Website
                      </a>
                      <button
                        onClick={() => handleMarkAsPaid(programName)}
                        className={`btn-status ${isPaid ? 'btn-unpaid' : 'btn-paid'}`}
                      >
                        {isPaid ? '✓ Mark as Unpaid' : 'Mark as Paid'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-programs">No programs enrolled yet</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default HorseProfile;