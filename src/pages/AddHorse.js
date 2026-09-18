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
    programs: [],
  });
  const [photo, setPhoto] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const programsData = [
    {
      name: 'Future Fortunes',
      url: 'https://www.futurefortunesinc.com/foals/'
    },
    {
      name: 'Pink Buckle',
      url: 'https://pinkbuckle.com/nomination/2/2026-nomination-form'
    },
    {
      name: 'Ruby Buckle',
      url: 'https://therubybuckle.com/nomination/100/2026-nomination-form'
    },
    {
      name: 'Breeders Challenge',
      url: 'https://breederschallenge.com/search-nominations/'
    },
    {
      name: 'Select Stallion Stakes',
      url: 'https://www.selectstallionstakes.com/sssfoal'
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate age from foaling year
    if (name === 'foalingYear' && value) {
      const currentYear = new Date().getFullYear();
      const calculatedAge = currentYear - parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: calculatedAge > 0 ? calculatedAge : ''
      }));
    }
    // Auto-calculate foaling year from age
    else if (name === 'age' && value) {
      const currentYear = new Date().getFullYear();
      const calculatedYear = currentYear - parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        foalingYear: calculatedYear > 0 ? calculatedYear : ''
      }));
    }
    // Normal change for other fields
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleProgramToggle = (program) => {
    setFormData(prev => ({
      ...prev,
      programs: prev.programs.includes(program)
        ? prev.programs.filter(p => p !== program)
        : [...prev.programs, program]
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

      await addDoc(collection(db, 'horses'), {
        ...formData,
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
                placeholder="e.g., Speedy Racer"
                required
              />
            </div>

            <div className="form-group">
              <label>Registered Name *</label>
              <input
                type="text"
                name="registeredName"
                value={formData.registeredName}
                onChange={handleChange}
                placeholder="e.g., Aint Bubblin Yet"
                required
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
                />
              </div>
            </div>
          </div>

          {/* Step 3: Programs */}
          <div className="form-section">
            <h2>3. Incentive Programs</h2>
            
            <div className="disclaimer-box">
              <p className="disclaimer-title">⚠️ Eligibility Verification Required</p>
              <p className="disclaimer-text">You are responsible for verifying that your horse is eligible for each program before enrolling. Click the program links below to visit each incentive's official website and confirm your horse meets the requirements (sire, age, bloodline, etc.).</p>
            </div>

            <p>Select which programs you're enrolling in:</p>
            <div className="programs-list">
              {programsData.map(program => (
                <div key={program.name} className="program-item">
                  <label className="program-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.programs.includes(program.name)}
                      onChange={() => handleProgramToggle(program.name)}
                    />
                    {program.name}
                  </label>
                  <a href={program.url} target="_blank" rel="noopener noreferrer" className="program-link">
                    Verify Eligibility →
                  </a>
                </div>
              ))}
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