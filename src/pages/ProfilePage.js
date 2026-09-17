import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { UserContext } from '../context/UserContext';
import './ProfilePage.css';

function ProfilePage() {
  const { user, loading } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      const fetchProfileData = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setProfileData(userSnap.data());
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError('Failed to load profile');
        }
      };

      fetchProfileData();
      setDisplayName(user.displayName || '');
    }
  }, [user, loading, navigate]);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Update Firebase Auth display name
      await user.updateProfile({
        displayName: displayName
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: displayName });

      setEditing(false);

      // Fetch updated profile data
      const updatedUserRef = doc(db, 'users', user.uid);
      const updatedUserSnap = await getDoc(updatedUserRef);
      if (updatedUserSnap.exists()) {
        setProfileData(updatedUserSnap.data());
      }
    } catch (err) {
      console.error('Error saving name:', err);
      setError('Failed to save name');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error('Error sending reset email:', err);
      setError('Failed to send password reset email');
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    setError('');

    try {
      await deleteUser(user);
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="profile-page">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const createdAt = profileData?.createdAt?.toDate?.() || new Date();
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate('/')}>← Back</button>

        <div className="profile-header">
          <h1>Profile</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {resetSent && <div className="success-message">Password reset email sent! Check your inbox.</div>}

        <div className="profile-section">
          <div className="section-title">Account Information</div>

          <div className="profile-field">
            <label>Name</label>
            {editing ? (
              <div className="edit-field">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
                <button 
                  onClick={handleSaveName} 
                  disabled={saving}
                  className="btn-save"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(user.displayName || '');
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="display-field">
                <span className="field-value">{displayName || 'Not set'}</span>
                <button onClick={() => setEditing(true)} className="btn-edit">Edit</button>
              </div>
            )}
          </div>

          <div className="profile-field">
            <label>Email</label>
            <div className="display-field">
              <span className="field-value">{user.email}</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Subscription Tier</label>
            <div className="display-field">
              <span className="field-value">{profileData?.subscription || 'free'}</span>
            </div>
          </div>

          <div className="profile-field">
            <label>Member Since</label>
            <div className="display-field">
              <span className="field-value">{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div className="section-title">Security</div>

          <button onClick={handlePasswordReset} className="btn-secondary">
            Send Password Reset Email
          </button>
        </div>

        <div className="profile-section danger-section">
          <div className="section-title">Danger Zone</div>

          {deleteConfirm ? (
            <div className="delete-confirm">
              <p>Are you sure you want to delete your account? This cannot be undone.</p>
              <div className="delete-buttons">
                <button 
                  onClick={() => setDeleteConfirm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="btn-delete"
                >
                  {saving ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setDeleteConfirm(true)}
              className="btn-delete-account"
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;