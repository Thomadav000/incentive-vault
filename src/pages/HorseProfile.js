import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import './HorseProfile.css';

function HorseProfile() {
  const { id } = useParams();
  const [horse, setHorse] = useState(null);
  const [programs, setPrograms] = useState({});
  const [programPaidStatus, setProgramPaidStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const programLinks = {
    'Future Fortunes': 'https://www.futurefortunesinc.com/foals/',
    'Pink Buckle': 'https://pinkbuckle.com/nomination/2/2026-nomination-form',
    'Ruby Buckle': 'https://therubybuckle.com/nomination/100/2026-nomination-form',
    'Breeders Challenge': 'https://breederschallenge.com/search-nominations/',
    'Select Stallion Stakes': 'https://www.selectstallionstakes.com/sssfoal'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch horse data
        const docRef = doc(db, 'horses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const horseData = { id: docSnap.id, ...docSnap.data() };
          setHorse(horseData);
          
          // Load paid status from horse data
          if (horseData.programsPaid) {
            setProgramPaidStatus(horseData.programsPaid);
          }
        }

        // Fetch all programs for deadlines
        const programsSnapshot = await getDocs(collection(db, 'programs'));
        const programsMap = {};
        programsSnapshot.forEach(doc => {
          programsMap[doc.data().name] = doc.data();
        });
        setPrograms(programsMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleVisitWebsite = (programName) => {
    const link = programLinks[programName];
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleMarkAsPaid = async (programName) => {
    try {
      const newPaidStatus = !programPaidStatus[programName];
      const updatedStatus = {
        ...programPaidStatus,
        [programName]: newPaidStatus
      };

      // Update in Firestore
      const horseRef = doc(db, 'horses', id);
      await updateDoc(horseRef, {
        programsPaid: updatedStatus
      });

      // Update local state
      setProgramPaidStatus(updatedStatus);
    } catch (error) {
      console.error('Error updating paid status:', error);
    }
  };

  const getDeadline = (programName) => {
    const program = programs[programName];
    return program ? program.deadline : 'TBD';
  };

  const isPaid = (programName) => {
    return programPaidStatus[programName] || false;
  };

  if (loading) return <div className="horse-profile">Loading...</div>;
  if (!horse) return <div className="horse-profile">Horse not found</div>;

  return (
    <div className="horse-profile">
      <div className="horse-profile-container">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Back to Barn</button>

        <div className="horse-header">
          {horse.photo && <img src={horse.photo} alt={horse.name} />}
          <div className="horse-header-info">
            <h1>{horse.name}</h1>
            {horse.sire && <p className="horse-sire">By {horse.sire}</p>}
            <div className="horse-details">
              {horse.registrationNumber && <span>Reg# {horse.registrationNumber}</span>}
              {horse.age && <span>{horse.age} years old</span>}
              {horse.color && <span>{horse.color}</span>}
            </div>
          </div>
        </div>

        {horse.programs && horse.programs.length > 0 && (
          <section className="programs-section">
            <h2>Enrolled Programs</h2>
            <div className="programs-list">
              {horse.programs.map(program => (
                <div key={program} className={`program-item ${isPaid(program) ? 'paid' : 'unpaid'}`}>
                  <div className="program-header">
                    <h3>{program}</h3>
                    <span className={`status-badge ${isPaid(program) ? 'paid-badge' : 'unpaid-badge'}`}>
                      {isPaid(program) ? '✓ Paid' : 'Action Needed'}
                    </span>
                  </div>
                  <p className="program-deadline">Next Payment Due: {getDeadline(program)}</p>
                  <div className="program-actions">
                    <button onClick={() => handleVisitWebsite(program)} className="btn-secondary">Visit Website</button>
                    <button 
                      onClick={() => handleMarkAsPaid(program)} 
                      className={`btn-status ${isPaid(program) ? 'btn-paid' : 'btn-unpaid'}`}
                    >
                      {isPaid(program) ? '✓ Mark as Unpaid' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {horse.notes && (
          <section className="notes-section">
            <h2>Notes</h2>
            <p>{horse.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}

export default HorseProfile;