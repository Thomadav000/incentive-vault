import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import './GenerateReport.css';

function GenerateReport() {
  const [user, setUser] = useState(null);
  const [horses, setHorses] = useState([]);
  const [programs, setPrograms] = useState({});
  const [selectedHorses, setSelectedHorses] = useState([]);
  const [format, setFormat] = useState('excel');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          navigate('/signup');
          return;
        }

        setUser(currentUser);

        // Fetch user's horses
        const horsesRef = collection(db, 'horses');
        const horsesQuery = query(horsesRef, where('userId', '==', currentUser.uid));
        const horsesSnapshot = await getDocs(horsesQuery);
        const horsesList = horsesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHorses(horsesList);

        // Fetch all programs
        const programsSnapshot = await getDocs(collection(db, 'programs'));
        const programsMap = {};
        programsSnapshot.forEach(doc => {
          programsMap[doc.data().name] = doc.data();
        });
        setPrograms(programsMap);

        // Auto-select first horse
        if (horsesList.length > 0) {
          setSelectedHorses([horsesList[0].id]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleHorseToggle = (horseId) => {
    setSelectedHorses(prev =>
      prev.includes(horseId)
        ? prev.filter(id => id !== horseId)
        : [...prev, horseId]
    );
  };

  const getStatusColor = (isPaid, deadline) => {
    if (isPaid) return { bg: '#D4F1D4', text: '#2D5F2E' };
    return { bg: '#FFE5CC', text: '#8B4513' };
  };

  const generateExcel = () => {
    setGenerating(true);

    try {
      const selectedHorseData = horses.filter(h => selectedHorses.includes(h.id));
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Incentive Vault - Report Summary'],
        ['Generated:', new Date().toLocaleDateString()],
        [],
        ['Horses Included:', selectedHorseData.map(h => h.name).join(', ')],
        []
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Per-horse sheets
      selectedHorseData.forEach(horse => {
        const horseData = [
          ['Horse Information'],
          ['Name:', horse.name],
          ['Color:', horse.color],
          ['Age:', horse.age],
          ['Registration #:', horse.registrationNumber || 'N/A'],
          [],
          ['Program', 'Deadline', 'Status', 'Fee', 'Website']
        ];

        if (horse.programs && Array.isArray(horse.programs)) {
          horse.programs.forEach(programName => {
            const program = programs[programName];
            const isPaid = horse.programsPaid && horse.programsPaid[programName];
            const status = isPaid ? 'PAID' : 'Action Needed';
            const fee = program && program[`fee${horse.age}yo`] ? program[`fee${horse.age}yo`] : 'TBD';

            horseData.push([
              programName,
              program ? program.deadline : 'TBD',
              status,
              fee,
              program ? program.website : 'N/A'
            ]);
          });
        }

        const sheet = XLSX.utils.aoa_to_sheet(horseData);
        sheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, sheet, horse.name.slice(0, 31));
      });

      XLSX.writeFile(workbook, `Incentive_Vault_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel report');
    } finally {
      setGenerating(false);
    }
  };

  const generatePDF = () => {
    setGenerating(true);

    try {
      const pdf = new jsPDF();
      const selectedHorseData = horses.filter(h => selectedHorses.includes(h.id));
      let yPosition = 20;

      pdf.setFontSize(16);
      pdf.text('Incentive Vault Report', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 10;

      selectedHorseData.forEach((horse, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.text(`${horse.name}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.text(`Color: ${horse.color} | Age: ${horse.age} | Reg#: ${horse.registrationNumber || 'N/A'}`, 20, yPosition);
        yPosition += 8;

        if (horse.programs && Array.isArray(horse.programs)) {
          horse.programs.forEach(programName => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }

            const program = programs[programName];
            const isPaid = horse.programsPaid && horse.programsPaid[programName];
            const status = isPaid ? '✓ PAID' : '⚠ Action Needed';
            const fee = program && program[`fee${horse.age}yo`] ? program[`fee${horse.age}yo`] : 'TBD';

            pdf.setTextColor(isPaid ? 45 : 139);
            pdf.text(`• ${programName} - ${status}`, 25, yPosition);
            pdf.setTextColor(0);
            pdf.setFontSize(9);
            pdf.text(`  Deadline: ${program ? program.deadline : 'TBD'} | Fee: ${fee}`, 25, yPosition + 4);
            pdf.setFontSize(10);
            yPosition += 10;
          });
        }

        yPosition += 5;
      });

      pdf.save(`Incentive_Vault_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = () => {
    if (selectedHorses.length === 0) {
      alert('Please select at least one horse');
      return;
    }

    if (format === 'excel') {
      generateExcel();
    } else {
      generatePDF();
    }
  };

  if (loading) return <div className="generate-report">Loading...</div>;
  if (!user) return <div className="generate-report">Redirecting to signup...</div>;

  return (
    <div className="generate-report">
      <div className="report-container">
        <h1>Generate Your Report</h1>
        <p className="subtitle">Select which horses to include in your report</p>

        <section className="horses-selection">
          <h2>Your Horses</h2>
          {horses.length === 0 ? (
            <p className="no-horses">No horses found. <a href="/add-horse">Add a horse first</a></p>
          ) : (
            <div className="horses-list">
              {horses.map(horse => (
                <label key={horse.id} className="horse-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedHorses.includes(horse.id)}
                    onChange={() => handleHorseToggle(horse.id)}
                  />
                  <span>{horse.name} - {horse.color}, {horse.age} years old</span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="format-selection">
          <h2>Format</h2>
          <div className="format-options">
            <label>
              <input
                type="radio"
                value="excel"
                checked={format === 'excel'}
                onChange={(e) => setFormat(e.target.value)}
              />
              <span>Excel (.xlsx)</span>
            </label>
            <label>
              <input
                type="radio"
                value="pdf"
                checked={format === 'pdf'}
                onChange={(e) => setFormat(e.target.value)}
              />
              <span>PDF</span>
            </label>
          </div>
        </section>

        <div className="report-actions">
          <button
            onClick={handleGenerateReport}
            disabled={generating || selectedHorses.length === 0}
            className="btn-generate"
          >
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          <button onClick={() => navigate('/')} className="btn-cancel">Back to Home</button>
        </div>
      </div>
    </div>
  );
}

export default GenerateReport;
