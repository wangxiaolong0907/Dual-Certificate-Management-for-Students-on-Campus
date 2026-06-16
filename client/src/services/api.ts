import axios from 'axios';
import type {
  Student, Certificate, CertificateType, RegistrationRule,
  TrainingMaterial, StudentRegistration, ExamSubmission,
  CertificateRecord, Archive, DashboardStats, PaginatedResponse
} from '../types';

const api = axios.create({ baseURL: '/api' });

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ========== Auth ==========
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
};

// ========== Students ==========
export const studentApi = {
  list: (params?: any) => api.get<PaginatedResponse<Student>>('/students', { params }),
  create: (data: Partial<Student>) => api.post('/students', data),
  update: (id: number, data: Partial<Student>) => api.put(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
  batchImport: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/students/batch-import', fd);
  },
  getClasses: () => api.get('/classes'),
};

// ========== Certificates ==========
export const certificateApi = {
  list: (params?: any) => api.get<Certificate[]>('/certificates', { params }),
  create: (data: Partial<Certificate>) => api.post('/certificates', data),
  update: (id: number, data: Partial<Certificate>) => api.put(`/certificates/${id}`, data),
  delete: (id: number) => api.delete(`/certificates/${id}`),
  types: () => api.get<CertificateType[]>('/certificate-types'),
  createType: (data: Partial<CertificateType>) => api.post('/certificate-types', data),
};

// ========== Registration Rules ==========
export const ruleApi = {
  list: (params?: any) => api.get<RegistrationRule[]>('/registration-rules', { params }),
  create: (data: Partial<RegistrationRule>) => api.post('/registration-rules', data),
  update: (id: number, data: Partial<RegistrationRule>) => api.put(`/registration-rules/${id}`, data),
  delete: (id: number) => api.delete(`/registration-rules/${id}`),
};

// ========== Training Materials ==========
export const trainingApi = {
  list: (params?: any) => api.get<TrainingMaterial[]>('/training-materials', { params }),
  create: (data: any) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as any); });
    return api.post('/training-materials', fd);
  },
  update: (id: number, data: any) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as any); });
    return api.put(`/training-materials/${id}`, fd);
  },
  delete: (id: number) => api.delete(`/training-materials/${id}`),
  publicList: () => api.get<TrainingMaterial[]>('/public/materials'),
};

// ========== Registrations ==========
export const registrationApi = {
  list: (params?: any) => api.get<PaginatedResponse<StudentRegistration>>('/registrations', { params }),
  create: (data: { student_id: number; certificate_id: number }) => api.post('/registrations', data),
  review: (id: number, data: { status: string; review_comment?: string }) =>
    api.put(`/registrations/${id}/review`, data),
  batchImport: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/registrations/batch-import', fd);
  },
};

// ========== Exam Submissions ==========
export const examApi = {
  list: (params?: any) => api.get<PaginatedResponse<ExamSubmission>>('/exam-submissions', { params }),
  create: (data: any) => api.post('/exam-submissions', data),
  createWithFile: (data: any, file?: File) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v as any); });
    if (file) fd.append('file', file);
    return api.post('/exam-submissions', fd);
  },
  aiReview: (id: number) => api.post(`/exam-submissions/${id}/ai-review`),
  review: (id: number, data: { status: string; review_comment?: string }) =>
    api.put(`/exam-submissions/${id}/review`, data),
  batchImport: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/exam-submissions/batch-import', fd);
  },
};

// ========== Certificate Records ==========
export const recordApi = {
  list: (params?: any) => api.get<PaginatedResponse<CertificateRecord>>('/certificate-records', { params }),
  create: (data: any) => api.post('/certificate-records', data),
  batchImport: (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/certificate-records/batch-import', fd);
  },
  stats: () => api.get<DashboardStats>('/stats'),
};

// ========== Archives ==========
export const archiveApi = {
  list: (params?: any) => api.get<PaginatedResponse<Archive>>('/archives', { params }),
  create: (data: { class_name: string; certificate_id: number; archive_name?: string }) =>
    api.post('/archives', data),
  detail: (id: number) => api.get(`/archives/${id}/details`),
  exportUrl: (id: number) => `/api/archives/${id}/export`,
};

// ========== Edu System ==========
export const edusysApi = {
  getCertificates: (studentNo: string) => api.get(`/edusys/certificates/${studentNo}`),
  sync: () => api.post('/edusys/sync'),
};
