import axios from 'axios';
import type {
  StudentUser, StudentProfile, Certificate, StudentRegistration,
  StudentExam, CertificateRecord, TrainingMaterial, StudentDashboard,
  ApprovedCertificate,
} from '../types';

const api = axios.create({ baseURL: '/api' });

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('student_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ========== Student Auth ==========
export const studentAuthApi = {
  login: (student_no: string, password: string) =>
    api.post<{ token: string; user: StudentUser }>('/student-auth/login', { student_no, password }),
  changePassword: (old_password: string, new_password: string) =>
    api.post('/student-auth/change-password', { old_password, new_password }),
};

// ========== Student Portal ==========
export const studentApi = {
  getProfile: () => api.get<StudentProfile>('/student/me'),
  getDashboard: () => api.get<StudentDashboard>('/student/dashboard'),

  // Certificates
  getCertificates: () => api.get<Certificate[]>('/student/certificates'),

  // Registrations
  getMyRegistrations: () => api.get<StudentRegistration[]>('/student/registrations'),
  register: (certificate_id: number) =>
    api.post('/student/registrations', { certificate_id }),
  getApprovedCertificates: () => api.get<ApprovedCertificate[]>('/student/approved-certificates'),

  // Exam submissions
  getMyExams: () => api.get<StudentExam[]>('/student/exams'),
  submitExam: (data: any, file?: File) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as any); });
    if (file) fd.append('file', file);
    return api.post('/student/exams', fd);
  },

  // Records
  getMyRecords: () => api.get<CertificateRecord[]>('/student/records'),

  // Materials
  getMaterials: () => api.get<TrainingMaterial[]>('/student/materials'),
};
