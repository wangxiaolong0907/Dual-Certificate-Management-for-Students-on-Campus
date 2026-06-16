import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne, run, saveDb } from '../database/init';
import { generateToken } from '../middleware/auth';

export function login(req: Request, res: Response): void {
  try {
    const { student_no, password } = req.body;
    if (!student_no || !password) {
      res.status(400).json({ error: '请输入学号和密码' });
      return;
    }

    const student = queryOne('SELECT * FROM students WHERE student_no = ?', [student_no]) as any;

    if (!student) {
      res.status(401).json({ error: '学号不存在' });
      return;
    }

    // Check password — if password_hash is empty (legacy data), deny login
    if (!student.password_hash) {
      res.status(401).json({ error: '该账号尚未设置密码，请联系管理员' });
      return;
    }

    if (!bcrypt.compareSync(password, student.password_hash)) {
      res.status(401).json({ error: '密码错误' });
      return;
    }

    if (student.status !== 'active') {
      res.status(403).json({ error: '该账号已被禁用（已毕业或休学）' });
      return;
    }

    const token = generateToken({
      id: student.id,
      username: student.student_no,
      role: 'student',
      name: student.name,
    });

    res.json({
      token,
      user: {
        id: student.id,
        student_no: student.student_no,
        name: student.name,
        class_name: student.class_name,
        major: student.major,
        role: 'student',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function changePassword(req: Request, res: Response): void {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      res.status(400).json({ error: '请输入旧密码和新密码' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ error: '新密码长度不能少于6位' });
      return;
    }

    const student = queryOne('SELECT * FROM students WHERE id = ?', [req.user!.id]) as any;
    if (!student) {
      res.status(404).json({ error: '学生不存在' });
      return;
    }

    if (!bcrypt.compareSync(old_password, student.password_hash)) {
      res.status(400).json({ error: '旧密码错误' });
      return;
    }

    const newHash = bcrypt.hashSync(new_password, 10);
    run('UPDATE students SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newHash, req.user!.id]);
    saveDb();

    res.json({ message: '密码修改成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
