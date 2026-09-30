import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserContext } from '../context/UserContext';
import LoadingScreen from '../components/LoadingScreen';
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
  const { programsLoading } = useContext(UserContext);

  const programData = {
    'Future Fortunes': {
      type: 'ONE_TIME',
      url: 'https://www.futurefortunesinc.com/foals/',
    },
    'Breeders Challenge': {
      type: 'ONE_TIME',
      url: 'https://breederschallenge.com/search-nominations/',
    },
    'Select Stallion Stakes': {
      type: 'ONE_TIME',
      url: 'https://www.selectstallionstakes.com/sssfoal',
    },
    'Pink Buckle': {
      type: 'ANNUAL',
      url: 'https://pinkbuckle.com/nomination/2/2026-nomination-form',
    },
    'Ruby Buckle': {
      type: 'ANNUAL',
      url: 'https://therubybuckle.com/nomination/100/2026-nomination-form',
    },
  };

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

  const handleProgramStatusChange = (programName, newStatus) => {
    setEditData(prev => {
      const currentPrograms = prev.programs || [];
      const programIndex = currentPrograms.findIndex(p => p.name === programName);
      
      if (programIndex >= 0) {
        const updatedPrograms = [...currentPrograms];
        updatedPrograms[programIndex] = {
          ...updatedPrograms[programIndex],
          status: newStatus
        };

        if (newStatus === 'Eligible - Paid') {
          updatedPrograms[programIndex].paidDate = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'Not Eligible') {
          updatedPrograms[programIndex].paidDate = null;
        }

        return {
          ...prev,
          programs: updatedPrograms
        };
      }
      return prev;
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

  const handleMarkAsPaid = async (programName) => {
    try {
      const horseRef = doc(db, 'horses', id);
      const updatedPrograms = horse.programs.map(prog => {
        if (prog.name === programName) {
          const isAnnual = programData[prog.name]?.type === 'ANNUAL';
          
          if (isAnnual) {
            // For ANNUAL programs, set annualPaidFor to 'paid'
            return {
              ...prog,
              annualPaidFor: 'paid',
            };
          } else {
            // For ONE_TIME programs, set status to 'Eligible - Paid'
            return {
              ...prog,
              status: 'Eligible - Paid',
              paidDate: new Date().toISOString().split('T')[0],
            };
          }
        }
        return prog;
      });

      // Update Firestore
      await updateDoc(horseRef, {
        programs: updatedPrograms,
      });

      // Update local state
      setHorse(prev => ({
        ...prev,
        programs: updatedPrograms,
      }));
    } catch (err) {
      console.error('Error marking as paid:', err);
      setError('Failed to mark as paid');
    }
  };

  const getStatusBadge = (program) => {
    const isAnnual = programData[program.name]?.type === 'ANNUAL';

    // Handle ANNUAL programs (Pink/Ruby Buckle)
    if (isAnnual) {
      // Four nomination statuses: not-eligible, future-eligible, eligible-not-nominated, already-nominated
      
      if (program.nominationStatus === 'future-eligible') {
        // Will be eligible in the future
        return `⏳ Waiting to be Eligible – ${program.estimatedEligibleDate}`;
      }
      
      if (program.nominationStatus === 'eligible-not-nominated') {
        // Can nominate RIGHT NOW
        return '🔔 Eligible – Ready to Nominate';
      }
      
      if (program.nominationStatus === 'not-eligible') {
        // Can never nominate (wrong breed/type)
        return '❌ Not Eligible';
      }
      
      if (program.nominationStatus === 'already-nominated') {
        if (program.annualPaidFor === 'paid') {
          return '✓ Nominated & Paid';
        } else if (program.annualPaidFor === 'not-paid') {
          return '🔔 Nominated – Payment Due';
        }
        return '✓ Nominated';
      }
      
      return 'Not Selected';
    }

    // Handle ONE_TIME programs (Future Fortunes, Breeders Challenge, Select Stallion Stakes)
    if (program.status === 'Not Eligible') return '❌ Not Eligible';
    if (program.status === 'Eligible - Not Paid') return '🔔 Eligible – Not Paid';
    if (program.status === 'Eligible - Paid') return '✅ Paid for Life';
    return program.status;
  };

  if (loading) return <LoadingScreen />;
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
            <h2>Incentive Programs</h2>
            <div className="programs-grid">
              {horse.programs.map(program => (
                <div key={program.name} className="program-card">
                  <div className="program-header-card">
                    <h3>{program.name}</h3>
                  </div>

                  <div className="program-status-badge">
                    {getStatusBadge(program)}
                  </div>

                  {/* ONE_TIME Programs: Show fee & deadline if eligible but not paid */}
                  {programData[program.name]?.type === 'ONE_TIME' && program.status === 'Eligible - Not Paid' && program.estimatedFee && (
                    <div className="program-details-card">
                      <p><strong>Est. Fee:</strong> {program.estimatedFee}</p>
                      {program.deadline && <p><strong>Deadline:</strong> {program.deadline}</p>}
                    </div>
                  )}

                  {/* ANNUAL Programs (Pink/Ruby Buckle) */}
                  {programData[program.name]?.type === 'ANNUAL' && (
                    <>
                      {/* Show info if eligible and ready to nominate NOW */}
                      {program.nominationStatus === 'eligible-not-nominated' && (
                        <div className="program-details-card">
                          <p><strong>Initial Fee:</strong> {program.estimatedInitialFee}</p>
                          <p><strong>Deadline:</strong> {program.nominationDeadline}</p>
                          {program.reminderSet && <p className="reminder-note">📅 Reminder Set</p>}
                        </div>
                      )}

                      {/* Show info if waiting to be eligible */}
                      {program.nominationStatus === 'future-eligible' && program.estimatedEligibleDate && (
                        <div className="program-details-card">
                          <p><strong>Eligible On:</strong> {program.estimatedEligibleDate}</p>
                          <p><strong>Est. Initial Fee:</strong> {program.estimatedInitialFee}</p>
                          <p><strong>Deadline:</strong> {program.nominationDeadline}</p>
                          {program.reminderSet && <p className="reminder-note">📅 Reminder Set</p>}
                        </div>
                      )}

                      {/* Show annual dues if already nominated */}
                      {program.nominationStatus === 'already-nominated' && (
                        <div className="program-details-card">
                          <p><strong>Annual Fee:</strong> $220 (by Aug 1) or $350 (by Dec 1)</p>
                          {program.annualPaidFor === 'not-paid' && (
                            <p className="payment-due">Payment due this year</p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="program-card-actions">
                    <a 
                      href={programData[program.name]?.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      Visit Website →
                    </a>
                    {program.status === 'Eligible - Not Paid' && (
                      <button 
                        onClick={() => handleMarkAsPaid(program.name)}
                        className="btn-status"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {programData[program.name]?.type === 'ANNUAL' && program.nominationStatus === 'eligible-not-nominated' && (
                      <button 
                        onClick={() => handleMarkAsPaid(program.name)}
                        className="btn-status"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {programData[program.name]?.type === 'ANNUAL' && program.nominationStatus === 'already-nominated' && program.annualPaidFor === 'not-paid' && (
                      <button 
                        onClick={() => handleMarkAsPaid(program.name)}
                        className="btn-status"
                      >
                        Mark as Paid
                      </button>
                    )}
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
                {programsLoading ? (
                  <p style={{ color: '#546E7A', textAlign: 'center', padding: '1rem', margin: 0 }}>Loading programs...</p>
                ) : (
                  <div className="programs-checkbox-list">
                    {(editData.programs || []).map(program => (
                      <div key={program.name} className="program-edit-item">
                        <label>{program.name}</label>
                        <select 
                          value={program.status || ''}
                          onChange={(e) => handleProgramStatusChange(program.name, e.target.value)}
                        >
                          <option value="">Select status</option>
                          <option value="Not Eligible">Not Eligible</option>
                          <option value="Eligible - Not Paid">Eligible - Not Paid</option>
                          <option value="Eligible - Paid">Eligible - Paid</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
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