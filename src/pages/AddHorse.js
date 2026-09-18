import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './AddHorse.css';

function AddHorse() {
  const [formData, setFormData] = useState({
    barnName: '',
    registeredName: '',
    sire: '',
    registrationNumber: '',
    age: '',
    sex: '',
    color: '',
    foalingYear: '',
    notes: '',
    programs: [
      { name: 'Future Fortunes', status: '', deadline: '', estimatedFee: '' },
      { name: 'Breeders Challenge', status: '', deadline: '', estimatedFee: '' },
      { name: 'Select Stallion Stakes', status: '', deadline: '', estimatedFee: '' },
      { name: 'Pink Buckle', status: '' },
      { name: 'Ruby Buckle', status: '' },
    ],
  });
  const [photo, setPhoto] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Program data for one-time programs
  const programData = {
    'Future Fortunes': {
      type: 'ONE_TIME',
      deadline: '12/31',
      url: 'https://www.futurefortunesinc.com/',
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
      url: 'https://www.breederschallenge.com/',
      fees: {
        0: '$250 (increases if enrolled after weanling year)',
        1: '$250+',
        2: '$250+',
        3: '$250+',
        4: '$250+',
      },
    },
    'Select Stallion Stakes': {
      type: 'ONE_TIME',
      deadline: '7 days before',
      url: 'https://www.selectstallionstakes.com/',
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
      url: 'https://www.pinkbuckle.com/',
    },
    'Ruby Buckle': {
      type: 'ANNUAL',
      url: 'https://www.therubybuckle.com/',
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { [name]: value };

    // Auto-calculate age from foaling year
    if (name === 'foalingYear' && value) {
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - parseInt(value);
      updatedData.age = calculatedAge.toString();
    }

    // Auto-calculate foaling year from age
    if (name === 'age' && value) {
      const currentYear = new Date().getFullYear();
      const calculatedFoalingYear = currentYear - parseInt(value);
      updatedData.foalingYear = calculatedFoalingYear.toString();
    }

    setFormData(prev => ({ ...prev, ...updatedData }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleProgramStatusChange = (programName, newStatus) => {
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.map(prog => {
        if (prog.name === programName) {
          const updatedProg = { ...prog, status: newStatus };
          
          // For one-time programs, populate deadline and fee when status changes
          if (programData[programName].type === 'ONE_TIME' && newStatus === 'Eligible - Not Paid') {
            const ageGroup = parseInt(formData.age) >= 4 ? 4 : parseInt(formData.age) || 0;
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

      // Clean up programs data: only include selected programs
      const programsToSave = formData.programs.map(prog => ({
        name: prog.name,
        status: prog.status || 'Not Eligible',
        deadline: prog.deadline || null,
        estimatedFee: prog.estimatedFee || null,
        paidDate: null,
        feeType: programData[prog.name].type,
      }));

      await addDoc(collection(db, 'horses'), {
        barnName: formData.barnName,
        registeredName: formData.registeredName,
        sire: formData.sire,
        registrationNumber: formData.registrationNumber,
        age: parseInt(formData.age) || 0,
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

  return (
    <div className="add-horse-page">
      <div className="add-horse-container">
        <h1>Add a New Horse</h1>
        
        {error && <div className="error-message">{error}</div>}

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
                <label>Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="3"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select name="sex" value={formData.sex} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Mare">Mare</option>
                  <option value="Gelding">Gelding</option>
                  <option value="Stallion">Stallion</option>
                </select>
              </div>
            </div>

            <div className="form-row">
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
              <div className="photo-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                <p>📸 Click to upload or drag and drop</p>
              </div>
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
      </div>
    </div>
  );
}

export default AddHorse;