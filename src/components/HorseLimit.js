import React, { useContext } from 'react';
import { UserContext } from '../context/UserContext';

function HorseLimit() {
  const { user, horses } = useContext(UserContext);

  if (!user) return null;

  // If user is on free tier and has 1 horse, show upgrade prompt
  if (user.subscription === 'free' && horses.length >= 1) {
    return (
      <div className="horse-limit-banner">
        <div className="horse-limit-content">
          <h3>Horse Limit Reached</h3>
          <p>Free tier allows 1 horse. Upgrade to Rider tier for unlimited horses.</p>
          <button className="btn-upgrade">Upgrade to Rider</button>
        </div>
      </div>
    );
  }

  return null;
}

export default HorseLimit;
