import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Import Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobListings from './pages/JobListings';
import JobDetails from './pages/JobDetails';
import ResumeUpload from './pages/ResumeUpload';
import Recommendations from './pages/Recommendations';
import SkillsGap from './pages/SkillsGap';
import Profile from './pages/Profile';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Main Application Pages */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="jobs" element={<JobListings />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="resumes" element={<ResumeUpload />} />
            <Route path="recommendations" element={<Recommendations />} />
            <Route path="skills-gap" element={<SkillsGap />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fallback to dashboard */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
