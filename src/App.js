import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserContextProvider } from './context/UserContext';

// Pages
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import HorseProfile from './pages/HorseProfile';
import CalendarView from './pages/CalendarView';
import AdminPanel from './pages/AdminPanel';
import AdminLogin from './pages/AdminLogin';
import GenerateReport from './pages/GenerateReport';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AddHorse from './pages/AddHorse';

// Navigation
import Navigation from './components/Navigation';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <UserContextProvider>
      <Router>
        {currentUser && <Navigation />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={currentUser ? <Navigate to="/" /> : <SignUp />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Protected Routes */}
          {currentUser ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/horse/:id" element={<HorseProfile />} />
              <Route path="/add-horse" element={<AddHorse />} />
              <Route path="/generate-report" element={<GenerateReport />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/admin" element={<AdminPanel />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" />} />
          )}
        </Routes>
      </Router>
    </UserContextProvider>
  );
}

export default App;