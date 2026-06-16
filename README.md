# 📜 学生校内双证管理系统

用于管理学生在校期间"双证"（人社证书 + 专业证书 + 校内引进证书）考试情况的完整 Web 应用系统。

---

## 📑 目录

- [系统架构](#系统架构)
- [技术栈](#技术栈)
- [快速启动](#快速启动)
- [项目结构](#项目结构)
- [管理端](#管理端)
- [学生端](#学生端)
- [API 接口文档](#api-接口文档)
- [数据库设计](#数据库设计)
- [AI 审核引擎](#ai-审核引擎)
- [认证体系](#认证体系)
- [默认账号](#默认账号)

---

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    浏览器访问                         │
├─────────────────┬─────────────────┬─────────────────┤
│  管理端 :5173    │  学生端 :5174    │  公开门户 /public │
│  (admin view)   │ (student view)  │  (无需登录)       │
└───────┬─────────┴────────┬────────┴────────┬────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│            Vite Dev Proxy → /api, /uploads           │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Express Server :3001                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ JWT 认证  │ │ 文件上传  │ │ AI 模拟审核引擎       │ │
│  └──────────┘ └──────────┘ └──────────────────────┘ │
│  ┌──────────────────────────────────────────────────┐ │
│  │            SQLite (sql.js 内存数据库)              │ │
│  │  8 张业务表 + 自动持久化到 data.db                 │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 双端对比

| 维度 | 管理端 | 学生端 |
|------|--------|--------|
| 端口 | `:5173` | `:5174` |
| 登录方式 | 用户名 + 密码 | 学号 + 密码 |
| 默认账号 | `admin / admin123` | `2024001 / 024001` |
| 权限 | 全局数据管理 | 仅查看/操作自己的数据 |
| 核心功能 | CRUD、审核、归档、导入导出 | 报名、提交考试、查看证书 |

---

## 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端框架 | React 18 + TypeScript | 管理端 & 学生端共用技术栈 |
| UI 组件库 | Ant Design 5 | 中后台企业级 UI |
| 图标库 | @ant-design/icons | Ant Design 官方图标 |
| HTTP 客户端 | Axios | 请求拦截器自动注入 JWT |
| 路由 | react-router-dom v6 | SPA 路由 |
| 构建工具 | Vite 5 | 开发秒启、生产构建 |
| 后端框架 | Express + TypeScript | RESTful API |
| 数据库 | SQLite (sql.js) | 纯 JS 实现，零安装依赖 |
| 认证 | JWT + bcryptjs | Token 过期 24h，密码哈希存储 |
| 文件上传 | Multer | 支持 PDF/图片/Word/Excel |
| Excel 处理 | xlsx | 批量导入导出 |

---

## 快速启动

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 1. 安装依赖

```bash
# 后端
cd server
npm install

# 管理端前端
cd ../client
npm install

# 学生端前端
cd ../client-student
npm install
```

### 2. 启动后端服务

```bash
cd server
npm run dev
```

服务运行在 **http://localhost:3001**，首次启动自动创建数据库并写入种子数据。

### 3. 启动管理端

```bash
cd client
npm run dev
```

访问 **http://localhost:5173**

### 4. 启动学生端

```bash
cd client-student
npm run dev
```

访问 **http://localhost:5174**

---

## 项目结构

```
├── server/                          # Express 后端
│   ├── src/
│   │   ├── database/
│   │   │   └── init.ts              # 数据库建表、种子数据、持久化
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT 认证（管理员 + 学生双角色）
│   │   │   └── upload.ts            # 文件上传（Multer）
│   │   ├── controllers/
│   │   │   ├── authController.ts    # 管理员认证（用户名密码登录）
│   │   │   ├── studentAuthController.ts   # 学生认证（学号密码登录）
│   │   │   ├── studentController.ts       # 学生 CRUD + 批量导入
│   │   │   ├── studentPortalController.ts # 学生门户（我的数据）
│   │   │   ├── certificateController.ts   # 证书 & 报名规则 CRUD
│   │   │   ├── registrationController.ts  # 报名管理 & 审核
│   │   │   ├── examController.ts          # 考试管理 & AI审核
│   │   │   ├── recordController.ts        # 证书记录 & 统计
│   │   │   ├── archiveController.ts       # 归档管理
│   │   │   ├── trainingController.ts      # 培训 & 辅导材料
│   │   │   └── edusysController.ts        # 教务系统对接（模拟）
│   │   ├── services/
│   │   │   └── aiReviewService.ts   # AI 模拟审核引擎
│   │   ├── routes/index.ts          # 全部 API 路由注册
│   │   └── index.ts                 # Express 入口
│   └── uploads/                     # 上传文件存储目录
│
├── client/                          # 管理端前端 (React + Ant Design)
│   ├── src/
│   │   ├── components/
│   │   │   └── AppLayout.tsx        # 管理端布局（侧边菜单 + 顶栏）
│   │   ├── pages/
│   │   │   ├── Login.tsx            # 登录页
│   │   │   ├── Dashboard.tsx        # 仪表盘（统计图表）
│   │   │   ├── Students/StudentList.tsx        # 学生管理
│   │   │   ├── Certificates/CertificateList.tsx # 证书信息
│   │   │   ├── Certificates/RuleList.tsx        # 报名规则
│   │   │   ├── Registrations/RegistrationList.tsx # 报名管理（含审核）
│   │   │   ├── Exams/ExamList.tsx              # 考试管理（AI+人工审核）
│   │   │   ├── Records/RecordList.tsx          # 证书记录
│   │   │   ├── Archives/ArchiveList.tsx        # 归档管理
│   │   │   ├── Training/TrainingList.tsx       # 培训信息
│   │   │   ├── Materials/MaterialList.tsx      # 辅导材料
│   │   │   └── PublicPortal.tsx     # 公开信息门户（无需登录）
│   │   ├── services/api.ts          # API 请求封装
│   │   └── types/index.ts           # TypeScript 类型定义
│   └── vite.config.ts               # Vite 配置（端口 5173 + 代理）
│
├── client-student/                  # 学生端前端 (React + Ant Design)
│   ├── src/
│   │   ├── components/
│   │   │   └── StudentLayout.tsx    # 学生端布局
│   │   ├── pages/
│   │   │   ├── Login.tsx            # 学号登录
│   │   │   ├── Dashboard.tsx        # 我的仪表盘
│   │   │   ├── Certificates.tsx     # 证书报名
│   │   │   ├── MyRegistrations.tsx  # 我的报名
│   │   │   ├── MyExams.tsx          # 我的考试（含成绩提交）
│   │   │   ├── MyRecords.tsx        # 我的证书
│   │   │   ├── Materials.tsx        # 学习资源（培训+材料）
│   │   │   └── Profile.tsx          # 个人信息 & 修改密码
│   │   ├── services/api.ts
│   │   └── types/index.ts
│   └── vite.config.ts               # Vite 配置（端口 5174 + 代理）
│
└── generate_ppt.py                  # PPT 生成脚本
```

---

## 管理端

### 功能模块

#### 1. 📊 仪表盘
- 在校学生数 / 证书获取总数 / 报名总数 / 待审核数
- 各类型证书获取统计表
- 各班级证书获取统计表

#### 2. 👨‍🎓 学生管理
- 学生信息的增删改查（学号、姓名、班级、专业、年级、电话、邮箱）
- 支持按学号/姓名/专业搜索、按班级筛选
- **批量导入**：上传 Excel（.xlsx/.xls），表头支持中英文
- **自动密码**：新增/导入的学生默认密码为学号后6位

#### 3. 📜 证书管理
- 三种证书类型：人社证书（RENSHE）、专业证书（ZHUANYE）、校内引进（XIAONEI）
- 证书信息维护：名称、颁发机构、描述、报名要求、有效期
- 支持按类型筛选

#### 4. 📋 报名规则
- 为证书设置报名规则：名称、说明、条件（JSON）、起止日期、容量限制
- 支持启用/停用

#### 5. ✍️ 报名管理
- 学生报名记录的增删改查
- **审核流程**：待审核 → 批准 / 拒绝（附审核意见）
- 按状态筛选（待审核/已通过/已拒绝）
- 批量导入报名记录

#### 6. 📝 考试管理
- 考试信息录入：学生、证书、考试日期、成绩、附件上传
- **AI 智能审核**：自动检查材料完整性、成绩合格性、前置条件
- **人工复审**：管理员最终审批（通过/拒绝）
- 审批通过后自动生成证书记录
- 批量导入考试数据

#### 7. 🏆 证书获取记录
- 证书记录的增删改查
- 按证书、班级、状态筛选
- 批量导入

#### 8. 📦 归档管理
- 按班级 + 证书一键归档
- 归档详情查看
- 导出归档为 Excel 文件

#### 9. 📖 培训信息
- 培训信息的增删改查
- 支持上传附件、设置公开/内部可见

#### 10. 📚 辅导材料
- 辅导材料的增删改查
- 分类：视频 / 文档 / 链接
- 支持上传文件、设置公开/内部可见

#### 11. 🌐 公开信息门户
- 无需登录，URL: `http://localhost:5173/public`
- 展示证书信息、公开培训、辅导材料

---

## 学生端

### 功能模块

#### 1. 🔐 学号登录
- 学号 + 密码登录
- 默认密码为学号后6位，首次登录后建议修改

#### 2. 📊 我的仪表盘
- 我的报名数 / 考试提交数 / 已获证书数 / 待审核数
- 各类型证书获取统计
- 最近报名记录

#### 3. 🎯 证书报名
- 浏览所有可报名证书（含报名规则、时间范围、名额信息）
- **一键报名**：自动校验重复报名、名额限制、时间范围
- 实时显示报名状态（审核中/已通过/未开始/已截止/名额满）

#### 4. 📋 我的报名
- 查看个人全部报名记录
- 查看审核状态（待审核/已通过/已拒绝）和审核意见

#### 5. 📝 我的考试
- 查看个人考试记录及 AI + 人工审核结果
- **提交考试成绩**：选择已通过报名的证书 → 填写考试日期和成绩 → 上传成绩单附件

#### 6. 🏆 我的证书
- 查看已获得的证书记录
- 显示证书名称、获取日期、证书编号、成绩

#### 7. 📖 学习资源
- Tab 页切换：培训信息 / 辅导材料
- 查看公开的培训安排和学习资料

#### 8. 👤 个人信息
- 查看学号、姓名、班级、专业、年级、状态
- **修改密码**：输入旧密码 → 新密码 → 成功自动跳转到登录页

---

## API 接口文档

### 认证（管理端）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/auth/login` | 无 | 管理员登录 |
| `GET` | `/api/auth/me` | JWT | 当前用户信息 |

### 学生认证

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `POST` | `/api/student-auth/login` | 无 | 学生登录 |
| `POST` | `/api/student-auth/change-password` | JWT(学生) | 修改密码 |

### 学生管理（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/students` | 学生列表（分页、搜索、筛选） |
| `POST` | `/api/students` | 新增学生 |
| `PUT` | `/api/students/:id` | 编辑学生 |
| `DELETE` | `/api/students/:id` | 删除学生 |
| `POST` | `/api/students/batch-import` | 批量导入（Excel） |
| `GET` | `/api/classes` | 班级列表 |

### 证书管理（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/certificates` | 证书列表 |
| `POST` | `/api/certificates` | 新增证书 |
| `PUT` | `/api/certificates/:id` | 编辑证书 |
| `DELETE` | `/api/certificates/:id` | 删除证书 |
| `GET` | `/api/certificate-types` | 证书类型列表 |
| `POST` | `/api/certificate-types` | 新增证书类型 |

### 报名规则（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/registration-rules` | 规则列表 |
| `POST` | `/api/registration-rules` | 新增规则 |
| `PUT` | `/api/registration-rules/:id` | 编辑规则 |
| `DELETE` | `/api/registration-rules/:id` | 删除规则 |

### 培训 & 材料（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/training-materials` | 列表 |
| `POST` | `/api/training-materials` | 新增（含文件上传） |
| `PUT` | `/api/training-materials/:id` | 编辑（含文件上传） |
| `DELETE` | `/api/training-materials/:id` | 删除 |

### 报名管理（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/registrations` | 报名列表（分页、筛选） |
| `POST` | `/api/registrations` | 新增报名 |
| `PUT` | `/api/registrations/:id/review` | 审核报名 |
| `POST` | `/api/registrations/batch-import` | 批量导入 |

### 考试管理（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/exam-submissions` | 考试列表（分页、筛选） |
| `POST` | `/api/exam-submissions` | 新增考试（含文件上传） |
| `POST` | `/api/exam-submissions/:id/ai-review` | AI 审核 |
| `PUT` | `/api/exam-submissions/:id/review` | 人工审核 |
| `POST` | `/api/exam-submissions/batch-import` | 批量导入 |

### 证书记录（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/certificate-records` | 记录列表（分页、筛选） |
| `POST` | `/api/certificate-records` | 新增记录（含文件上传） |
| `POST` | `/api/certificate-records/batch-import` | 批量导入 |
| `GET` | `/api/stats` | 仪表盘统计数据 |

### 归档（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/archives` | 归档列表 |
| `POST` | `/api/archives` | 创建归档 |
| `GET` | `/api/archives/:id/details` | 归档详情 |
| `GET` | `/api/archives/:id/export` | 导出归档 Excel |

### 教务系统对接（管理端）

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/edusys/certificates/:studentNo` | 查询学生证书 |
| `POST` | `/api/edusys/sync` | 同步教务数据 |

### 学生门户

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| `GET` | `/api/student/me` | JWT(学生) | 个人信息 |
| `GET` | `/api/student/dashboard` | JWT(学生) | 个人仪表盘 |
| `GET` | `/api/student/certificates` | JWT(学生) | 可报名证书列表 |
| `GET` | `/api/student/registrations` | JWT(学生) | 我的报名 |
| `POST` | `/api/student/registrations` | JWT(学生) | 立即报名 |
| `GET` | `/api/student/exams` | JWT(学生) | 我的考试 |
| `POST` | `/api/student/exams` | JWT(学生) | 提交考试成绩 |
| `GET` | `/api/student/records` | JWT(学生) | 我的证书 |
| `GET` | `/api/student/materials` | JWT(学生) | 学习资源 |
| `GET` | `/api/student/approved-certificates` | JWT(学生) | 已通过报名的证书 |

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/public/materials` | 公开培训 & 材料 |
| `GET` | `/api/public/certificates` | 公开证书信息 |

---

## 数据库设计

使用 SQLite，共 9 张表：

```
users                    # 管理员账号
students                 # 学生信息（含登录密码哈希）
certificate_types        # 证书类型（人社/专业/校内引进）
certificates             # 证书信息
registration_rules       # 报名规则
training_materials       # 培训 & 辅导材料
student_registrations    # 学生报名记录
exam_submissions         # 考试提交记录
certificate_records      # 证书记录（获取情况）
archives                 # 归档记录
archive_details          # 归档明细
```

核心关系：

```
students ─── student_registrations ─── certificates ─── certificate_types
    │                                         │
    ├── exam_submissions ─────────────────────┘
    │       │ (approved → auto insert)
    │       ▼
    └── certificate_records
```

---

## AI 审核引擎

> 代码位置：[server/src/services/aiReviewService.ts](server/src/services/aiReviewService.ts)

### 审核维度

| 维度 | 检查内容 | 判定标准 |
|------|---------|---------|
| 材料完整性 | 是否上传了成绩单/证书扫描件 | `result_file_url` 不为空 |
| 成绩合格性 | 分数是否达标 | ≥ 60 分 |
| 前置条件 | 报名是否已通过审核 | `student_registrations.status = 'approved'` |

### 审核结果

| 结果 | 条件 | 置信度 |
|------|------|--------|
| ✅ 通过 | 三项全部满足 | 85% ~ 98% |
| ⚠️ 需补充材料 | 缺少附件 | 75% ~ 90% |
| ❌ 不通过 | 成绩不达标或报名未审核 | 80% ~ 95% |

> 💡 此引擎可替换为真实 AI API：修改 `aiReviewWithApi` 函数接入 OpenAI / Claude 等即可。

---

## 认证体系

```
┌─────────────────────────────────────────────────┐
│                  JWT Token                       │
│  Payload: { id, username, role, name }          │
│  Exp: 24h                                        │
└────────────┬────────────────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
┌─────────┐   ┌──────────────┐
│ role:   │   │ role:        │
│ admin / │   │ student      │
│ super_admin│              │
├─────────┤   ├──────────────┤
│ 管理端  │   │ 学生端        │
│ 全部数据 │   │ 仅本人数据    │
│ CRUD    │   │ 查看+报名+   │
│ 审核    │   │ 提交考试     │
└─────────┘   └──────────────┘
```

---

## 默认账号

| 角色 | 入口 | 账号 | 密码 | 说明 |
|------|------|------|------|------|
| 管理员 | http://localhost:5173 | `admin` | `admin123` | 超级管理员 |
| 学生（张三） | http://localhost:5174 | `2024001` | `024001` | 学号后6位 |
| 学生（李四） | http://localhost:5174 | `2024002` | `24002` | 学号后6位 |
| 学生（王五） | http://localhost:5174 | `2024003` | `24003` | 学号后6位 |
| 学生（赵六） | http://localhost:5174 | `2024004` | `24004` | 学号后6位 |
| 学生（孙七） | http://localhost:5174 | `2024005` | `24005` | 学号后6位 |

> 💡 **新增学生的默认密码**：管理端新增/批量导入学生时，系统自动取学号后6位作为默认密码（bcrypt 加密存储）。

---

## 公开门户

访问 **http://localhost:5173/public**（无需登录），展示：

- 🏷️ 证书信息（分类卡片展示）
- 📅 培训安排（时间、地点、讲师）
- 📖 辅导材料（视频/文档/链接）

---

## 批量操作

系统支持以下批量导入（Excel）：

| 功能 | 表头（支持中英文） |
|------|--------------------|
| 批量导入学生 | 学号、姓名、班级、专业、年级、电话、邮箱 |
| 批量导入报名 | 学号、证书名称 |
| 批量导入考试 | 学号、证书名称、考试日期、成绩 |
| 批量导入证书记录 | 学号、证书名称、获取日期、证书编号、成绩 |

---

## License

MIT
