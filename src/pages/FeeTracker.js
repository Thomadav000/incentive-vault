import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './FeeTracker.css';

function FeeTracker() {
  const [horses, setHorses] = useState([]);
  const [selectedHorses, setSelectedHorses] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const q = query(collection(db, 'horses'), where('userId', '==', auth.currentUser.uid));
        const snapshot = await getDocs(q);
        const horsesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHorses(horsesData);
      } catch (err) {
        console.error('Error fetching horses:', err);
        setError('Failed to load horses');
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchHorses();
    }
  }, []);

  const handleSelectHorse = (horseId) => {
    const newSelected = new Set(selectedHorses);
    if (newSelected.has(horseId)) {
      newSelected.delete(horseId);
    } else {
      newSelected.add(horseId);
    }
    setSelectedHorses(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedHorses.size === horses.length) {
      setSelectedHorses(new Set());
    } else {
      setSelectedHorses(new Set(horses.map(h => h.id)));
    }
  };

  const getFeeForProgram = (program) => {
    if (!program) return '$0';
    if (program.status === 'Eligible - Paid') return '$0 ✓';
    if (program.status === 'Eligible - Not Paid' && program.estimatedFee) return program.estimatedFee;
    return '$0';
  };

  const parseFeeToNumber = (feeString) => {
    if (!feeString || feeString.includes('✓')) return 0;
    const match = feeString.match(/\$?([\d,]+)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, '')) || 0;
    }
    return 0;
  };

  const calculateHorseTotal = (horse) => {
    let total = 0;
    if (horse.programs && Array.isArray(horse.programs)) {
      horse.programs.forEach(prog => {
        const fee = getFeeForProgram(prog);
        total += parseFeeToNumber(fee);
      });
    }
    return total;
  };

  const calculateSelectedTotal = () => {
    let total = 0;
    selectedHorses.forEach(horseId => {
      const horse = horses.find(h => h.id === horseId);
      if (horse) {
        total += calculateHorseTotal(horse);
      }
    });
    return total;
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getAgeDisplay = (horse) => {
    if (horse.age === 0) return 'W';
    if (horse.age === 1) return '1Y';
    return horse.age?.toString() || '--';
  };

  const handleExportExcel = () => {
    // Build CSV content
    let csv = 'Horse Name,Registration #,Age,Future Fortunes,Breeders Challenge,Select Stallion Stakes,Pink Buckle,Ruby Buckle,Total\n';
    
    selectedHorses.forEach(horseId => {
      const horse = horses.find(h => h.id === horseId);
      if (horse) {
        const ff = getFeeForProgram(horse.programs?.find(p => p.name === 'Future Fortunes'));
        const bc = getFeeForProgram(horse.programs?.find(p => p.name === 'Breeders Challenge'));
        const sss = getFeeForProgram(horse.programs?.find(p => p.name === 'Select Stallion Stakes'));
        const pb = getFeeForProgram(horse.programs?.find(p => p.name === 'Pink Buckle'));
        const rb = getFeeForProgram(horse.programs?.find(p => p.name === 'Ruby Buckle'));
        const total = calculateHorseTotal(horse);

        csv += `"${horse.barnName}","${horse.registrationNumber || ''}",${getAgeDisplay(horse)},"${ff}","${bc}","${sss}","${pb}","${rb}","${formatCurrency(total)}"\n`;
      }
    });

    csv += `\n,,,,,,,,"Total: ${formatCurrency(calculateSelectedTotal())}"\n`;

    // Download CSV as Excel-compatible file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'incentive_vault_fees.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // For now, use browser's print-to-PDF feature
    alert('Use the Print button (Cmd+P) and select "Save as PDF" to export as PDF');
  };

  if (loading) return <div className="fee-tracker">Loading...</div>;

  return (
    <div className="fee-tracker">
      <div className="fee-tracker-container">
        <div className="tracker-header">
          <h1>The Vault — Year Fee Summary</h1>
          <div className="action-buttons">
            <button onClick={handleExportExcel} className="btn-export btn-excel" disabled={selectedHorses.size === 0}>
              📊 Export to Excel
            </button>
            <button onClick={handleExportPDF} className="btn-export btn-pdf" disabled={selectedHorses.size === 0}>
              📄 Export to PDF
            </button>
            <button onClick={handlePrint} className="btn-export btn-print" disabled={selectedHorses.size === 0}>
              🖨️ Print
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {horses.length === 0 ? (
          <div className="empty-state">
            <p>No horses added yet</p>
            <a href="/add-horse" className="btn-primary">Add your first horse</a>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="fee-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input 
                      type="checkbox" 
                      checked={selectedHorses.size === horses.length && horses.length > 0}
                      onChange={handleSelectAll}
                      title="Select all horses"
                    />
                  </th>
                  <th>Horse Name</th>
                  <th>Reg#</th>
                  <th>Age</th>
                  <th title="Future Fortunes">FF</th>
                  <th title="Breeders Challenge">BC</th>
                  <th title="Select Stallion Stakes">SSS</th>
                  <th title="Pink Buckle">PB</th>
                  <th title="Ruby Buckle">RB</th>
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {horses.map(horse => (
                  <tr key={horse.id} className={selectedHorses.has(horse.id) ? 'selected' : ''}>
                    <td className="checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedHorses.has(horse.id)}
                        onChange={() => handleSelectHorse(horse.id)}
                      />
                    </td>
                    <td className="horse-name">{horse.barnName}</td>
                    <td className="reg-number">{horse.registrationNumber || '-'}</td>
                    <td className="age">{getAgeDisplay(horse)}</td>
                    <td className="fee">{getFeeForProgram(horse.programs?.find(p => p.name === 'Future Fortunes'))}</td>
                    <td className="fee">{getFeeForProgram(horse.programs?.find(p => p.name === 'Breeders Challenge'))}</td>
                    <td className="fee">{getFeeForProgram(horse.programs?.find(p => p.name === 'Select Stallion Stakes'))}</td>
                    <td className="fee">{getFeeForProgram(horse.programs?.find(p => p.name === 'Pink Buckle'))}</td>
                    <td className="fee">{getFeeForProgram(horse.programs?.find(p => p.name === 'Ruby Buckle'))}</td>
                    <td className="total-col">{formatCurrency(calculateHorseTotal(horse))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="total-footer">
              <p className="footer-label">Selected Horses Total:</p>
              <p className="footer-amount">{formatCurrency(calculateSelectedTotal())}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeeTracker;