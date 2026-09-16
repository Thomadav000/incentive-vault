import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddHorse.css';

function AddHorse() {
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [sire, setSire] = useState('');
  const [color, setColor] = useState('');
  const [foalingYear, setFoalingYear] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [programs, setPrograms] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const currentYear = 2026;

  const handleFoalingYearChange = (e) => {
    const year = parseInt(e.target.value);
    setFoalingYear(e.target.value);
    
    if (year && year > 0 && year <= currentYear) {
      const age = currentYear - year;
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  };

  const handleProgramChange = (programName) => {
    setPrograms(prev => ({
      ...prev,
      [programName]: !prev[programName]
    }));
  };

  const handleAddHorse = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !sire || !color || !foalingYear || calculatedAge === null) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const selectedPrograms = Object.keys(programs).filter(program => programs[program]);

      const horseData = {
        name,
        registrationNumber,
        sire,
        color,
        foalingYear: parseInt(foalingYear),
        age: calculatedAge,
        programs: selectedPrograms,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'horses'), horseData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to add horse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-horse-container">
      <div className="add-horse-box">
        <h1>Add a Horse</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleAddHorse}>
          {/* Step 1: Basic Info */}
          <div className="form-section">
            <h2>1. Basic Information</h2>
            
            <div className="form-group">
              <label>Horse Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Aint Bubbon Yet"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Registration Number</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g., 6350381"
                />
              </div>
              <div className="form-group">
                <label>Sire (Father) *</label>
                <input
                  type="text"
                  value={sire}
                  onChange={(e) => setSire(e.target.value)}
                  placeholder="e.g., Aint Seen Nothin Yet"
                  required
                />
              </div>
            </div>
          </div>

          {/* Step 2: Appearance */}
          <div className="form-section">
            <h2>2. Appearance & Age</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Color *</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Palomino"
                  required
                />
              </div>
              <div className="form-group">
                <label>Foaling Year *</label>
                <input
                  type="number"
                  value={foalingYear}
                  onChange={handleFoalingYearChange}
                  placeholder="e.g., 2022"
                  min="1900"
                  max={currentYear}
                  required
                />
              </div>
            </div>

            {calculatedAge !== null && (
              <div className="calculated-age">
                <p><strong>Age: {calculatedAge} years old</strong></p>
              </div>
            )}
          </div>

          {/* Step 3: Incentive Programs */}
          <div className="form-section">
            <h2>3. Incentive Programs</h2>
            <p>Select which programs you're enrolling in:</p>

            <div className="programs-grid">
              <label className="program-checkbox">
                <input
                  type="checkbox"
                  checked={programs['Future Fortunes'] || false}
                  onChange={() => handleProgramChange('Future Fortunes')}
                />
                <span>Future Fortunes</span>
              </label>
              <label className="program-checkbox">
                <input
                  type="checkbox"
                  checked={programs['Pink Buckle'] || false}
                  onChange={() => handleProgramChange('Pink Buckle')}
                />
                <span>Pink Buckle</span>
              </label>
              <label className="program-checkbox">
                <input
                  type="checkbox"
                  checked={programs['Ruby Buckle'] || false}
                  onChange={() => handleProgramChange('Ruby Buckle')}
                />
                <span>Ruby Buckle</span>
              </label>
              <label className="program-checkbox">
                <input
                  type="checkbox"
                  checked={programs['Breeders Challenge'] || false}
                  onChange={() => handleProgramChange('Breeders Challenge')}
                />
                <span>Breeders Challenge</span>
              </label>
              <label className="program-checkbox">
                <input
                  type="checkbox"
                  checked={programs['Select Stallion Stakes'] || false}
                  onChange={() => handleProgramChange('Select Stallion Stakes')}
                />
                <span>Select Stallion Stakes</span>
              </label>
            </div>
          </div>

          {/* Step 4: Photo & Details */}
          <div className="form-section">
            <h2>4. Photo & Details (Optional)</h2>
            <p>You can add photos and notes after creating the horse</p>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding horse...' : 'Add Horse'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddHorse;