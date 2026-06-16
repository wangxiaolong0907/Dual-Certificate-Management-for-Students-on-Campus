import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import StudentList from './pages/Students/StudentList';
import CertificateList from './pages/Certificates/CertificateList';
import RuleList from './pages/Certificates/RuleList';
import RegistrationList from './pages/Registrations/RegistrationList';
import ExamList from './pages/Exams/ExamList';
import RecordList from './pages/Records/RecordList';
import ArchiveList from './pages/Archives/ArchiveList';
import TrainingList from './pages/Training/TrainingList';
import MaterialList from './pages/Materials/MaterialList';
import PublicPortal from './pages/PublicPortal';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public" element={<PublicPortal />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/students" element={<PrivateRoute><StudentList /></PrivateRoute>} />
      <Route path="/certificates" element={<PrivateRoute><CertificateList /></PrivateRoute>} />
      <Route path="/certificates/rules" element={<PrivateRoute><RuleList /></PrivateRoute>} />
      <Route path="/registrations" element={<PrivateRoute><RegistrationList /></PrivateRoute>} />
      <Route path="/exams" element={<PrivateRoute><ExamList /></PrivateRoute>} />
      <Route path="/records" element={<PrivateRoute><RecordList /></PrivateRoute>} />
      <Route path="/archives" element={<PrivateRoute><ArchiveList /></PrivateRoute>} />
      <Route path="/training" element={<PrivateRoute><TrainingList /></PrivateRoute>} />
      <Route path="/materials" element={<PrivateRoute><MaterialList /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
