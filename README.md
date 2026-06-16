# 学生校内双证管理系统

用于管理学生在校内的双证（人社证书、专业证书、校内引进证书）考试情况的完整 Web 应用系统。

## 功能特性

### 管理端
- **学生管理** — 学生信息的 CRUD、批量导入（Excel）
- **证书管理** — 三种证书类型（人社/专业/校内引进）、证书信息维护
- **报名规则** — 报名时间范围、容量限制、条件设置
- **报名管理** — 学生报名、审核（批准/拒绝）、批量导入
- **考试管理** — 考试信息提交、AI 智能审核 + 人工审核、批量导入
- **证书记录** — 证书获取情况管理、批量导入
- **归档管理** — 按班级归档已通过的考试记录，生成 Excel 归档文件
- **培训信息** — 公开培训信息管理与展示
- **辅导材料** — 考试辅导材料（文档/视频/链接）管理与展示
- **仪表盘** — 数据统计概览

### 公开门户
- 证书信息展示
- 公开培训信息查看
- 辅导材料查看

### 加分项
- 教务系统对接接口（模拟）— 查询/同步证书获取数据

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + Ant Design 5 |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (sql.js — 纯 JavaScript 实现) |
| AI 审核 | 内置模拟 AI 审核引擎（可替换为真实 AI API） |
| 认证 | JWT + bcryptjs |
| 文件处理 | Multer（上传）、xlsx（Excel 解析） |

## 快速启动

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 前端
cd client
npm install
```

### 2. 启动后端服务

```bash
cd server
npm run dev
```

服务运行在 http://localhost:3001

### 3. 启动前端应用

```bash
cd client
npm run dev
```

应用运行在 http://localhost:5173

### 4. 登录

- 地址: http://localhost:5173
- 默认账号: `admin`
- 默认密码: `admin123`

### 5. 公开门户

访问 http://localhost:5173/public 查看公开信息（无需登录）

## 项目结构

```
├── server/                    # Express 后端
│   ├── src/
│   │   ├── database/init.ts   # 数据库初始化、建表、种子数据
│   │   ├── middleware/         # auth（JWT认证）、upload（文件上传）
│   │   ├── controllers/       # 请求处理层
│   │   ├── services/          # 业务逻辑层（AI审核引擎）
│   │   ├── routes/index.ts    # API 路由定义
│   │   └── index.ts           # 入口文件
│   └── uploads/               # 上传文件存储
├── client/                    # React 前端
│   ├── src/
│   │   ├── components/        # 通用组件（AppLayout）
│   │   ├── pages/             # 页面组件
│   │   │   ├── Login.tsx      # 登录页
│   │   │   ├── Dashboard.tsx  # 仪表盘
│   │   │   ├── Students/      # 学生管理
│   │   │   ├── Certificates/  # 证书管理 & 报名规则
│   │   │   ├── Registrations/ # 报名管理
│   │   │   ├── Exams/         # 考试管理（AI+人工审核）
│   │   │   ├── Records/       # 证书记录
│   │   │   ├── Archives/      # 归档管理
│   │   │   ├── Training/      # 培训信息
│   │   │   ├── Materials/     # 辅导材料
│   │   │   └── PublicPortal.tsx # 公开信息门户
│   │   ├── services/api.ts    # API 调用封装
│   │   └── types/index.ts     # TypeScript 类型定义
│   └── index.html
└── README.md
```

## API 接口

### 认证
- `POST /api/auth/login` — 登录
- `GET /api/auth/me` — 当前用户信息

### 学生管理
- `GET/POST /api/students` — 列表 & 新增
- `PUT/DELETE /api/students/:id` — 编辑 & 删除
- `POST /api/students/batch-import` — 批量导入
- `GET /api/classes` — 获取班级列表

### 证书管理
- `GET/POST /api/certificates` — 列表 & 新增
- `PUT/DELETE /api/certificates/:id` — 编辑 & 删除
- `GET/POST /api/certificate-types` — 证书类型

### 报名规则
- `GET/POST /api/registration-rules` — 列表 & 新增
- `PUT/DELETE /api/registration-rules/:id` — 编辑 & 删除

### 培训 & 材料
- `GET/POST /api/training-materials` — 列表 & 新增
- `PUT/DELETE /api/training-materials/:id` — 编辑 & 删除

### 报名管理
- `GET/POST /api/registrations` — 列表 & 新增
- `PUT /api/registrations/:id/review` — 审核

### 考试管理
- `GET/POST /api/exam-submissions` — 列表 & 提交
- `POST /api/exam-submissions/:id/ai-review` — AI 审核
- `PUT /api/exam-submissions/:id/review` — 人工审核
- `POST /api/exam-submissions/batch-import` — 批量导入

### 证书记录
- `GET/POST /api/certificate-records` — 列表 & 新增
- `POST /api/certificate-records/batch-import` — 批量导入
- `GET /api/stats` — 统计数据

### 归档
- `GET/POST /api/archives` — 列表 & 按班级归档
- `GET /api/archives/:id/export` — 导出归档
- `GET /api/archives/:id/details` — 归档详情

### 教务系统对接（加分项）
- `GET /api/edusys/certificates/:studentNo` — 查询学生证书
- `POST /api/edusys/sync` — 同步教务数据

### 公开接口
- `GET /api/public/materials` — 公开培训/材料
- `GET /api/public/certificates` — 公开证书信息

## AI 审核引擎

系统内置模拟 AI 审核逻辑，审核维度包括：
1. **材料完整性** — 是否上传了考试结果附件
2. **成绩合格性** — 分数是否达到及格线（60 分）
3. **前置条件** — 报名是否已通过审核

审核结果：通过 / 需补充材料 / 不通过，附带置信度和详细评语。

核心代码位于 `server/src/services/aiReviewService.ts`，可通过替换 `aiReviewWithApi` 函数接入真实 AI API。
