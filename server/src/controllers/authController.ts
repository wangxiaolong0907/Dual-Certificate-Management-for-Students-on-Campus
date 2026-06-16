import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database/init';
import { generateToken } from '../middleware/auth';

export function login(req: Request, res: Response): void {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: '请输入用户名和密码' });
      return;
    }

    const user = queryOne('SELECT * FROM users WHERE username = ?', [username]) as any;

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function me(req: Request, res: Response): void {
  res.json({ user: req.user });
}
