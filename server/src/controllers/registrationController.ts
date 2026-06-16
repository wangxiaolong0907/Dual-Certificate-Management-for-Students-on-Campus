import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';
import * as XLSX from 'xlsx';

export function getRegistrations(req: Request, res: Response): void {
  try {
    const { page = '1', pageSize = '20', status = '', certificate_id = '', class_name = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (status) { where += ' AND sr.status = ?'; params.push(status); }
    if (certificate_id) { where += ' AND sr.certificate_id = ?'; params.push(certificate_id); }
    if (class_name) { where += ' AND s.class_name = ?'; params.push(class_name); }

    const offset = (Number(page) - 1) * Number(pageSize);
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM student_registrations sr LEFT JOIN students s ON sr.student_id = s.id ${where}`, params) as any;
    const total = totalRow?.count || 0;

    const list = queryAll(`
      SELECT sr.*, s.name as student_name, s.student_no, s.class_name, s.major,
             c.name as certificate_name, ct.name as type_name, u.name as reviewer_name
      FROM student_registrations sr
      LEFT JOIN students s ON sr.student_id = s.id
      LEFT JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN users u ON sr.reviewer_id = u.id
      ${where} ORDER BY sr.id DESC LIMIT ? OFFSET ?
    `, [...params, Number(pageSize), offset]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createRegistration(req: Request, res: Response): void {
  try {
    const { student_id, certificate_id } = req.body;
    if (!student_id || !certificate_id) {
      res.status(400).json({ error: '学生和证书为必选项' }); return;
    }

    const existing = queryOne(
      'SELECT id FROM student_registrations WHERE student_id = ? AND certificate_id = ? AND status != ?',
      [student_id, certificate_id, 'rejected']
    );
    if (existing) { res.status(400).json({ error: '该学生已报名此证书考试' }); return; }

    const result = run('INSERT INTO student_registrations (student_id, certificate_id) VALUES (?, ?)', [student_id, certificate_id]);
    saveDb();

    const registration = queryOne(`
      SELECT sr.*, s.name as student_name, s.student_no, s.class_name, c.name as certificate_name
      FROM student_registrations sr
      LEFT JOIN students s ON sr.student_id = s.id
      LEFT JOIN certificates c ON sr.certificate_id = c.id WHERE sr.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(registration);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function reviewRegistration(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { status, review_comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: '审核状态无效' }); return;
    }

    const existing = queryOne('SELECT * FROM student_registrations WHERE id = ?', [id]);
    if (!existing) { res.status(404).json({ error: '报名记录不存在' }); return; }

    run(
      'UPDATE student_registrations SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.user!.id, review_comment || '', id]
    );
    saveDb();

    const registration = queryOne(`
      SELECT sr.*, s.name as student_name, s.student_no, s.class_name,
             c.name as certificate_name, u.name as reviewer_name
      FROM student_registrations sr
      LEFT JOIN students s ON sr.student_id = s.id
      LEFT JOIN certificates c ON sr.certificate_id = c.id
      LEFT JOIN users u ON sr.reviewer_id = u.id WHERE sr.id = ?
    `, [id]);

    res.json(registration);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function batchImportRegistrations(req: Request, res: Response): void {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: '请上传 Excel 文件' }); return; }

    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    let successCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      const student_no = String(row['学号'] || row['student_no'] || '');
      const certificate_name = String(row['证书名称'] || row['certificate_name'] || '');

      const student = queryOne('SELECT id FROM students WHERE student_no = ?', [student_no]) as any;
      const cert = queryOne('SELECT id FROM certificates WHERE name LIKE ?', [`%${certificate_name}%`]) as any;

      if (!student) { errors.push(`学生 ${student_no} 不存在`); continue; }
      if (!cert) { errors.push(`证书 ${certificate_name} 不存在`); continue; }

      run('INSERT INTO student_registrations (student_id, certificate_id) VALUES (?, ?)', [student.id, cert.id]);
      successCount++;
    }
    saveDb();

    res.json({ message: `导入完成：成功 ${successCount} 条`, successCount, errors: errors.slice(0, 10) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
