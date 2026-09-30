import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import LoadingScreen from '../components/LoadingScreen';
import './AddHorse.css';

// Tier limits (outside component to avoid recreating on every render)
const tierLimits = {
  tier1: 2,
  tier2: 5,
  tier3: 10,
  tier4: Infinity,
};

function AddHorse() {
  const [formData, setFormData] = useState({
    barnName: '',
    registeredName: '',
    sire: '',
    registrationNumber: '',
    sex: '',
    color: '',
    foalingYear: '',
    notes: '',
    programs: [
      { name: 'Future Fortunes', status: '', deadline: '', estimatedFee: '' },
      { name: 'Breeders Challenge', status: '', deadline: '', estimatedFee: '' },
      { name: 'Select Stallion Stakes', status: '', deadline: '', estimatedFee: '' },
      { name: 'Pink Buckle', status: '', nominationStatus: null, annualPaidFor: null, estimatedEligibleDate: null, estimatedInitialFee: null, nominationDeadline: null, reminderSet: false },
      { name: 'Ruby Buckle', status: '', nominationStatus: null, annualPaidFor: null, estimatedEligibleDate: null, estimatedInitialFee: null, nominationDeadline: null, reminderSet: false },
    ],
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTier, setUserTier] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showFeeTable, setShowFeeTable] = useState(null);
  const [programData, setProgramData] = useState({}); // Firestore programs
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch programs from Firestore and user data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('No user logged in');
          return;
        }

        // Fetch user tier and horse count
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const tier = userDoc.data().selectedTier || 'tier1';
          console.log('User tier from Firebase:', tier);
          setUserTier(tier);

          const horsesQuery = query(collection(db, 'horses'), where('userId', '==', user.uid));
          const horsesSnapshot = await getDocs(horsesQuery);
          console.log('Horse count:', horsesSnapshot.size);

          const limit = tierLimits[tier];
          if (horsesSnapshot.size >= limit) {
            console.log('Limit already reached on page load');
            setLimitReached(true);
          }
        } else {
          console.log('User document does not exist');
        }

        // Fetch programs from Firestore
        const programsSnapshot = await getDocs(collection(db, 'programs'));
        const programs = {};
        programsSnapshot.forEach(doc => {
          programs[doc.data().name] = doc.data();
        });
        console.log('Programs loaded from Firestore:', programs);
        setProgramData(programs);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate age from foaling year
  const calculateAge = (foalingYear) => {
    if (!foalingYear) return null;
    const currentYear = new Date().getFullYear();
    const ageNum = currentYear - parseInt(foalingYear);
    return ageNum;
  };

  // Format age display
  const getAgeDisplay = (ageNum) => {
    if (ageNum === null || ageNum === undefined) {
      return '--';
    }
    const age = Number(ageNum);
    if (age === 0) {
      return 'Weanling';
    }
    if (age === 1) {
      return '1-Yearling';
    }
    return age.toString();
  };

  // Get fee for current age
  const getFeeForAge = (ageNum) => {
    const ageGroup = (ageNum !== null && ageNum >= 4) ? 4 : (ageNum || 0);
    return ageGroup;
  };

  // Get nomination fee, deadline, and annual fee based on age
  const getNominationFeeInfo = (ageNum) => {
    if (ageNum === null) return { canNominate: false, initialFee: 'N/A', deadline: 'N/A', annualFee: 'N/A' };
    if (ageNum === 0) return { canNominate: true, initialFee: '$220', deadline: 'Aug 1 ($220) or Dec 1 ($350)', annualFee: '$220 (Aug 1) or $350 (Dec 1)' };
    if (ageNum === 1 || ageNum === 2) return { canNominate: false, initialFee: '—', deadline: '—', annualFee: '—' };
    if (ageNum === 3) return { canNominate: true, initialFee: '$2,000', deadline: 'Nov 1', annualFee: '$220 (Aug 1) or $350 (Dec 1)' };
    if (ageNum === 4) return { canNominate: true, initialFee: '$3,000', deadline: 'Nov 1', annualFee: '$220 (Aug 1) or $350 (Dec 1)' };
    if (ageNum >= 5 && ageNum <= 8) return { canNominate: false, initialFee: '—', deadline: '—', annualFee: '—' };
    if (ageNum >= 9) return { canNominate: true, initialFee: '$4,000', deadline: 'Dec 1', annualFee: '$220 (Aug 1) or $350 (Dec 1)' };
    return { canNominate: false, initialFee: 'N/A', deadline: 'N/A', annualFee: 'N/A' };
  };

  // Calculate eligible date and fee when horse is NOT YET eligible
  const getEligibilityDateAndFee = (ageNum, foalingYear) => {
    if (ageNum === null || !foalingYear) return { eligibleDate: null, initialFee: null, deadline: null };

    const feeInfo = getNominationFeeInfo(ageNum);
    
    if (feeInfo.canNominate) {
      return { eligibleDate: null, initialFee: null, deadline: null };
    }

    let eligibleAge = null;
    if (ageNum === 1 || ageNum === 2) {
      eligibleAge = 3;
    } else if (ageNum >= 5 && ageNum <= 8) {
      eligibleAge = 9;
    }

    if (eligibleAge === null) {
      return { eligibleDate: null, initialFee: null, deadline: null };
    }

    const foalingYearNum = parseInt(foalingYear);
    const eligibleYear = foalingYearNum + eligibleAge;
    const eligibleDate = `01/01/${eligibleYear}`;

    const futureAgeInfo = getNominationFeeInfo(eligibleAge);
    const initialFee = futureAgeInfo.initialFee;
    const deadline = futureAgeInfo.deadline;

    return { eligibleDate, initialFee, deadline };
  };

  // Recalculate all program fees based on new age (uses Firestore data)
  const recalculateProgramFees = (newFoalingYear) => {
    const ageNum = calculateAge(newFoalingYear);
    const ageGroup = getFeeForAge(ageNum);

    return formData.programs.map(prog => {
      const progInfo = programData[prog.name];
      if (progInfo && progInfo.type === 'ONE_TIME' && prog.status === 'Eligible - Not Paid') {
        return {
          ...prog,
          deadline: progInfo.deadline,
          estimatedFee: progInfo.fees[ageGroup],
        };
      }
      return prog;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'foalingYear') {
      const updatedPrograms = recalculateProgramFees(value);
      setFormData(prev => ({ ...prev, [name]: value, programs: updatedPrograms }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handlePhotoClick = () => {
    document.getElementById('photo-input').click();
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files[0]) {
      setPhoto(e.dataTransfer.files[0]);
    }
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleProgramStatusChange = (programName, newStatus) => {
    const ageNum = calculateAge(formData.foalingYear);
    const ageGroup = getFeeForAge(ageNum);
    const progInfo = programData[programName];

    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          const updatedProg = { ...prog, status: newStatus };
          
          if (progInfo && progInfo.type === 'ONE_TIME' && newStatus === 'Eligible - Not Paid') {
            updatedProg.deadline = progInfo.deadline;
            updatedProg.estimatedFee = progInfo.fees[ageGroup];
          } else if (newStatus === 'Eligible - Paid' || newStatus === 'Not Eligible') {
            updatedProg.deadline = '';
            updatedProg.estimatedFee = '';
          }
          
          return updatedProg;
        }
        return prog;
      }),
    }));
  };

  const handleNominationStatusChange = (programName, nominationStatus) => {
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          return {
            ...prog,
            nominationStatus: nominationStatus,
            annualPaidFor: nominationStatus === 'not-eligible' || nominationStatus === 'future-eligible' ? null : prog.annualPaidFor,
          };
        }
        return prog;
      }),
    }));
  };

  const handleAnnualStatusChange = (programName, annualStatus) => {
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          return {
            ...prog,
            annualPaidFor: annualStatus,
          };
        }
        return prog;
      }),
    }));
  };

  const handleCheckFees = (programName) => {
    const ageNum = calculateAge(formData.foalingYear);
    const feeInfo = getNominationFeeInfo(ageNum);

    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          if (feeInfo.canNominate) {
            // Horse CAN nominate at current age
            return {
              ...prog,
              nominationStatus: 'eligible-not-nominated',
              estimatedEligibleDate: null,
              estimatedInitialFee: feeInfo.initialFee,
              nominationDeadline: feeInfo.deadline,
            };
          } else {
            // Horse CANNOT nominate yet, calculate future eligible date
            const futureInfo = getEligibilityDateAndFee(ageNum, formData.foalingYear);
            return {
              ...prog,
              nominationStatus: 'future-eligible',
              estimatedEligibleDate: futureInfo.eligibleDate,
              estimatedInitialFee: futureInfo.initialFee,
              nominationDeadline: futureInfo.deadline,
            };
          }
        }
        return prog;
      }),
    }));

    // Open the fee table modal
    setShowFeeTable(programName);
  };

  const handleAddReminder = (programName) => {
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          return {
            ...prog,
            reminderSet: true,
          };
        }
        return prog;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      let photoURL = null;
      if (photo) {
        const photoRef = ref(storage, `horses/${auth.currentUser.uid}/${photo.name}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      const ageNum = calculateAge(formData.foalingYear);

      const programsToSave = formData.programs.map(prog => {
        const progInfo = programData[prog.name];
        return {
          name: prog.name,
          status: prog.status || 'Not Eligible',
          deadline: prog.deadline || null,
          estimatedFee: prog.estimatedFee || null,
          paidDate: null,
          feeType: progInfo ? progInfo.type : 'ONE_TIME',
          nominationStatus: prog.nominationStatus || null,
          annualPaidFor: prog.annualPaidFor || null,
          estimatedEligibleDate: prog.estimatedEligibleDate || null,
          estimatedInitialFee: prog.estimatedInitialFee || null,
          nominationDeadline: prog.nominationDeadline || null,
          reminderSet: prog.reminderSet || false,
        };
      });

      await addDoc(collection(db, 'horses'), {
        barnName: formData.barnName,
        registeredName: formData.registeredName,
        sire: formData.sire,
        registrationNumber: formData.registrationNumber,
        age: ageNum || 0,
        sex: formData.sex,
        color: formData.color,
        foalingYear: parseInt(formData.foalingYear) || null,
        notes: formData.notes,
        programs: programsToSave,
        photo: photoURL,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });

      navigate('/dashboard');
    } catch (err) {
      setError('Error adding horse: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/profile');
  };

  if (pageLoading) {
    return <LoadingScreen />;
  }

  const ageNum = calculateAge(formData.foalingYear);
  const displayAge = getAgeDisplay(ageNum);
  const limit = tierLimits[userTier];
  const currentYear = new Date().getFullYear();

  return (
    <div className="add-horse-page">
      <div className="add-horse-container">
        <h1>Add a New Horse</h1>

        {limitReached && (
          <div className="limit-warning-banner">
            <p className="limit-warning-icon">⚠️</p>
            <div className="limit-warning-content">
              <h3>You've reached your horse limit</h3>
              <p>Your {userTier === 'tier1' ? 'Basic' : userTier === 'tier2' ? 'Professional' : userTier === 'tier3' ? 'Elite' : 'Unlimited'} plan allows for <strong>{limit}</strong> horses. Upgrade your plan to add more.</p>
              <button onClick={handleUpgradeClick} className="btn-upgrade-banner">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}

        {!limitReached && (
          <form onSubmit={handleSubmit} className="add-horse-form">
            {/* Step 1: Horse Info */}
            <div className="form-section">
              <h2>Horse Information</h2>
              
              <div className="form-group">
                <label>Barn Name *</label>
                <input
                  type="text"
                  name="barnName"
                  value={formData.barnName}
                  onChange={handleChange}
                  placeholder="e.g., Aint Bubblin Yet"
                  required
                />
              </div>

              <div className="form-group">
                <label>Registered Name</label>
                <input
                  type="text"
                  name="registeredName"
                  value={formData.registeredName}
                  onChange={handleChange}
                  placeholder="Official registered name"
                />
              </div>

              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="AQHA, APHA, ApHC, Thoroughbred, Other"
                />
              </div>

              <div className="form-group">
                <label>Sire (Stallion)</label>
                <input
                  type="text"
                  name="sire"
                  value={formData.sire}
                  onChange={handleChange}
                  placeholder="e.g., Slick By Design"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Foaling Year</label>
                  <input
                    type="number"
                    name="foalingYear"
                    value={formData.foalingYear}
                    onChange={handleChange}
                    placeholder="2021"
                    min="1990"
                  />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <div className="age-display">
                    {displayAge}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="">Select...</option>
                    <option value="Mare">Mare</option>
                    <option value="Gelding">Gelding</option>
                    <option value="Stallion">Stallion</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g., Bay"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Programs */}
            <div className="form-section">
              <h2>Incentive Programs</h2>
              <p>For each program, select your horse's eligibility status:</p>
              
              <div className="programs-list">
                {formData.programs.map(prog => {
                  const progInfo = programData[prog.name];
                  if (!progInfo) return null; // Don't render until programData loads
                  
                  return (
                    <div key={prog.name} className="program-item">
                      <div className="program-header">
                        <h3>{prog.name}</h3>
                        <a 
                          href={progInfo.url || progInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="program-verify-link"
                        >
                          Verify Eligibility →
                        </a>
                      </div>

                      {/* Standard programs (ONE_TIME) */}
                      {progInfo.type === 'ONE_TIME' && (
                        <>
                          <div className="program-status-selector">
                            <label>Eligibility</label>
                            <select 
                              value={prog.status}
                              onChange={(e) => handleProgramStatusChange(prog.name, e.target.value)}
                            >
                              <option value="">Select eligibility status</option>
                              <option value="Not Eligible">Not Eligible</option>
                              <option value="Eligible - Not Paid">Eligible - Not Paid</option>
                              <option value="Eligible - Paid">Eligible - Paid</option>
                            </select>
                          </div>

                          {prog.status === 'Eligible - Paid' && (
                            <div className="program-paid-badge">
                              ✅ Paid for Life
                            </div>
                          )}

                          {prog.status === 'Eligible - Not Paid' && prog.estimatedFee && (
                            <div className="program-details">
                              <p><strong>Estimated Fee:</strong> {prog.estimatedFee}</p>
                              <p><strong>Deadline:</strong> {prog.deadline}</p>
                              <p className="disclaimer">Verify current fees on program website before enrolling.</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Pink & Ruby Buckle (ANNUAL) */}
                      {progInfo.type === 'ANNUAL' && (
                        <>
                          <div className="nomination-question">
                            <p>Has this horse ever been nominated to {prog.name}?</p>
                            <div className="nomination-buttons">
                              <button
                                type="button"
                                onClick={() => handleNominationStatusChange(prog.name, 'not-eligible')}
                                className={`btn-nomination ${prog.nominationStatus === 'not-eligible' ? 'active' : ''}`}
                              >
                                Not Eligible
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCheckFees(prog.name)}
                                className={`btn-nomination btn-check-fees ${prog.nominationStatus === 'eligible-not-nominated' || prog.nominationStatus === 'future-eligible' ? 'active' : ''}`}
                              >
                                No – Check Fees
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNominationStatusChange(prog.name, 'already-nominated')}
                                className={`btn-nomination ${prog.nominationStatus === 'already-nominated' ? 'active' : ''}`}
                              >
                                Yes, Already Nominated
                              </button>
                            </div>
                          </div>

                          {prog.nominationStatus === 'eligible-not-nominated' && (
                            <div className="program-details">
                              <p><strong>Current age allows nomination</strong></p>
                              <p><strong>Initial nomination fee:</strong> {prog.estimatedInitialFee}</p>
                              <p><strong>Nomination deadline:</strong> {prog.nominationDeadline}</p>
                              <button
                                type="button"
                                onClick={() => handleAddReminder(prog.name)}
                                className={`btn-add-reminder ${prog.reminderSet ? 'reminder-set' : ''}`}
                              >
                                {prog.reminderSet ? '📅 Reminder Set' : '📅 Add Reminder'}
                              </button>
                            </div>
                          )}

                          {prog.nominationStatus === 'future-eligible' && prog.estimatedEligibleDate && (
                            <div className="program-details">
                              <p><strong>Will be eligible on:</strong> {prog.estimatedEligibleDate}</p>
                              <p><strong>Estimated initial fee:</strong> {prog.estimatedInitialFee}</p>
                              <p><strong>Nomination deadline:</strong> {prog.nominationDeadline}</p>
                              <button
                                type="button"
                                onClick={() => handleAddReminder(prog.name)}
                                className={`btn-add-reminder ${prog.reminderSet ? 'reminder-set' : ''}`}
                              >
                                {prog.reminderSet ? '📅 Reminder Set' : '📅 Add Reminder'}
                              </button>
                            </div>
                          )}

                          {prog.nominationStatus === 'already-nominated' && (
                            <div className="annual-status-selector">
                              <label>Annual Payment Status</label>
                              <select 
                                value={prog.annualPaidFor || ''}
                                onChange={(e) => handleAnnualStatusChange(prog.name, e.target.value)}
                              >
                                <option value="">Select status</option>
                                <option value="paid">Annual Fee Paid for {currentYear}</option>
                                <option value="not-paid">Annual Fee Not Paid</option>
                              </select>
                            </div>
                          )}

                          {prog.nominationStatus === 'already-nominated' && prog.annualPaidFor === 'paid' && (
                            <div className="program-paid-badge">
                              ✅ Paid for {currentYear} (next due Aug {currentYear + 1})
                            </div>
                          )}

                          {prog.nominationStatus === 'already-nominated' && prog.annualPaidFor === 'not-paid' && (
                            <div className="program-details">
                              <p><strong>Annual Fee Due:</strong> $220 (by Aug 1) or $350 (by Dec 1)</p>
                              <p className="disclaimer">Annual nomination required every year to maintain eligibility.</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="disclaimer-box">
                <p className="disclaimer-title">⚠️ Eligibility Verification Required</p>
                <p className="disclaimer-text">
                  Enrollment fees, deadlines, and eligibility requirements vary by program and may change. 
                  Please verify all information on each program's official website before enrolling your horse.
                </p>
              </div>
            </div>

            {/* Step 3: Photo & Notes */}
            <div className="form-section">
              <h2>Photo & Details (Optional)</h2>
              
              <div className="form-group">
                <label>Horse Photo</label>
                <div 
                  className="photo-upload"
                  onClick={handlePhotoClick}
                  onDrop={handlePhotoDrop}
                  onDragOver={handlePhotoDragOver}
                >
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <p>📸 Click to upload or drag and drop</p>
                </div>
                {photo && <div className="photo-selected">✓ {photo.name}</div>}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional info about this horse..."
                  rows="4"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Adding Horse...' : 'Add Horse to Barn'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Fee Table Modal */}
      {showFeeTable && (
        <div className="modal-overlay" onClick={() => setShowFeeTable(null)}>
          <div className="fee-table-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fee-table-header">
              <h3>{showFeeTable} Nomination Fees</h3>
              <button onClick={() => setShowFeeTable(null)} className="btn-close-modal">✕</button>
            </div>
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Age</th>
                  <th>Status</th>
                  <th>Initial Fee (One-Time)</th>
                  <th>Deadline</th>
                  <th>Annual Fee</th>
                </tr>
              </thead>
              <tbody>
                <tr className={ageNum === 0 ? 'fee-table-highlighted' : ''}>
                  <td>Weanling</td>
                  <td>Can nominate</td>
                  <td>$220</td>
                  <td>Aug 1 or Dec 1</td>
                  <td>$220 (Aug) or $350 (Dec)</td>
                </tr>
                <tr className={ageNum === 1 ? 'fee-table-highlighted' : ''}>
                  <td>Yearling</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr className={ageNum === 2 ? 'fee-table-highlighted' : ''}>
                  <td>2-Year-Old</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr className={ageNum === 3 ? 'fee-table-highlighted' : ''}>
                  <td>3-Year-Old</td>
                  <td>Can nominate</td>
                  <td>$2,000</td>
                  <td>Nov 1</td>
                  <td>$220 (Aug) or $350 (Dec)</td>
                </tr>
                <tr className={ageNum === 4 ? 'fee-table-highlighted' : ''}>
                  <td>4-Year-Old</td>
                  <td>Can nominate</td>
                  <td>$3,000</td>
                  <td>Nov 1</td>
                  <td>$220 (Aug) or $350 (Dec)</td>
                </tr>
                <tr className={ageNum >= 5 && ageNum <= 8 ? 'fee-table-highlighted' : ''}>
                  <td>5-8 Years</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr className={ageNum >= 9 ? 'fee-table-highlighted' : ''}>
                  <td>9+ Years</td>
                  <td>Can nominate</td>
                  <td>$4,000</td>
                  <td>Dec 1</td>
                  <td>$220 (Aug) or $350 (Dec)</td>
                </tr>
              </tbody>
            </table>
            <div className="fee-table-note">
              <p><strong>Note:</strong> These are initial nomination fees. Once nominated, horses pay annual maintenance fees accordingly.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddHorse;