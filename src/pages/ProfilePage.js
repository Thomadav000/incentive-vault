import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, functions } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  sendPasswordResetEmail,
  deleteUser,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { UserContext } from '../context/UserContext';
import LoadingScreen from '../components/LoadingScreen';
import './ProfilePage.css';

function ProfilePage() {
  const { user, loading } = useContext(UserContext);
  const [profileData, setProfileData] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState(null);
  const [isUpgradeAnnual, setIsUpgradeAnnual] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  const navigate = useNavigate();

  const tiers = [
    {
      id: 'tier1',
      horses: '1-2 Horses',
      monthly: 3.99,
      annual: 38.30,
      monthlyPriceId: 'price_1UJusgDgYhWF2kJzxnjU4BzH',
      annualPriceId: 'price_1UJvCcDgYhWF2kJz2XDXdZji',
    },
    {
      id: 'tier2',
      horses: '3-5 Horses',
      monthly: 6.99,
      annual: 66.91,
      monthlyPriceId: 'price_1UJv0HDgYhWF2kJz9UycNSLi',
      annualPriceId: 'price_1UJvEHDgYhWF2kJzsvGdDlI3',
    },
    {
      id: 'tier3',
      horses: '6-10 Horses',
      monthly: 9.99,
      annual: 95.91,
      monthlyPriceId: 'price_1UJv35DgYhWF2kJzEStdcNGM',
      annualPriceId: 'price_1UJvGmDgYhWF2kJzShzxnMuM',
    },
    {
      id: 'tier4',
      horses: 'Unlimited Horses',
      monthly: 14.99,
      annual: 143.91,
      monthlyPriceId: 'price_1UJv4PDgYhWF2kJz1s78AMKR',
      annualPriceId: 'price_1UJvIKDgYhWF2kJz9sds8x33',
    },
  ];

  const tierDisplay = {
    tier1: 'Tier 1 (1-2 horses)',
    tier2: 'Tier 2 (3-5 horses)',
    tier3: 'Tier 3 (6-10 horses)',
    tier4: 'Tier 4 (Unlimited horses)',
  };

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
            setSelectedUpgradeTier(userSnap.data().selectedTier);
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
      await updateProfile(user, {
        displayName: displayName,
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: displayName });

      setEditing(false);

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
    if (!deletePassword.trim()) {
      setError('Please enter your password to confirm deletion');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      await deleteUser(user);
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Account was not deleted.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect password. Account was not deleted.');
      } else {
        setError('Failed to delete account. Please try again.');
      }
      setSaving(false);
    }
  };

  const getUpgradePrice = (tier) => {
    return isUpgradeAnnual ? tier.annual : tier.monthly;
  };

  const getUpgradePriceLabel = () => {
    return isUpgradeAnnual ? '/year' : '/month';
  };

  const getUpgradePriceId = (tier) => {
    return isUpgradeAnnual ? tier.annualPriceId : tier.monthlyPriceId;
  };

    const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    setUpgradeError('');
    setUpgradeLoading(true);

    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setUpgradeError('You must be logged in to upgrade');
        setUpgradeLoading(false);
        return;
      }

      if (!selectedUpgradeTier || selectedUpgradeTier === profileData?.selectedTier) {
        setUpgradeError('Please select a different tier');
        setUpgradeLoading(false);
        return;
      }

      const selectedTierObj = tiers.find(
          (t) => t.id === selectedUpgradeTier,
      );
      const updateSubscriptionTier = httpsCallable(
          functions,
          'updateSubscriptionTier',
      );

      await updateSubscriptionTier({
        newTierPrice: getUpgradePriceId(selectedTierObj),
        newTierName: selectedUpgradeTier,
      });

      // Refresh profile data
      const userRef = doc(db, 'users', currentUser.uid);
      const updatedUserSnap = await getDoc(userRef);
      if (updatedUserSnap.exists()) {
        setProfileData(updatedUserSnap.data());
        setSelectedUpgradeTier(updatedUserSnap.data().selectedTier);
      }

      setShowUpgradeModal(false);
      setUpgradeError('');
    } catch (err) {
      console.error('Upgrade failed:', err);
      setUpgradeError(err.message || 'Upgrade failed. Please try again.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const closeUpgradeModal = () => {
    setShowUpgradeModal(false);
    setUpgradeError('');
    setSelectedUpgradeTier(profileData?.selectedTier);
  };

  const getSubscriptionDisplay = () => {
    const status = profileData?.subscription || 'trial';
    const tier = profileData?.selectedTier || 'tier1';
    const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
    const tierInfo = tierDisplay[tier] || 'Unknown Tier';
    return `${statusCapitalized} - ${tierInfo}`;
  };

  const isTrialUser = profileData?.subscription === 'trial';

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  const createdAt = profileData?.createdAt?.toDate?.() || new Date();
  const formattedDate = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="profile-page">
      <div className="profile-container">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back
        </button>

        <div className="profile-header">
          <h1>Profile</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {resetSent && (
          <div className="success-message">
            Password reset email sent! Check your inbox.
          </div>
        )}

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
                <span className="field-value">
                  {displayName || 'Not set'}
                </span>
                <button
                  onClick={() => setEditing(true)}
                  className="btn-edit"
                >
                  Edit
                </button>
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
              <span className="field-value">
                {getSubscriptionDisplay()}
              </span>
              {!isTrialUser && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="btn-edit"
                >
                  Update Membership
                </button>
              )}
              {isTrialUser && (
                <span className="trial-message">
                  Upgrades available after trial ends
                </span>
              )}
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

          <button
            onClick={handlePasswordReset}
            className="btn-secondary"
          >
            Send Password Reset Email
          </button>
        </div>

        <div className="profile-section danger-section">
          <div className="section-title">Danger Zone</div>

          {deleteConfirm ? (
            <div className="delete-confirm">
              <p>
                Are you sure you want to delete your account? This cannot
                be undone. Your subscription will be cancelled immediately
                and all your data will be permanently removed. If you're in
                your free trial, you won't be charged.
              </p>
              <div className="delete-password-field">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password to confirm"
                  className="delete-password-input"
                />
              </div>
              <div className="delete-buttons">
                <button
                  onClick={() => {
                    setDeleteConfirm(false);
                    setDeletePassword('');
                  }}
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

      {showUpgradeModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <h2>Update Membership</h2>
              <button
                className="payment-modal-close"
                onClick={closeUpgradeModal}
                disabled={upgradeLoading}
              >
                ✕
              </button>
            </div>

            <div className="payment-modal-content">
              <div className="pricing-toggle">
                <button
                  className={`toggle-btn ${!isUpgradeAnnual ? 'active' : ''}`}
                  onClick={() => setIsUpgradeAnnual(false)}
                >
                  Monthly
                </button>
                <button
                  className={`toggle-btn ${isUpgradeAnnual ? 'active' : ''}`}
                  onClick={() => setIsUpgradeAnnual(true)}
                >
                  Annual — SAVE 20%
                </button>
              </div>

              <div className="tier-cards-grid">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className={`tier-card ${
                      selectedUpgradeTier === tier.id ? 'selected' : ''
                    } ${
                      profileData?.selectedTier === tier.id
                        ? 'current-tier'
                        : ''
                    }`}
                    onClick={() => setSelectedUpgradeTier(tier.id)}
                  >
                    {profileData?.selectedTier === tier.id && (
                      <div className="current-tier-badge">Current Tier</div>
                    )}
                    <div className="tier-card-header">
                      <h3>{tier.horses}</h3>
                    </div>
                    <div className="tier-card-price">
                      <span className="price">
                        ${getUpgradePrice(tier).toFixed(2)}
                      </span>
                      <span className="period">
                        {getUpgradePriceLabel()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {upgradeError && (
                <div className="payment-error-message">
                  {upgradeError}
                </div>
              )}

              <form onSubmit={handleUpgradeSubmit}>
                <div className="payment-summary">
                  <p>
                    New Plan:{' '}
                    <strong>
                      {tiers.find((t) => t.id === selectedUpgradeTier)
                        ?.horses}
                    </strong>
                  </p>
                  <p>
                    Price:{' '}
                    <strong>
                      $
                      {getUpgradePrice(
                          tiers.find(
                              (t) => t.id === selectedUpgradeTier,
                          ),
                      ).toFixed(2)}
                      {getUpgradePriceLabel()}
                    </strong>
                  </p>
                  <p className="proration-note">
                    Charged immediately for the difference. Next billing
                    cycle will be at the new plan price.
                  </p>
                </div>

                <button
                  type="submit"
                  className="payment-btn-submit"
                  disabled={upgradeLoading}
                >
                  {upgradeLoading ? 'Processing...' : 'Confirm Upgrade'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;