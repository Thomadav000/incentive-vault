import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Cache programs data in memory so it only fetches once per session
let programsCache = null;

export function useProgramsData() {
  const [programData, setProgramData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // If cache exists, use it
        if (programsCache) {
          setProgramData(programsCache);
          setLoading(false);
          return;
        }

        // Otherwise fetch from Firestore
        const programsSnapshot = await getDocs(collection(db, 'programs'));
        const programs = {};
        programsSnapshot.forEach(doc => {
          programs[doc.data().name] = doc.data();
        });

        // Store in cache for future use
        programsCache = programs;
        setProgramData(programs);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  return { programData, loading };
}
