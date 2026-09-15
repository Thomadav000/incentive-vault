import React, { useState } from 'react';
import './AdminPanel.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('programs');

  const programs = [
    { id: 1, name: 'Future Fortunes', website: 'futurefortunesinc.com', weanlingFee: '$175-$275', annualFee: 'N/A', deadline: 'Dec 31' },
    { id: 2, name: 'Pink Buckle', website: 'pinkbuckle.com', weanlingFee: '$200', annualFee: '$200/yr', deadline: 'Nov 15' },
    { id: 3, name: 'Ruby Buckle', website: 'therubybuckle.com', weanlingFee: '$200', annualFee: '$200/yr', deadline: 'Dec 1' },
    { id: 4, name: 'Breeders Challenge', website: 'breederschallenge.com', weanlingFee: '$250', annualFee: 'Varies', deadline: 'Dec 1' },
    { id: 5, name: 'Select Stallion Stakes', website: 'selectstallionstakes.com', weanlingFee: '$200', annualFee: 'Varies', deadline: '7 days before' },
  ];

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <h1>Admin Panel</h1>

        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'programs' ? 'active' : ''}`}
            onClick={() => setActiveTab('programs')}
          >
            Programs
          </button>
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {activeTab === 'programs' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Manage Programs</h2>
              <button className="btn-add">+ Add Program</button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Program Name</th>
                    <th>Website</th>
                    <th>Weanling Fee</th>
                    <th>Annual Fee</th>
                    <th>Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map(program => (
                    <tr key={program.id}>
                      <td><strong>{program.name}</strong></td>
                      <td><a href={`https://${program.website}`} target="_blank" rel="noopener noreferrer">{program.website}</a></td>
                      <td>{program.weanlingFee}</td>
                      <td>{program.annualFee}</td>
                      <td>{program.deadline}</td>
                      <td>
                        <button className="btn-edit">Edit</button>
                        <button className="btn-delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="tab-content">
            <h2>User Management</h2>
            <p>User management features coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <h2>Branding & Settings</h2>
            <form className="settings-form">
              <div className="form-group">
                <label>Site Name</label>
                <input type="text" defaultValue="Incentive Vault" />
              </div>
              <div className="form-group">
                <label>Primary Color</label>
                <input type="color" defaultValue="#C7967A" />
              </div>
              <div className="form-group">
                <label>Secondary Color</label>
                <input type="color" defaultValue="#D4A574" />
              </div>
              <button type="submit" className="btn-save">Save Settings</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
