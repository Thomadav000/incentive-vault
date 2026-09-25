import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { collection, addDoc, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AddHorse.css';

// Tier limits (outside component to avoid recreating on every render)
const tierLimits = {
  tier1: 2,
  tier2: 5,
  tier3: 10,
  tier4: Infinity,
};

// Pink & Ruby Buckle nomination fees
const annualNominationFees = {
  0: '$220 (by Aug 1) or $350 (by Dec 1)',  // Weanling
  1: 'Cannot nominate',                       // Yearling
  2: 'Cannot nominate',                       // 2-Year-Old
  3: '$2,000 (by Nov 1)',                    // 3-Year-Old
  4: '$3,000 (by Nov 1)',                    // 4-Year-Old
  5: 'Cannot nominate',                       // 5-8 Years
  9: '$4,000 (by Dec 1)',                    // 9+ Years
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
      { name: 'Pink Buckle', status: '', nominationStatus: null, annualPaidFor: null },
      { name: 'Ruby Buckle', status: '', nominationStatus: null, annualPaidFor: null },
    ],
  });
  const [photo, setPhoto] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userTier, setUserTier] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showFeeTable, setShowFeeTable] = useState(null); // 'Pink Buckle' or 'Ruby Buckle'
  const navigate = useNavigate();

  // Program data for one-time programs
  const programData = {
    'Future Fortunes': {
      type: 'ONE_TIME',
      deadline: '12/31',
      url: 'https://www.futurefortunesinc.com/foals/',
      fees: {
        0: '$175 (early by 11/01) / $275 (by 12/31)',
        1: '$375',
        2: '$1,000',
        3: '$1,500',
        4: '$2,000',
      },
    },
    'Breeders Challenge': {
      type: 'ONE_TIME',
      deadline: '12/01',
      url: 'https://breederschallenge.com/search-nominations/',
      fees: {
        0: '$250 (weanling - due by 12/01) or $1,250 (yearling late fee)',
        1: '$1,250 (yearling late fee)',
        2: '$2,500 (2-year-old late fee)',
        3: '$3,500 (3-year-old late fee)',
        4: '$5,000 (4+ late fee)',
      },
    },
    'Select Stallion Stakes': {
      type: 'ONE_TIME',
      deadline: '7 days before',
      url: 'https://www.selectstallionstakes.com/sssfoal',
      fees: {
        0: '$200',
        1: '$200',
        2: '$200',
        3: '$200',
        4: '$200',
      },
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

  // Fetch user tier and horse count on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.log('No user logged in');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const tier = userDoc.data().selectedTier || 'tier1';
          console.log('User tier from Firebase:', tier);
          setUserTier(tier);

          const horsesQuery = query(collection(db, 'horses'), where('userId', '==', user.uid));
          const horsesSnapshot = await getDocs(horsesQuery);
          console.log('Horse count:', horsesSnapshot.size);

          // Check if limit is already reached on page load
          const limit = tierLimits[tier];
          if (horsesSnapshot.size >= limit) {
            console.log('Limit already reached on page load');
            setLimitReached(true);
          }
        } else {
          console.log('User document does not exist');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();
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

  // Get nomination fee based on age
  const getNominationFee = (ageNum) => {
    if (ageNum === null) return 'N/A';
    if (ageNum === 0) return '$220 (by Aug 1) or $350 (by Dec 1)';
    if (ageNum === 1 || ageNum === 2) return 'Cannot nominate at this age';
    if (ageNum === 3) return '$2,000 (by Nov 1)';
    if (ageNum === 4) return '$3,000 (by Nov 1)';
    if (ageNum >= 5 && ageNum <= 8) return 'Cannot nominate at this age';
    if (ageNum >= 9) return '$4,000 (by Dec 1)';
    return 'N/A';
  };

  // Recalculate all program fees based on new age
  const recalculateProgramFees = (newFoalingYear) => {
    const ageNum = calculateAge(newFoalingYear);
    const ageGroup = getFeeForAge(ageNum);

    return formData.programs.map(prog => {
      if (programData[prog.name].type === 'ONE_TIME' && prog.status === 'Eligible - Not Paid') {
        return {
          ...prog,
          deadline: programData[prog.name].deadline,
          estimatedFee: programData[prog.name].fees[ageGroup],
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

    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          const updatedProg = { ...prog, status: newStatus };
          
          if (programData[programName].type === 'ONE_TIME' && newStatus === 'Eligible - Not Paid') {
            updatedProg.deadline = programData[programName].deadline;
            updatedProg.estimatedFee = programData[programName].fees[ageGroup];
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
            annualPaidFor: nominationStatus === 'not-nominated' ? null : prog.annualPaidFor,
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
        if (prop.name === programName) {
          return {
            ...prog,
            annualPaidFor: annualStatus,
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
      if (!verified) {
        setError('Please verify this horse on AQHA before submitting.');
        setLoading(false);
        return;
      }

      let photoURL = null;
      if (photo) {
        const photoRef = ref(storage, `horses/${auth.currentUser.uid}/${photo.name}`);
        await uploadBytes(photoRef, photo);
        photoURL = await getDownloadURL(photoRef);
      }

      const ageNum = calculateAge(formData.foalingYear);

      const programsToSave = formData.programs.map(prog => ({
        name: prog.name,
        status: prog.status || 'Not Eligible',
        deadline: prog.deadline || null,
        estimatedFee: prog.estimatedFee || null,
        paidDate: null,
        feeType: programData[prog.name].type,
        nominationStatus: prog.nominationStatus || null,
        annualPaidFor: prog.annualPaidFor || null,
      }));

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

  const ageNum = calculateAge(formData.foalingYear);
  const displayAge = getAgeDisplay(ageNum);
  const limit = tierLimits[userTier];
  const currentYear = new Date().getFullYear();

  return (
    <div className="add-horse-page">
      <div className="add-horse-container">
        <h1>Add a New Horse</h1>

        {/* Upfront limit warning banner */}
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
            {/* Step 1: Search & Verify */}
            <div className="form-section">
              <h2>1. Search & Verify Horse</h2>
              
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
                  placeholder="Official AQHA name"
                />
              </div>

              <div className="verification-box">
                <h3>Verify on AQHA</h3>
                <p>Visit AQHA's official pedigree database to verify registration details, sire, and full bloodline.</p>
                <a href="https://www.aqha.com/" target="_blank" rel="noopener noreferrer" className="btn-verify">
                  🔗 Open AQHA Pedigree Search
                </a>
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                  />
                  I've verified this horse on AQHA
                </label>
              </div>

              {verified && <div className="verified-badge">✓ Verified</div>}
            </div>

            {/* Step 2: Horse Info */}
            <div className="form-section">
              <h2>2. Horse Information</h2>
              
              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="AQHA #"
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

            {/* Step 3: Programs */}
            <div className="form-section">
              <h2>3. Incentive Programs</h2>
              <p>For each program, select your horse's eligibility status:</p>
              
              <div className="programs-list">
                {formData.programs.map(prog => (
                  <div key={prog.name} className="program-item">
                    <div className="program-header">
                      <h3>{prog.name}</h3>
                      <a 
                        href={programData[prog.name].url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="program-verify-link"
                      >
                        Verify Eligibility →
                      </a>
                    </div>

                    {/* Standard programs (ONE_TIME) */}
                    {programData[prog.name].type === 'ONE_TIME' && (
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
                    {(prog.name === 'Pink Buckle' || prog.name === 'Ruby Buckle') && (
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
                              onClick={() => setShowFeeTable(prog.name)}
                              className="btn-nomination btn-check-fees"
                            >
                              Check Fees
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

                        {/* Show annual status if already nominated */}
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

                        {/* Show payment details based on status */}
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

                        {prog.nominationStatus === 'not-eligible' && (
                          <div className="program-details">
                            <p className="not-eligible-note">Horse is not eligible for nomination.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="disclaimer-box">
                <p className="disclaimer-title">⚠️ Eligibility Verification Required</p>
                <p className="disclaimer-text">
                  Enrollment fees, deadlines, and eligibility requirements vary by program and may change. 
                  Please verify all information on each program's official website before enrolling your horse.
                </p>
              </div>
            </div>

            {/* Step 4: Photo & Notes */}
            <div className="form-section">
              <h2>4. Photo & Details (Optional)</h2>
              
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
                  <th>Annual Fee (Flat)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Weanling</td>
                  <td>Can nominate</td>
                  <td>$220</td>
                  <td>$220 (Aug 1) or $350 (Dec 1)</td>
                </tr>
                <tr>
                  <td>Yearling</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>2-Year-Old</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>3-Year-Old</td>
                  <td>Can nominate</td>
                  <td>$2,000</td>
                  <td>$220 (Aug 1) or $350 (Dec 1)</td>
                </tr>
                <tr>
                  <td>4-Year-Old</td>
                  <td>Can nominate</td>
                  <td>$3,000</td>
                  <td>$220 (Aug 1) or $350 (Dec 1)</td>
                </tr>
                <tr>
                  <td>5-8 Years</td>
                  <td>Cannot nominate</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>9+ Years</td>
                  <td>Can nominate</td>
                  <td>$4,000</td>
                  <td>$220 (Aug 1) or $350 (Dec 1)</td>
                </tr>
              </tbody>
            </table>
            <div className="fee-table-note">
              <p><strong>Note:</strong> Regardless of age, once nominated, horses always pay a flat $220 or $350 annually (depending on deadline).</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddHorse;