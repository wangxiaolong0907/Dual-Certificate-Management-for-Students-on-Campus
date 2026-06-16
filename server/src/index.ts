import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database/init';
import routes from './routes/index';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 — 上传文件访问
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 根路由
app.get('/', (_req, res) => {
  res.json({
    name: '学生校内双证管理系统 API',
    version: '1.0.0',
    docs: '/api',
    login: 'POST /api/auth/login',
    defaultAccount: { username: 'admin', password: 'admin123' },
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      certificates: '/api/certificates',
      registrations: '/api/registrations',
      exams: '/api/exam-submissions',
      records: '/api/certificate-records',
      archives: '/api/archives',
      training: '/api/training-materials',
      public: '/api/public',
      edusys: '/api/edusys',
    },
  });
});

// API 路由
app.use('/api', routes);

// 错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: '文件大小超过限制（最大 10MB）' });
    return;
  }
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

// 初始化数据库并启动服务
async function start() {
  await initDatabase();
  console.log('Database initialized successfully.');

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Default admin account: admin / admin123`);
  });
}

start().catch(console.error);

export default app;
