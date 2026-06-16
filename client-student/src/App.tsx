import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentLayout from './components/StudentLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import CertificatesPage from './pages/Certificates';
import MyRegistrationsPage from './pages/MyRegistrations';
import MyExamsPage from './pages/MyExams';
import MyRecordsPage from './pages/MyRecords';
import MaterialsPage from './pages/Materials';
import ProfilePage from './pages/Profile';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('student_token');
  if (!token) return <Navigate to="/login" replace />;
  return <StudentLayout>{children}</StudentLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/certificates" element={<PrivateRoute><CertificatesPage /></PrivateRoute>} />
      <Route path="/registrations" element={<PrivateRoute><MyRegistrationsPage /></PrivateRoute>} />
      <Route path="/exams" element={<PrivateRoute><MyExamsPage /></PrivateRoute>} />
      <Route path="/records" element={<PrivateRoute><MyRecordsPage /></PrivateRoute>} />
      <Route path="/materials" element={<PrivateRoute><MaterialsPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
