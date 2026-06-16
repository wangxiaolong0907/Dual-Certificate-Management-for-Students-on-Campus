import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';

export function getStudentCertificates(req: Request, res: Response): void {
  try {
    const { studentNo } = req.params;

    const student = queryOne('SELECT * FROM students WHERE student_no = ?', [studentNo]) as any;
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    const records = queryAll(`
      SELECT cr.*, c.name as certificate_name, ct.name as type_name, ct.code as type_code
      FROM certificate_records cr
      LEFT JOIN certificates c ON cr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE cr.student_id = ? ORDER BY cr.obtain_date DESC
    `, [student.id]);

    res.json({
      student: {
        student_no: student.student_no,
        name: student.name,
        class_name: student.class_name,
        major: student.major,
      },
      certificates: records,
      total: records.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function syncFromEduSystem(_req: Request, res: Response): void {
  try {
    const mockSyncData = [
      { student_no: '2024001', certificate_name: '计算机等级考试二级', obtain_date: '2025-03-15', certificate_no: 'CERT-2025-001', score: 85 },
      { student_no: '2024002', certificate_name: '英语四级(CET-4)', obtain_date: '2025-06-20', certificate_no: 'CET4-2025-002', score: 520 },
      { student_no: '2024003', certificate_name: '软件设计师', obtain_date: '2025-05-10', certificate_no: 'SD-2025-003', score: 78 },
    ];

    let syncCount = 0;

    for (const row of mockSyncData) {
      const student = queryOne('SELECT id FROM students WHERE student_no = ?', [row.student_no]) as any;
      const cert = queryOne('SELECT id FROM certificates WHERE name LIKE ?', [`%${row.certificate_name}%`]) as any;

      if (!student || !cert) continue;

      const existing = queryOne('SELECT id FROM certificate_records WHERE student_id = ? AND certificate_id = ?',
        [student.id, cert.id]);
      if (!existing) {
        run('INSERT INTO certificate_records (student_id, certificate_id, obtain_date, certificate_no, score, status) VALUES (?, ?, ?, ?, ?, ?)',
          [student.id, cert.id, row.obtain_date, row.certificate_no, row.score, 'obtained']);
        syncCount++;
      }
    }
    if (syncCount > 0) saveDb();

    res.json({
      message: `同步完成：成功同步 ${syncCount} 条证书记录`,
      syncCount,
      source: '教务系统（模拟）',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
