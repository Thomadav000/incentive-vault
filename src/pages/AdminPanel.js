import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import './AdminPanel.css';

function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    deadline: '',
    type: 'Annual',
    feeWeanling: '',
    feeYearling: '',
    fee2yo: '',
    fee3yo: '',
    fee4plus: '',
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/admin-login');
          return;
        }

        setUser(currentUser);

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists() || !userDocSnap.data().isAdmin) {
          navigate('/');
          return;
        }

        setIsAdmin(true);

        // Fetch programs
        const programsSnapshot = await getDocs(collection(db, 'programs'));
        const programsList = programsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPrograms(programsList);
      } catch (error) {
        console.error('Error checking admin access:', error);
        navigate('/admin-login');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      deadline: '',
      type: 'Annual',
      feeWeanling: '',
      feeYearling: '',
      fee2yo: '',
      fee3yo: '',
      fee4plus: '',
      notes: ''
    });
  };

  const handleAddProgram = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.website || !formData.deadline) {
      alert('Please fill in name, website, and deadline');
      return;
    }

    try {
      const newProgram = await addDoc(collection(db, 'programs'), {
        name: formData.name,
        website: formData.website,
        deadline: formData.deadline,
        type: formData.type,
        feeWeanling: formData.feeWeanling || 'N/A',
        feeYearling: formData.feeYearling || 'N/A',
        fee2yo: formData.fee2yo || 'N/A',
        fee3yo: formData.fee3yo || 'N/A',
        fee4plus: formData.fee4plus || 'N/A',
        notes: formData.notes || ''
      });

      setPrograms([...programs, { id: newProgram.id, ...formData }]);
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding program:', error);
      alert('Failed to add program');
    }
  };

  const handleEditProgram = async (id) => {
    if (!formData.name || !formData.website || !formData.deadline) {
      alert('Please fill in name, website, and deadline');
      return;
    }

    try {
      const programRef = doc(db, 'programs', id);
      await updateDoc(programRef, {
        name: formData.name,
        website: formData.website,
        deadline: formData.deadline,
        type: formData.type,
        feeWeanling: formData.feeWeanling || 'N/A',
        feeYearling: formData.feeYearling || 'N/A',
        fee2yo: formData.fee2yo || 'N/A',
        fee3yo: formData.fee3yo || 'N/A',
        fee4plus: formData.fee4plus || 'N/A',
        notes: formData.notes || ''
      });

      setPrograms(programs.map(p => 
        p.id === id ? { id, ...formData } : p
      ));
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Error updating program:', error);
      alert('Failed to update program');
    }
  };

  const handleDeleteProgram = async (id) => {
    if (!window.confirm('Are you sure you want to delete this program?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'programs', id));
      setPrograms(programs.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program');
    }
  };

  const startEdit = (program) => {
    setEditingId(program.id);
    setFormData({
      name: program.name,
      website: program.website,
      deadline: program.deadline,
      type: program.type || 'Annual',
      feeWeanling: program.feeWeanling || '',
      feeYearling: program.feeYearling || '',
      fee2yo: program.fee2yo || '',
      fee3yo: program.fee3yo || '',
      fee4plus: program.fee4plus || '',
      notes: program.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  if (loading) {
    return <div className="admin-panel">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="admin-panel">Access denied. Redirecting...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <h1>Admin Panel - Manage Programs</h1>

        {/* Add Program Form */}
        <section className="add-program-section">
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="btn-add-program"
          >
            {showAddForm ? '− Hide Form' : '+ Add New Program'}
          </button>

          {showAddForm && (
            <form onSubmit={handleAddProgram} className="program-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Program Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Future Fortunes"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Website *</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="e.g., futurefortunesinc.com"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline *</label>
                  <input
                    type="text"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    placeholder="e.g., December 31"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Program Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="Annual">Annual (Renewable)</option>
                    <option value="One-Time">One-Time (Paid for Life)</option>
                  </select>
                </div>
              </div>

              <div className="form-section-header">
                <h3>Enrollment Fees by Age</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Weanling Fee</label>
                  <input
                    type="text"
                    value={formData.feeWeanling}
                    onChange={(e) => setFormData({ ...formData, feeWeanling: e.target.value })}
                    placeholder="e.g., $175-$275"
                  />
                </div>
                <div className="form-group">
                  <label>Yearling Fee</label>
                  <input
                    type="text"
                    value={formData.feeYearling}
                    onChange={(e) => setFormData({ ...formData, feeYearling: e.target.value })}
                    placeholder="e.g., $200"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>2-Year-Old Fee</label>
                  <input
                    type="text"
                    value={formData.fee2yo}
                    onChange={(e) => setFormData({ ...formData, fee2yo: e.target.value })}
                    placeholder="e.g., $250"
                  />
                </div>
                <div className="form-group">
                  <label>3-Year-Old Fee</label>
                  <input
                    type="text"
                    value={formData.fee3yo}
                    onChange={(e) => setFormData({ ...formData, fee3yo: e.target.value })}
                    placeholder="e.g., $300"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>4+ Years Old Fee</label>
                  <input
                    type="text"
                    value={formData.fee4plus}
                    onChange={(e) => setFormData({ ...formData, fee4plus: e.target.value })}
                    placeholder="e.g., $350"
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes about this program"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">Add Program</button>
                <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }} className="btn-cancel">Cancel</button>
              </div>
            </form>
          )}
        </section>

        {/* Programs Table */}
        <section className="programs-section">
          <h2>All Programs</h2>
          <div className="table-wrapper">
            <table className="programs-table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Type</th>
                  <th>Deadline</th>
                  <th>Weanling</th>
                  <th>Yearling</th>
                  <th>2YO</th>
                  <th>3YO</th>
                  <th>4+</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map(program => (
                  <tr key={program.id}>
                    <td><strong>{program.name}</strong></td>
                    <td>
                      <span className={`type-badge ${program.type === 'One-Time' ? 'one-time' : 'annual'}`}>
                        {program.type === 'One-Time' ? 'Paid for Life' : 'Annual'}
                      </span>
                    </td>
                    <td>{program.deadline}</td>
                    <td>{program.feeWeanling || 'N/A'}</td>
                    <td>{program.feeYearling || 'N/A'}</td>
                    <td>{program.fee2yo || 'N/A'}</td>
                    <td>{program.fee3yo || 'N/A'}</td>
                    <td>{program.fee4plus || 'N/A'}</td>
                    <td>
                      <button 
                        onClick={() => startEdit(program)} 
                        className="btn-edit"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteProgram(program.id)} 
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Edit Form Modal */}
        {editingId && (
          <div className="edit-modal">
            <div className="edit-form-box">
              <h2>Edit Program</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleEditProgram(editingId); }} className="program-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Program Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Website *</label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Deadline *</label>
                    <input
                      type="text"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Program Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="Annual">Annual (Renewable)</option>
                      <option value="One-Time">One-Time (Paid for Life)</option>
                    </select>
                  </div>
                </div>

                <div className="form-section-header">
                  <h3>Enrollment Fees by Age</h3>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Weanling Fee</label>
                    <input
                      type="text"
                      value={formData.feeWeanling}
                      onChange={(e) => setFormData({ ...formData, feeWeanling: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Yearling Fee</label>
                    <input
                      type="text"
                      value={formData.feeYearling}
                      onChange={(e) => setFormData({ ...formData, feeYearling: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>2-Year-Old Fee</label>
                    <input
                      type="text"
                      value={formData.fee2yo}
                      onChange={(e) => setFormData({ ...formData, fee2yo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>3-Year-Old Fee</label>
                    <input
                      type="text"
                      value={formData.fee3yo}
                      onChange={(e) => setFormData({ ...formData, fee3yo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>4+ Years Old Fee</label>
                    <input
                      type="text"
                      value={formData.fee4plus}
                      onChange={(e) => setFormData({ ...formData, fee4plus: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">Save Changes</button>
                  <button type="button" onClick={cancelEdit} className="btn-cancel">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;