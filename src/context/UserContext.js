import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const UserContext = createContext();

export function UserContextProvider({ children }) {
  const [horses, setHorses] = useState([]);
  const [programs, setPrograms] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [programsLoading, setProgramsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchAllData(currentUser.uid);
      } else {
        setUser(null);
        setHorses([]);
        setPrograms({});
        setLoading(false);
        setProgramsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchAllData = async (userId) => {
    try {
      setLoading(true);

      // Fetch horses
      const horsesRef = collection(db, 'horses');
      const horsesQuery = query(horsesRef, where('userId', '==', userId));
      const horsesSnapshot = await getDocs(horsesQuery);
      const horsesList = horsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHorses(horsesList);

      // Fetch programs
      setProgramsLoading(true);
      const programsSnapshot = await getDocs(collection(db, 'programs'));
      const programsMap = {};
      programsSnapshot.forEach(doc => {
        programsMap[doc.data().name] = doc.data();
      });
      setPrograms(programsMap);
      setProgramsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setProgramsLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshHorses = async () => {
    if (user) {
      const horsesRef = collection(db, 'horses');
      const horsesQuery = query(horsesRef, where('userId', '==', user.uid));
      const horsesSnapshot = await getDocs(horsesQuery);
      const horsesList = horsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHorses(horsesList);
    }
  };

  const refreshPrograms = async () => {
    setProgramsLoading(true);
    const programsSnapshot = await getDocs(collection(db, 'programs'));
    const programsMap = {};
    programsSnapshot.forEach(doc => {
      programsMap[doc.data().name] = doc.data();
    });
    setPrograms(programsMap);
    setProgramsLoading(false);
  };

  const value = {
    horses,
    programs,
    user,
    loading,
    programsLoading,
    refreshHorses,
    refreshPrograms
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}