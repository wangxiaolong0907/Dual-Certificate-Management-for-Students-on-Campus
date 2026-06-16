import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export function getArchives(req: Request, res: Response): void {
  try {
    const { page = '1', pageSize = '20', class_name = '', certificate_id = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (class_name) { where += ' AND a.class_name = ?'; params.push(class_name); }
    if (certificate_id) { where += ' AND a.certificate_id = ?'; params.push(certificate_id); }

    const offset = (Number(page) - 1) * Number(pageSize);
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM archives a ${where}`, params) as any;
    const total = totalRow?.count || 0;

    const list = queryAll(`
      SELECT a.*, c.name as certificate_name, ct.name as type_name, u.name as creator_name
      FROM archives a
      LEFT JOIN certificates c ON a.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      LEFT JOIN users u ON a.created_by = u.id
      ${where} ORDER BY a.id DESC LIMIT ? OFFSET ?
    `, [...params, Number(pageSize), offset]);

    res.json({ list, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createArchive(req: Request, res: Response): void {
  try {
    const { class_name, certificate_id, archive_name } = req.body;
    if (!class_name || !certificate_id) {
      res.status(400).json({ error: '班级和证书为必选项' }); return;
    }

    const submissions = queryAll(`
      SELECT es.*, s.name as student_name, s.student_no
      FROM exam_submissions es LEFT JOIN students s ON es.student_id = s.id
      WHERE s.class_name = ? AND es.certificate_id = ? AND es.status = 'approved'
      ORDER BY s.student_no
    `, [class_name, certificate_id]) as any[];

    if (submissions.length === 0) {
      res.status(400).json({ error: '该班级没有已通过审核的考试记录可归档' }); return;
    }

    // Generate Excel archive file
    const exportData = submissions.map((s: any) => ({
      '学号': s.student_no,
      '姓名': s.student_name,
      '考试日期': s.exam_date,
      '成绩': s.score,
      '审核状态': '已通过',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '归档明细');

    // Use safe filename (avoid Chinese characters in filename for cross-platform compatibility)
    const safeName = archive_name || `${class_name}_证书归档`;
    const fileName = `archive_${certificate_id}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '..', '..', 'uploads', fileName);
    // Write file with proper encoding support
    const wbOpts = { bookType: 'xlsx' as const, type: 'buffer' as const };
    const buf = XLSX.write(wb, wbOpts);
    require('fs').writeFileSync(filePath, buf);

    const passCount = submissions.filter((s: any) => s.score >= 60).length;
    const result = run(
      'INSERT INTO archives (class_name, certificate_id, archive_name, file_url, student_count, pass_count, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [class_name, certificate_id, archive_name || `${class_name}_证书归档`, `/uploads/${fileName}`, submissions.length, passCount, req.user!.id]
    );

    for (const s of submissions) {
      run('INSERT INTO archive_details (archive_id, student_id, exam_submission_id) VALUES (?, ?, ?)',
        [result.lastInsertRowid, s.student_id, s.id]);
    }
    saveDb();

    const archive = queryOne(`
      SELECT a.*, c.name as certificate_name, u.name as creator_name
      FROM archives a LEFT JOIN certificates c ON a.certificate_id = c.id LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(archive);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function exportArchive(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const archive = queryOne('SELECT * FROM archives WHERE id = ?', [id]) as any;
    if (!archive) { res.status(404).json({ error: '归档记录不存在' }); return; }

    const filePath = path.join(__dirname, '..', '..', archive.file_url.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) { res.status(404).json({ error: '归档文件不存在' }); return; }

    res.download(filePath, `${archive.archive_name}.xlsx`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getArchiveDetail(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const details = queryAll(`
      SELECT ad.*, s.name as student_name, s.student_no, es.score, es.exam_date
      FROM archive_details ad
      LEFT JOIN students s ON ad.student_id = s.id
      LEFT JOIN exam_submissions es ON ad.exam_submission_id = es.id
      WHERE ad.archive_id = ? ORDER BY s.student_no
    `, [id]);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
