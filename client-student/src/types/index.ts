export interface StudentUser {
  id: number;
  student_no: string;
  name: string;
  class_name: string;
  major: string;
  role: string;
}

export interface StudentProfile {
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
  // Student-specific fields
  rule_id: number | null;
  rule_name: string;
  rule_description: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  reg_count: number;
  my_reg_id: number | null;
  my_reg_status: string | null;
}

export interface StudentRegistration {
  id: number;
  student_id: number;
  certificate_id: number;
  certificate_name: string;
  type_name: string;
  registration_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_name: string;
  review_comment: string;
  reviewed_at: string;
  created_at: string;
}

export interface StudentExam {
  id: number;
  student_id: number;
  certificate_id: number;
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
  created_at: string;
}

export interface CertificateRecord {
  id: number;
  student_id: number;
  certificate_id: number;
  certificate_name: string;
  type_name: string;
  obtain_date: string;
  certificate_no: string;
  score: number;
  file_url: string;
  status: string;
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

export interface StudentDashboard {
  regCount: number;
  examCount: number;
  recordCount: number;
  pendingCount: number;
  recentRegistrations: StudentRegistration[];
  recentRecords: CertificateRecord[];
  typeStats: { name: string; code: string; count: number }[];
}

export interface ApprovedCertificate {
  id: number;
  name: string;
  type_name: string;
}
