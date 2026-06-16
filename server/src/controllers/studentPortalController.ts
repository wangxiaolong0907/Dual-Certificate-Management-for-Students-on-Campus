import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';

/** Get current student profile */
export function getProfile(req: Request, res: Response): void {
  try {
    const student = queryOne(
      'SELECT id, student_no, name, class_name, major, grade, phone, email, status, created_at FROM students WHERE id = ?',
      [req.user!.id]
    );
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get student dashboard stats */
export function getDashboard(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;

    const regCount = (queryOne(
      'SELECT COUNT(*) as count FROM student_registrations WHERE student_id = ?', [studentId]
    ) as any)?.count || 0;

    const examCount = (queryOne(
      'SELECT COUNT(*) as count FROM exam_submissions WHERE student_id = ?', [studentId]
    ) as any)?.count || 0;

    const recordCount = (queryOne(
      'SELECT COUNT(*) as count FROM certificate_records WHERE student_id = ?', [studentId]
    ) as any)?.count || 0;

    const pendingCount = (queryOne(
      "SELECT COUNT(*) as count FROM student_registrations WHERE student_id = ? AND status = 'pending'", [studentId]
    ) as any)?.count || 0;

    // Recent registrations
    const recentRegs = queryAll(`
      SELECT sr.*, c.name as certificate_name, ct.name as type_name
      FROM student_registrations sr
      LEFT JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE sr.student_id = ?
      ORDER BY sr.created_at DESC LIMIT 5
    `, [studentId]);

    // Recent records
    const recentRecords = queryAll(`
      SELECT cr.*, c.name as certificate_name, ct.name as type_name
      FROM certificate_records cr
      LEFT JOIN certificates c ON cr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE cr.student_id = ?
      ORDER BY cr.obtain_date DESC LIMIT 5
    `, [studentId]);

    // Record stats by type
    const typeStats = queryAll(`
      SELECT ct.name, ct.code, COUNT(cr.id) as count
      FROM certificate_types ct
      LEFT JOIN certificates c ON c.type_id = ct.id
      LEFT JOIN certificate_records cr ON cr.certificate_id = c.id AND cr.student_id = ?
      GROUP BY ct.id ORDER BY ct.sort_order
    `, [studentId]);

    res.json({
      regCount,
      examCount,
      recordCount,
      pendingCount,
      recentRegistrations: recentRegs,
      recentRecords,
      typeStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get available certificates (for student to browse and register) */
export function getCertificates(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;

    const certs = queryAll(`
      SELECT c.*, ct.name as type_name, ct.code as type_code,
             rr.id as rule_id, rr.rule_name, rr.description as rule_description,
             rr.start_date, rr.end_date, rr.max_capacity,
             (SELECT COUNT(*) FROM student_registrations WHERE certificate_id = c.id AND status != 'rejected') as reg_count,
             (SELECT id FROM student_registrations WHERE student_id = ? AND certificate_id = c.id AND status != 'rejected') as my_reg_id,
             (SELECT status FROM student_registrations WHERE student_id = ? AND certificate_id = c.id AND status != 'rejected') as my_reg_status
      FROM certificates c
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN registration_rules rr ON c.id = rr.certificate_id AND rr.is_active = 1
      WHERE c.is_active = 1
      ORDER BY ct.sort_order, c.id
    `, [studentId, studentId]);

    res.json(certs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get student's own registrations */
export function getMyRegistrations(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const regs = queryAll(`
      SELECT sr.*, c.name as certificate_name, ct.name as type_name,
             u.name as reviewer_name
      FROM student_registrations sr
      LEFT JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN users u ON sr.reviewer_id = u.id
      WHERE sr.student_id = ?
      ORDER BY sr.created_at DESC
    `, [studentId]);

    res.json(regs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Register for a certificate */
export function registerCertificate(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const { certificate_id } = req.body;

    if (!certificate_id) {
      res.status(400).json({ error: '请选择要报名的证书' });
      return;
    }

    // Check certificate exists and is active
    const cert = queryOne('SELECT * FROM certificates WHERE id = ? AND is_active = 1', [certificate_id]) as any;
    if (!cert) {
      res.status(400).json({ error: '证书不存在或已停用' });
      return;
    }

    // Check for active registration rule
    const rule = queryOne(
      `SELECT * FROM registration_rules WHERE certificate_id = ? AND is_active = 1
       AND (start_date = '' OR start_date <= date('now'))
       AND (end_date = '' OR end_date >= date('now'))
       LIMIT 1`,
      [certificate_id]
    ) as any;

    if (rule && rule.max_capacity > 0) {
      const regCount = (queryOne(
        "SELECT COUNT(*) as count FROM student_registrations WHERE certificate_id = ? AND status != 'rejected'",
        [certificate_id]
      ) as any)?.count || 0;
      if (regCount >= rule.max_capacity) {
        res.status(400).json({ error: '该证书报名名额已满' });
        return;
      }
    }

    // Check for existing registration
    const existing = queryOne(
      "SELECT id FROM student_registrations WHERE student_id = ? AND certificate_id = ? AND status != 'rejected'",
      [studentId, certificate_id]
    );
    if (existing) {
      res.status(400).json({ error: '您已报名该证书考试' });
      return;
    }

    const result = run(
      'INSERT INTO student_registrations (student_id, certificate_id) VALUES (?, ?)',
      [studentId, certificate_id]
    );
    saveDb();

    const reg = queryOne(`
      SELECT sr.*, c.name as certificate_name, ct.name as type_name
      FROM student_registrations sr
      LEFT JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE sr.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ message: '报名成功', registration: reg });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get student's own exam submissions */
export function getMyExams(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const exams = queryAll(`
      SELECT es.*, c.name as certificate_name, ct.name as type_name,
             u.name as reviewer_name
      FROM exam_submissions es
      LEFT JOIN certificates c ON es.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN users u ON es.reviewer_id = u.id
      WHERE es.student_id = ?
      ORDER BY es.created_at DESC
    `, [studentId]);

    res.json(exams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Submit exam result (student-side) */
export function submitExam(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const { certificate_id, exam_date, score } = req.body;
    const result_file_url = req.file ? `/uploads/${req.file.filename}` : (req.body.result_file_url || '');

    if (!certificate_id) {
      res.status(400).json({ error: '请选择证书' });
      return;
    }

    // Check if student has an approved registration for this certificate
    const reg = queryOne(
      "SELECT * FROM student_registrations WHERE student_id = ? AND certificate_id = ? AND status = 'approved'",
      [studentId, certificate_id]
    ) as any;

    if (!reg) {
      res.status(400).json({ error: '您尚未通过该证书的报名审核，无法提交考试' });
      return;
    }

    const result = run(
      'INSERT INTO exam_submissions (student_id, certificate_id, exam_date, score, result_file_url) VALUES (?, ?, ?, ?, ?)',
      [studentId, certificate_id, exam_date || '', score || 0, result_file_url]
    );
    saveDb();

    const submission = queryOne(`
      SELECT es.*, c.name as certificate_name, ct.name as type_name
      FROM exam_submissions es
      LEFT JOIN certificates c ON es.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE es.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({ message: '考试提交成功，请等待审核', submission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get student's own certificate records */
export function getMyRecords(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const records = queryAll(`
      SELECT cr.*, c.name as certificate_name, ct.name as type_name
      FROM certificate_records cr
      LEFT JOIN certificates c ON cr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE cr.student_id = ?
      ORDER BY cr.obtain_date DESC
    `, [studentId]);

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get public training materials (same as public endpoint) */
export function getMaterials(_req: Request, res: Response): void {
  try {
    const materials = queryAll(`
      SELECT tm.*, c.name as certificate_name
      FROM training_materials tm
      LEFT JOIN certificates c ON tm.certificate_id = c.id
      WHERE tm.is_public = 1
      ORDER BY tm.created_at DESC
    `);
    res.json(materials);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

/** Get certificates for exam submission dropdown (only approved registration certs) */
export function getMyApprovedCertificates(req: Request, res: Response): void {
  try {
    const studentId = req.user!.id;
    const certs = queryAll(`
      SELECT DISTINCT c.id, c.name, ct.name as type_name
      FROM student_registrations sr
      JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE sr.student_id = ? AND sr.status = 'approved'
      ORDER BY c.id
    `, [studentId]);
    res.json(certs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
