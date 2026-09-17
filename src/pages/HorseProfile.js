import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import './HorseProfile.css';

function HorseProfile() {
  const { id } = useParams();
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();
  const { programs } = useContext(UserContext);
  const programList = Object.keys(programs || {});

  useEffect(() => {
    const fetchHorse = async () => {
      try {
        const docRef = doc(db, 'horses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setHorse(data);
          setEditData(data);
        }
      } catch (error) {
        console.error('Error fetching horse:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHorse();
  }, [id]);

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProgramToggle = (programName) => {
    setEditData(prev => {
      const currentPrograms = prev.programs || [];
      if (currentPrograms.includes(programName)) {
        return {
          ...prev,
          programs: currentPrograms.filter(p => p !== programName)
        };
      } else {
        return {
          ...prev,
          programs: [...currentPrograms, programName]
        };
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.barnName?.trim()) {
      setError('Barn name is required');
      return;
    }
    if (!editData.registeredName?.trim()) {
      setError('Registered name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const horseRef = doc(db, 'horses', id);
      await updateDoc(horseRef, {
        barnName: editData.barnName,
        registeredName: editData.registeredName,
        color: editData.color,
        foalingYear: editData.foalingYear,
        age: editData.age,
        sire: editData.sire,
        programs: editData.programs || []
      });

      setHorse(editData);
      setEditing(false);
    } catch (err) {
      console.error('Error updating horse:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(horse);
    setEditing(false);
    setError('');
  };

  if (loading) return <div className="horse-profile">Loading...</div>;
  if (!horse) return <div className="horse-profile">Horse not found</div>;

  return (
    <div className="horse-profile">
      <div className="horse-profile-container">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Back to Barn</button>

        <div className="horse-header">
          {horse.photo && <img src={horse.photo} alt={horse.barnName} />}
          <div className="horse-header-info">
            <div className="header-title-row">
              <h1>{horse.barnName}</h1>
              <button onClick={() => setEditing(true)} className="btn-edit-horse" title="Edit horse">⚙️</button>
            </div>
            <p className="horse-registered">Registered: {horse.registeredName}</p>
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
                    <button className="btn-secondary">Visit Website →</button>
                    <button className="btn-status">Mark as Paid</button>
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

      {editing && (
        <div className="edit-modal-overlay" onClick={handleCancelEdit}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Horse</h2>
              <button className="modal-close" onClick={handleCancelEdit}>✕</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-body">
              <div className="form-group">
                <label>Barn Name *</label>
                <input
                  type="text"
                  value={editData.barnName || ''}
                  onChange={(e) => handleEditChange('barnName', e.target.value)}
                  placeholder="Barn name"
                />
              </div>

              <div className="form-group">
                <label>Registered Name *</label>
                <input
                  type="text"
                  value={editData.registeredName || ''}
                  onChange={(e) => handleEditChange('registeredName', e.target.value)}
                  placeholder="AQHA registered name"
                />
              </div>

              <div className="form-group">
                <label>Color</label>
                <input
                  type="text"
                  value={editData.color || ''}
                  onChange={(e) => handleEditChange('color', e.target.value)}
                  placeholder="e.g., Bay, Sorrel, Palomino"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Foaling Year</label>
                  <input
                    type="number"
                    value={editData.foalingYear || ''}
                    onChange={(e) => handleEditChange('foalingYear', e.target.value)}
                    placeholder="2020"
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    value={editData.age || ''}
                    onChange={(e) => handleEditChange('age', e.target.value)}
                    placeholder="Age in years"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Sire</label>
                <input
                  type="text"
                  value={editData.sire || ''}
                  onChange={(e) => handleEditChange('sire', e.target.value)}
                  placeholder="Sire name"
                />
              </div>

              <div className="form-group">
                <label>Programs</label>
                <div className="programs-checkbox-list">
                  {programList.map(programName => (
                    <div key={programName} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={`program-${programName}`}
                        checked={(editData.programs || []).includes(programName)}
                        onChange={() => handleProgramToggle(programName)}
                      />
                      <label htmlFor={`program-${programName}`}>{programName}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="btn-save">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HorseProfile;