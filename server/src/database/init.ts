import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic, QueryExecResult } from 'sql.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'data.db');

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Helper: run a query and return all rows as objects
export function queryAll(sql: string, params: any[] = []): any[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  try {
    stmt.bind(params);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    return rows;
  } finally {
    stmt.free();
  }
}

// Helper: run a query and return the first row
export function queryOne(sql: string, params: any[] = []): any | undefined {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
export function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
  const database = getDb();
  database.run(sql, params);
  const lastId = database.exec('SELECT last_insert_rowid() as id');
  const changes = database.getRowsModified();
  return {
    lastInsertRowid: lastId[0]?.values[0]?.[0] as number || 0,
    changes,
  };
}

// Helper: execute raw SQL (for CREATE TABLE, etc.)
export function exec(sql: string): void {
  const database = getDb();
  database.run(sql);
}

// Transaction helper
export function transaction(fn: () => void): void {
  const database = getDb();
  database.run('BEGIN');
  try {
    fn();
    database.run('COMMIT');
  } catch (e) {
    database.run('ROLLBACK');
    throw e;
  }
}

export async function initDatabase(): Promise<void> {
  if (db) return;

  SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('super_admin','admin')),
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      major TEXT NOT NULL DEFAULT '',
      grade TEXT NOT NULL DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      password_hash TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','graduated')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS certificate_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_required INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type_id INTEGER NOT NULL,
      issuing_authority TEXT DEFAULT '',
      description TEXT DEFAULT '',
      requirements TEXT DEFAULT '',
      validity_period TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (type_id) REFERENCES certificate_types(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registration_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id INTEGER NOT NULL,
      rule_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      requirements_json TEXT DEFAULT '{}',
      start_date TEXT DEFAULT '',
      end_date TEXT DEFAULT '',
      max_capacity INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (certificate_id) REFERENCES certificates(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS training_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('training','material')),
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      certificate_id INTEGER,
      training_date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      instructor TEXT DEFAULT '',
      file_url TEXT DEFAULT '',
      material_type TEXT DEFAULT 'document' CHECK(material_type IN ('video','document','link')),
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS student_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      certificate_id INTEGER NOT NULL,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      reviewer_id INTEGER,
      review_comment TEXT DEFAULT '',
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (certificate_id) REFERENCES certificates(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exam_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      certificate_id INTEGER NOT NULL,
      exam_date TEXT DEFAULT '',
      score REAL DEFAULT 0,
      result_file_url TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','ai_reviewed','approved','rejected')),
      ai_review_result TEXT DEFAULT '',
      ai_review_confidence REAL DEFAULT 0,
      ai_review_comment TEXT DEFAULT '',
      reviewer_id INTEGER,
      review_comment TEXT DEFAULT '',
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (certificate_id) REFERENCES certificates(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS certificate_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      certificate_id INTEGER NOT NULL,
      obtain_date TEXT DEFAULT '',
      certificate_no TEXT DEFAULT '',
      score REAL DEFAULT 0,
      file_url TEXT DEFAULT '',
      status TEXT DEFAULT 'obtained' CHECK(status IN ('obtained','pending','failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (certificate_id) REFERENCES certificates(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_name TEXT NOT NULL,
      certificate_id INTEGER NOT NULL,
      archive_name TEXT NOT NULL,
      archive_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_url TEXT DEFAULT '',
      student_count INTEGER DEFAULT 0,
      pass_count INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (certificate_id) REFERENCES certificates(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS archive_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      archive_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      exam_submission_id INTEGER,
      FOREIGN KEY (archive_id) REFERENCES archives(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (exam_submission_id) REFERENCES exam_submissions(id)
    )
  `);

  // Seed data
  seedData();
  saveDatabase();
}

function seedData(): void {
  const database = getDb();
  const count = queryOne('SELECT COUNT(*) as count FROM users') as any;
  if (count && count.count > 0) return;

  // Default admin
  const hash = bcrypt.hashSync('admin123', 10);
  database.run('INSERT INTO users (username, password_hash, role, name) VALUES (?, ?, ?, ?)',
    ['admin', hash, 'super_admin', '系统管理员']);

  // Certificate types
  database.run('INSERT INTO certificate_types (code, name, description, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
    ['RENSHE', '人社证书', '人力资源和社会保障部门颁发的职业资格证书', 1, 1]);
  database.run('INSERT INTO certificate_types (code, name, description, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
    ['ZHUANYE', '专业证书', '专业相关的行业认证证书', 1, 2]);
  database.run('INSERT INTO certificate_types (code, name, description, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
    ['XIAONEI', '校内引进证书', '学校引进的各类技能认证证书', 0, 3]);

  // Sample certificates
  const certs = [
    ['计算机等级考试二级', 1, '教育部考试中心', '全国计算机等级考试二级证书', '完成计算机基础课程学习'],
    ['英语四级(CET-4)', 1, '教育部考试中心', '全国大学英语四级考试', '英语课程成绩合格'],
    ['会计从业资格证', 2, '财政部', '会计从业人员基本资格证书', '完成会计基础课程'],
    ['软件设计师', 2, '工信部', '计算机软件专业技术资格', '完成软件工程相关课程'],
    ['普通话等级证书', 3, '国家语委', '普通话水平测试等级证书', '无'],
    ['电子商务师', 3, '工信部', '电子商务专业技能认证', '完成电商相关课程'],
  ];
  for (const c of certs) {
    database.run('INSERT INTO certificates (name, type_id, issuing_authority, description, requirements) VALUES (?, ?, ?, ?, ?)', c);
  }

  // Sample students
  const students = [
    ['2024001', '张三', '计算机2401班', '计算机科学与技术', '2024'],
    ['2024002', '李四', '计算机2401班', '计算机科学与技术', '2024'],
    ['2024003', '王五', '软件2401班', '软件工程', '2024'],
    ['2024004', '赵六', '软件2401班', '软件工程', '2024'],
    ['2024005', '孙七', '会计2401班', '会计学', '2024'],
  ];
  for (const s of students) {
    const defaultPwd = s[0].slice(-6); // last 6 chars of student_no
    const pwdHash = bcrypt.hashSync(defaultPwd, 10);
    database.run('INSERT INTO students (student_no, name, class_name, major, grade, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [...s, pwdHash]);
  }
}

function saveDatabase(): void {
  const database = getDb();
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Auto-save helper: call after any write operation
export function saveDb(): void {
  saveDatabase();
}
