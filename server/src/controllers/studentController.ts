import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryAll, queryOne, run, saveDb } from '../database/init';
import * as XLSX from 'xlsx';

/** Generate default password hash from last 6 digits of student_no */
function defaultPasswordHash(studentNo: string): string {
  const pwd = studentNo.slice(-6);
  return bcrypt.hashSync(pwd, 10);
}

export function getStudents(req: Request, res: Response): void {
  try {
    const { page = '1', pageSize = '20', keyword = '', class_name = '', status = '' } = req.query;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (keyword) {
      where += ' AND (name LIKE ? OR student_no LIKE ? OR major LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (class_name) {
      where += ' AND class_name = ?';
      params.push(class_name);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    const offset = (Number(page) - 1) * Number(pageSize);
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM students ${where}`, params) as any;
    const total = totalRow?.count || 0;

    const students = queryAll(
      `SELECT * FROM students ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );

    res.json({ list: students, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createStudent(req: Request, res: Response): void {
  try {
    const { student_no, name, class_name, major, grade, phone, email } = req.body;

    if (!student_no || !name || !class_name) {
      res.status(400).json({ error: '学号、姓名、班级为必填项' });
      return;
    }

    const existing = queryOne('SELECT id FROM students WHERE student_no = ?', [student_no]);
    if (existing) {
      res.status(400).json({ error: '该学号已存在' });
      return;
    }

    const pwdHash = defaultPasswordHash(student_no);
    const result = run(
      'INSERT INTO students (student_no, name, class_name, major, grade, phone, email, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [student_no, name, class_name, major || '', grade || '', phone || '', email || '', pwdHash]
    );
    saveDb();

    const student = queryOne('SELECT * FROM students WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateStudent(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { name, class_name, major, grade, phone, email, status } = req.body;

    const existing = queryOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    run(
      'UPDATE students SET name = ?, class_name = ?, major = ?, grade = ?, phone = ?, email = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, class_name, major || '', grade || '', phone || '', email || '', status || 'active', id]
    );
    saveDb();

    const student = queryOne('SELECT * FROM students WHERE id = ?', [id]);
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteStudent(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM students WHERE id = ?', [id]);
    if (!existing) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    run('DELETE FROM students WHERE id = ?', [id]);
    saveDb();
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function batchImportStudents(req: Request, res: Response): void {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: '请上传 Excel 文件' });
      return;
    }

    const workbook = XLSX.readFile(file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      const student_no = String(row['学号'] || row['student_no'] || '');
      const name = String(row['姓名'] || row['name'] || '');
      const class_name = String(row['班级'] || row['class_name'] || '');
      const major = String(row['专业'] || row['major'] || '');
      const grade = String(row['年级'] || row['grade'] || '');
      const phone = String(row['电话'] || row['phone'] || '');
      const email = String(row['邮箱'] || row['email'] || '');

      if (!student_no || !name || !class_name) {
        failCount++;
        errors.push(`行数据缺少必填字段: ${JSON.stringify(row)}`);
        continue;
      }

      const existing = queryOne('SELECT id FROM students WHERE student_no = ?', [student_no]);
      if (existing) {
        failCount++;
        errors.push(`学号 ${student_no} 已存在`);
        continue;
      }

      const pwdHash = defaultPasswordHash(student_no);
      run('INSERT INTO students (student_no, name, class_name, major, grade, phone, email, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [student_no, name, class_name, major, grade, phone, email, pwdHash]);
      successCount++;
    }
    saveDb();

    res.json({
      message: `导入完成：成功 ${successCount} 条，失败 ${failCount} 条`,
      successCount,
      failCount,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getClasses(req: Request, res: Response): void {
  try {
    const classes = queryAll('SELECT DISTINCT class_name FROM students ORDER BY class_name');
    res.json(classes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
