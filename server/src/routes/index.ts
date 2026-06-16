import { Router } from 'express';
import { requireAuth, requireStudentAuth } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import * as auth from '../controllers/authController';
import * as students from '../controllers/studentController';
import * as certs from '../controllers/certificateController';
import * as training from '../controllers/trainingController';
import * as registrations from '../controllers/registrationController';
import * as exams from '../controllers/examController';
import * as records from '../controllers/recordController';
import * as archives from '../controllers/archiveController';
import * as edusys from '../controllers/edusysController';
import * as studentAuth from '../controllers/studentAuthController';
import * as studentPortal from '../controllers/studentPortalController';

const router = Router();

// ==================== 认证 ====================
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

// ==================== 学生管理 ====================
router.get('/students', requireAuth, students.getStudents);
router.post('/students', requireAuth, students.createStudent);
router.put('/students/:id', requireAuth, students.updateStudent);
router.delete('/students/:id', requireAuth, students.deleteStudent);
router.post('/students/batch-import', requireAuth, uploadSingle, students.batchImportStudents);
router.get('/classes', requireAuth, students.getClasses);

// ==================== 证书管理 ====================
router.get('/certificate-types', requireAuth, certs.getCertificateTypes);
router.post('/certificate-types', requireAuth, certs.createCertificateType);
router.get('/certificates', requireAuth, certs.getCertificates);
router.post('/certificates', requireAuth, certs.createCertificate);
router.put('/certificates/:id', requireAuth, certs.updateCertificate);
router.delete('/certificates/:id', requireAuth, certs.deleteCertificate);

// ==================== 报名规则 ====================
router.get('/registration-rules', requireAuth, certs.getRegistrationRules);
router.post('/registration-rules', requireAuth, certs.createRegistrationRule);
router.put('/registration-rules/:id', requireAuth, certs.updateRegistrationRule);
router.delete('/registration-rules/:id', requireAuth, certs.deleteRegistrationRule);

// ==================== 培训 & 辅导材料 ====================
router.get('/training-materials', requireAuth, training.getTrainingMaterials);
router.post('/training-materials', requireAuth, uploadSingle, training.createTrainingMaterial);
router.put('/training-materials/:id', requireAuth, uploadSingle, training.updateTrainingMaterial);
router.delete('/training-materials/:id', requireAuth, training.deleteTrainingMaterial);

// ==================== 学生报名 ====================
router.get('/registrations', requireAuth, registrations.getRegistrations);
router.post('/registrations', requireAuth, registrations.createRegistration);
router.put('/registrations/:id/review', requireAuth, registrations.reviewRegistration);
router.post('/registrations/batch-import', requireAuth, uploadSingle, registrations.batchImportRegistrations);

// ==================== 考试管理 ====================
router.get('/exam-submissions', requireAuth, exams.getExamSubmissions);
router.post('/exam-submissions', requireAuth, uploadSingle, exams.createExamSubmission);
router.post('/exam-submissions/:id/ai-review', requireAuth, exams.runAiReview);
router.put('/exam-submissions/:id/review', requireAuth, exams.manualReviewExam);
router.post('/exam-submissions/batch-import', requireAuth, uploadSingle, exams.batchImportExams);

// ==================== 证书获取记录 ====================
router.get('/certificate-records', requireAuth, records.getCertificateRecords);
router.post('/certificate-records', requireAuth, uploadSingle, records.createCertificateRecord);
router.post('/certificate-records/batch-import', requireAuth, uploadSingle, records.batchImportRecords);
router.get('/stats', requireAuth, records.getRecordStats);

// ==================== 归档 ====================
router.get('/archives', requireAuth, archives.getArchives);
router.post('/archives', requireAuth, archives.createArchive);
router.get('/archives/:id/export', requireAuth, archives.exportArchive);
router.get('/archives/:id/details', requireAuth, archives.getArchiveDetail);

// ==================== 教务系统对接 ====================
router.get('/edusys/certificates/:studentNo', requireAuth, edusys.getStudentCertificates);
router.post('/edusys/sync', requireAuth, edusys.syncFromEduSystem);

// ==================== 学生端认证 ====================
router.post('/student-auth/login', studentAuth.login);
router.post('/student-auth/change-password', requireStudentAuth, studentAuth.changePassword);

// ==================== 学生门户 ====================
router.get('/student/me', requireStudentAuth, studentPortal.getProfile);
router.get('/student/dashboard', requireStudentAuth, studentPortal.getDashboard);
router.get('/student/certificates', requireStudentAuth, studentPortal.getCertificates);
router.get('/student/registrations', requireStudentAuth, studentPortal.getMyRegistrations);
router.post('/student/registrations', requireStudentAuth, studentPortal.registerCertificate);
router.get('/student/exams', requireStudentAuth, studentPortal.getMyExams);
router.post('/student/exams', requireStudentAuth, uploadSingle, studentPortal.submitExam);
router.get('/student/records', requireStudentAuth, studentPortal.getMyRecords);
router.get('/student/materials', requireStudentAuth, studentPortal.getMaterials);
router.get('/student/approved-certificates', requireStudentAuth, studentPortal.getMyApprovedCertificates);

// ==================== 公开接口（无需认证） ====================
router.get('/public/materials', training.getPublicMaterials);
router.get('/public/certificates', certs.getCertificates);

export default router;
