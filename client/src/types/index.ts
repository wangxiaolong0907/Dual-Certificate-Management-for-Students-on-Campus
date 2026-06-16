export interface User {
  id: number;
  username: string;
  role: string;
  name: string;
}

export interface Student {
  id: number;
  student_no: string;
  name: string;
  class_name: string;
  major: string;
  grade: string;
  phone: string;
  email: string;
  status: string;
  created_at: string;
}

export interface CertificateType {
  id: number;
  code: string;
  name: string;
  description: string;
  is_required: number;
  sort_order: number;
}

export interface Certificate {
  id: number;
  name: string;
  type_id: number;
  type_name: string;
  type_code: string;
  issuing_authority: string;
  description: string;
  requirements: string;
  validity_period: string;
  is_active: number;
}

export interface RegistrationRule {
  id: number;
  certificate_id: number;
  certificate_name: string;
  type_name: string;
  rule_name: string;
  description: string;
  requirements_json: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  is_active: number;
}

export interface TrainingMaterial {
  id: number;
  type: 'training' | 'material';
  title: string;
  content: string;
  certificate_id: number | null;
  certificate_name: string;
  training_date: string;
  location: string;
  instructor: string;
  file_url: string;
  material_type: string;
  is_public: number;
}

export interface StudentRegistration {
  id: number;
  student_id: number;
  certificate_id: number;
  student_name: string;
  student_no: string;
  class_name: string;
  major: string;
  certificate_name: string;
  type_name: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_name: string;
  review_comment: string;
  reviewed_at: string;
  created_at: string;
}

export interface ExamSubmission {
  id: number;
  student_id: number;
  certificate_id: number;
  student_name: string;
  student_no: string;
  class_name: string;
  major: string;
  certificate_name: string;
  type_name: string;
  exam_date: string;
  score: number;
  result_file_url: string;
  status: 'pending' | 'ai_reviewed' | 'approved' | 'rejected';
  ai_review_result: string;
  ai_review_confidence: number;
  ai_review_comment: string;
  reviewer_name: string;
  review_comment: string;
}

export interface CertificateRecord {
  id: number;
  student_id: number;
  certificate_id: number;
  student_name: string;
  student_no: string;
  class_name: string;
  major: string;
  certificate_name: string;
  type_name: string;
  obtain_date: string;
  certificate_no: string;
  score: number;
  file_url: string;
  status: string;
}

export interface Archive {
  id: number;
  class_name: string;
  certificate_id: number;
  certificate_name: string;
  type_name: string;
  archive_name: string;
  archive_date: string;
  file_url: string;
  student_count: number;
  pass_count: number;
  creator_name: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalRecords: number;
  totalRegistrations: number;
  pendingReviews: number;
  typeStats: { name: string; code: string; count: number }[];
  classStats: { class_name: string; student_count: number; record_count: number }[];
  monthlyStats: { month: string; count: number }[];
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
