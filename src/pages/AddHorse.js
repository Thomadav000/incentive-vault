import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './AddHorse.css';

function AddHorse() {
  const [formData, setFormData] = useState({
    barnName: '',
    registeredName: '',
    color: '',
    foalingYear: new Date().getFullYear(),
    sire: '',
    programs: []
  });
  const [calculatedAge, setCalculatedAge] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const allPrograms = [
    'Future Fortunes',
    'Pink Buckle',
    'Ruby Buckle',
    'Breeders Challenge',
    'Select Stallion Stakes'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'foalingYear') {
      const year = parseInt(value);
      const age = 2026 - year;
      setCalculatedAge(age);
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

    if (!formData.barnName || !formData.registeredName || !formData.color || !formData.foalingYear) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('You must be logged in');
        return;
      }

      await addDoc(collection(db, 'horses'), {
        userId: currentUser.uid,
        barnName: formData.barnName,
        registeredName: formData.registeredName,
        color: formData.color,
        foalingYear: parseInt(formData.foalingYear),
        age: calculatedAge,
        sire: formData.sire,
        programs: formData.programs,
        programsPaid: {},
        createdAt: serverTimestamp()
      });

      alert('Horse added successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error adding horse:', error);
      alert('Failed to add horse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-horse-page">
      <div className="add-horse-container">
        <h1>Add a Horse</h1>

        <form onSubmit={handleSubmit} className="add-horse-form">
          <div className="form-section">
            <h2>Horse Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="barnName">Barn Name *</label>
                <input
                  type="text"
                  id="barnName"
                  name="barnName"
                  value={formData.barnName}
                  onChange={handleChange}
                  placeholder="What you call them"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="registeredName">Registered Name *</label>
                <input
                  type="text"
                  id="registeredName"
                  name="registeredName"
                  value={formData.registeredName}
                  onChange={handleChange}
                  placeholder="Official AQHA registered name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="color">Color *</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Palomino, Bay, Sorrel"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="foalingYear">Foaling Year *</label>
                <input
                  type="number"
                  id="foalingYear"
                  name="foalingYear"
                  value={formData.foalingYear}
                  onChange={handleChange}
                  min="1990"
                  max="2026"
                  required
                />
                <p className="calculated-age">Age: {calculatedAge} years old</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="sire">Sire</label>
              <input
                type="text"
                id="sire"
                name="sire"
                value={formData.sire}
                onChange={handleChange}
                placeholder="Sire name (optional)"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Program Enrollment</h2>
            <p className="form-description">Select which programs this horse is enrolled in:</p>
            <div className="programs-grid">
              {allPrograms.map(program => (
                <div key={program} className="program-checkbox">
                  <input
                    type="checkbox"
                    id={program}
                    checked={formData.programs.includes(program)}
                    onChange={() => handleProgramToggle(program)}
                  />
                  <label htmlFor={program}>{program}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Adding Horse...' : 'Add Horse'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddHorse;