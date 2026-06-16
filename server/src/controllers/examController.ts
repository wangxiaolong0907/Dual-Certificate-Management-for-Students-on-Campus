import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';
import { aiReview } from '../services/aiReviewService';
import * as XLSX from 'xlsx';

export function getExamSubmissions(req: Request, res: Response): void {
  try {
    const { page = '1', pageSize = '20', status = '', certificate_id = '', class_name = '', keyword = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (status) { where += ' AND es.status = ?'; params.push(status); }
    if (certificate_id) { where += ' AND es.certificate_id = ?'; params.push(certificate_id); }
    if (class_name) { where += ' AND s.class_name = ?'; params.push(class_name); }
    if (keyword) { where += ' AND (s.name LIKE ? OR s.student_no LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    const offset = (Number(page) - 1) * Number(pageSize);
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM exam_submissions es LEFT JOIN students s ON es.student_id = s.id ${where}`, params) as any;
    const total = totalRow?.count || 0;

    const list = queryAll(`
      SELECT es.*, s.name as student_name, s.student_no, s.class_name, s.major,
             c.name as certificate_name, ct.name as type_name, u.name as reviewer_name
      FROM exam_submissions es
      LEFT JOIN students s ON es.student_id = s.id
      LEFT JOIN certificates c ON es.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN users u ON es.reviewer_id = u.id
      ${where} ORDER BY es.id DESC LIMIT ? OFFSET ?
    `, [...params, Number(pageSize), offset]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createExamSubmission(req: Request, res: Response): void {
  try {
    const { student_id, certificate_id, exam_date, score } = req.body;
    const result_file_url = req.file ? `/uploads/${req.file.filename}` : (req.body.result_file_url || '');

    if (!student_id || !certificate_id) {
      res.status(400).json({ error: '学生和证书为必选项' }); return;
    }

    const result = run(
      'INSERT INTO exam_submissions (student_id, certificate_id, exam_date, score, result_file_url) VALUES (?, ?, ?, ?, ?)',
      [student_id, certificate_id, exam_date || '', score || 0, result_file_url]
    );
    saveDb();

    const submission = queryOne(`
      SELECT es.*, s.name as student_name, s.student_no, s.class_name, c.name as certificate_name
      FROM exam_submissions es
      LEFT JOIN students s ON es.student_id = s.id
      LEFT JOIN certificates c ON es.certificate_id = c.id WHERE es.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(submission);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function runAiReview(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const submission = queryOne(`
      SELECT es.*, s.name as student_name
      FROM exam_submissions es LEFT JOIN students s ON es.student_id = s.id WHERE es.id = ?
    `, [id]) as any;

    if (!submission) { res.status(404).json({ error: '考试记录不存在' }); return; }

    const reviewResult = aiReview(submission);

    run(`
      UPDATE exam_submissions SET status = 'ai_reviewed', ai_review_result = ?,
        ai_review_confidence = ?, ai_review_comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [reviewResult.result, reviewResult.confidence, reviewResult.comment, id]);
    saveDb();

    const updated = queryOne(`
      SELECT es.*, s.name as student_name, s.student_no, s.class_name, c.name as certificate_name
      FROM exam_submissions es LEFT JOIN students s ON es.student_id = s.id LEFT JOIN certificates c ON es.certificate_id = c.id
      WHERE es.id = ?
    `, [id]);

    res.json({ submission: updated, review: reviewResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function manualReviewExam(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { status, review_comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: '审核状态无效' }); return;
    }

    run(
      'UPDATE exam_submissions SET status = ?, reviewer_id = ?, review_comment = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.user!.id, review_comment || '', id]
    );

    if (status === 'approved') {
      const submission = queryOne('SELECT * FROM exam_submissions WHERE id = ?', [id]) as any;
      if (submission) {
        const existingRecord = queryOne(
          'SELECT id FROM certificate_records WHERE student_id = ? AND certificate_id = ?',
          [submission.student_id, submission.certificate_id]
        );
        if (!existingRecord) {
          run(
            'INSERT INTO certificate_records (student_id, certificate_id, obtain_date, score, file_url, status) VALUES (?, ?, ?, ?, ?, ?)',
            [submission.student_id, submission.certificate_id, new Date().toISOString().split('T')[0], submission.score, submission.result_file_url, 'obtained']
          );
        }
      }
    }
    saveDb();

    const updated = queryOne(`
      SELECT es.*, s.name as student_name, s.student_no, s.class_name,
             c.name as certificate_name, u.name as reviewer_name
      FROM exam_submissions es LEFT JOIN students s ON es.student_id = s.id
      LEFT JOIN certificates c ON es.certificate_id = c.id
      LEFT JOIN users u ON es.reviewer_id = u.id WHERE es.id = ?
    `, [id]);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function batchImportExams(req: Request, res: Response): void {
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
      const exam_date = String(row['考试日期'] || row['exam_date'] || '');
      const score = Number(row['成绩'] || row['score'] || 0);

      const student = queryOne('SELECT id FROM students WHERE student_no = ?', [student_no]) as any;
      const cert = queryOne('SELECT id FROM certificates WHERE name LIKE ?', [`%${certificate_name}%`]) as any;

      if (!student) { errors.push(`学生 ${student_no} 不存在`); continue; }
      if (!cert) { errors.push(`证书 ${certificate_name} 不存在`); continue; }

      run('INSERT INTO exam_submissions (student_id, certificate_id, exam_date, score, result_file_url, status) VALUES (?, ?, ?, ?, ?, ?)',
        [student.id, cert.id, exam_date, score, '', 'pending']);
      successCount++;
    }
    saveDb();

    res.json({ message: `导入完成：成功 ${successCount} 条`, successCount, errors: errors.slice(0, 10) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
