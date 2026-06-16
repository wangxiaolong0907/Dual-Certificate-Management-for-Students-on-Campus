import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';
import * as XLSX from 'xlsx';

export function getCertificateRecords(req: Request, res: Response): void {
  try {
    const { page = '1', pageSize = '20', certificate_id = '', class_name = '', status = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (certificate_id) { where += ' AND cr.certificate_id = ?'; params.push(certificate_id); }
    if (class_name) { where += ' AND s.class_name = ?'; params.push(class_name); }
    if (status) { where += ' AND cr.status = ?'; params.push(status); }

    const offset = (Number(page) - 1) * Number(pageSize);
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM certificate_records cr LEFT JOIN students s ON cr.student_id = s.id ${where}`, params) as any;
    const total = totalRow?.count || 0;

    const list = queryAll(`
      SELECT cr.*, s.name as student_name, s.student_no, s.class_name, s.major,
             c.name as certificate_name, ct.name as type_name
      FROM certificate_records cr
      LEFT JOIN students s ON cr.student_id = s.id
      LEFT JOIN certificates c ON cr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      ${where} ORDER BY cr.id DESC LIMIT ? OFFSET ?
    `, [...params, Number(pageSize), offset]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createCertificateRecord(req: Request, res: Response): void {
  try {
    const { student_id, certificate_id, obtain_date, certificate_no, score } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : (req.body.file_url || '');

    if (!student_id || !certificate_id) {
      res.status(400).json({ error: '学生和证书为必选项' }); return;
    }

    const result = run(
      'INSERT INTO certificate_records (student_id, certificate_id, obtain_date, certificate_no, score, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [student_id, certificate_id, obtain_date || '', certificate_no || '', score || 0, file_url]
    );
    saveDb();

    const record = queryOne(`
      SELECT cr.*, s.name as student_name, s.student_no, s.class_name, c.name as certificate_name
      FROM certificate_records cr
      LEFT JOIN students s ON cr.student_id = s.id
      LEFT JOIN certificates c ON cr.certificate_id = c.id WHERE cr.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function batchImportRecords(req: Request, res: Response): void {
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
      const obtain_date = String(row['获取日期'] || row['obtain_date'] || '');
      const certificate_no = String(row['证书编号'] || row['certificate_no'] || '');
      const score = Number(row['成绩'] || row['score'] || 0);

      const student = queryOne('SELECT id FROM students WHERE student_no = ?', [student_no]) as any;
      const cert = queryOne('SELECT id FROM certificates WHERE name LIKE ?', [`%${certificate_name}%`]) as any;

      if (!student) { errors.push(`学生 ${student_no} 不存在`); continue; }
      if (!cert) { errors.push(`证书 ${certificate_name} 不存在`); continue; }

      run('INSERT INTO certificate_records (student_id, certificate_id, obtain_date, certificate_no, score) VALUES (?, ?, ?, ?, ?)',
        [student.id, cert.id, obtain_date, certificate_no, score]);
      successCount++;
    }
    saveDb();

    res.json({ message: `导入完成：成功 ${successCount} 条`, successCount, errors: errors.slice(0, 10) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getRecordStats(_req: Request, res: Response): void {
  try {
    const totalStudents = (queryOne("SELECT COUNT(*) as count FROM students WHERE status = 'active'", []) as any)?.count || 0;
    const totalRecords = (queryOne('SELECT COUNT(*) as count FROM certificate_records', []) as any)?.count || 0;
    const totalRegistrations = (queryOne('SELECT COUNT(*) as count FROM student_registrations', []) as any)?.count || 0;
    const pendingReviews = (queryOne("SELECT COUNT(*) as count FROM exam_submissions WHERE status IN ('pending','ai_reviewed')", []) as any)?.count || 0;

    const typeStats = queryAll(`
      SELECT ct.name, ct.code, COUNT(cr.id) as count
      FROM certificate_types ct
      LEFT JOIN certificates c ON c.type_id = ct.id
      LEFT JOIN certificate_records cr ON cr.certificate_id = c.id
      GROUP BY ct.id ORDER BY ct.sort_order
    `);

    const classStats = queryAll(`
      SELECT s.class_name, COUNT(DISTINCT cr.student_id) as student_count, COUNT(cr.id) as record_count
      FROM students s LEFT JOIN certificate_records cr ON cr.student_id = s.id
      GROUP BY s.class_name ORDER BY record_count DESC LIMIT 10
    `);

    const monthlyStats = queryAll(`
      SELECT substr(obtain_date, 1, 7) as month, COUNT(*) as count
      FROM certificate_records WHERE obtain_date != '' GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    res.json({ totalStudents, totalRecords, totalRegistrations, pendingReviews, typeStats, classStats, monthlyStats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
