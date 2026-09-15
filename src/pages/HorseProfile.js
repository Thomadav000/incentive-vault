import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './HorseProfile.css';

function HorseProfile() {
  const { id } = useParams();
  const [horse, setHorse] = useState(null);
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
    const fetchHorse = async () => {
      try {
        const docRef = doc(db, 'horses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHorse({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching horse:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHorse();
  }, [id]);

  const handleVisitWebsite = (programName) => {
    const link = programLinks[programName];
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleMarkAsPaid = (programName) => {
    alert(`Marked ${programName} as paid!`);
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
                <div key={program} className="program-item">
                  <h3>{program}</h3>
                  <div className="program-actions">
                    <button onClick={() => handleVisitWebsite(program)} className="btn-secondary">Visit Website</button>
                    <button onClick={() => handleMarkAsPaid(program)} className="btn-status">Mark as Paid</button>
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