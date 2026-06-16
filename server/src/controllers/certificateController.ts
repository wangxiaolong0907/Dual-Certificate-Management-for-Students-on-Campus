import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';

export function getCertificateTypes(_req: Request, res: Response): void {
  try {
    const types = queryAll('SELECT * FROM certificate_types ORDER BY sort_order');
    res.json(types);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createCertificateType(req: Request, res: Response): void {
  try {
    const { code, name, description, is_required, sort_order } = req.body;
    if (!code || !name) {
      res.status(400).json({ error: '类型编码和名称为必填项' }); return;
    }
    const result = run(
      'INSERT INTO certificate_types (code, name, description, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
      [code, name, description || '', is_required ? 1 : 0, sort_order || 0]
    );
    saveDb();
    const type = queryOne('SELECT * FROM certificate_types WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(type);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getCertificates(req: Request, res: Response): void {
  try {
    const { type_id = '', is_active = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (type_id) { where += ' AND c.type_id = ?'; params.push(type_id); }
    if (is_active !== '') { where += ' AND c.is_active = ?'; params.push(is_active); }

    const list = queryAll(`
      SELECT c.*, ct.name as type_name, ct.code as type_code
      FROM certificates c LEFT JOIN certificate_types ct ON c.type_id = ct.id
      ${where} ORDER BY c.id DESC
    `, params);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createCertificate(req: Request, res: Response): void {
  try {
    const { name, type_id, issuing_authority, description, requirements, validity_period } = req.body;
    if (!name || !type_id) {
      res.status(400).json({ error: '证书名称和类型为必填项' }); return;
    }
    const result = run(
      'INSERT INTO certificates (name, type_id, issuing_authority, description, requirements, validity_period) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type_id, issuing_authority || '', description || '', requirements || '', validity_period || '']
    );
    saveDb();
    const cert = queryOne(`
      SELECT c.*, ct.name as type_name FROM certificates c
      LEFT JOIN certificate_types ct ON c.type_id = ct.id WHERE c.id = ?
    `, [result.lastInsertRowid]);
    res.status(201).json(cert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateCertificate(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { name, type_id, issuing_authority, description, requirements, validity_period, is_active } = req.body;
    const existing = queryOne('SELECT * FROM certificates WHERE id = ?', [id]);
    if (!existing) { res.status(404).json({ error: '证书不存在' }); return; }

    run(`UPDATE certificates SET name=?, type_id=?, issuing_authority=?, description=?, requirements=?, validity_period=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [name, type_id, issuing_authority || '', description || '', requirements || '', validity_period || '', is_active ?? 1, id]);
    saveDb();
    const cert = queryOne('SELECT c.*, ct.name as type_name FROM certificates c LEFT JOIN certificate_types ct ON c.type_id = ct.id WHERE c.id = ?', [id]);
    res.json(cert);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteCertificate(req: Request, res: Response): void {
  try {
    run('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getRegistrationRules(req: Request, res: Response): void {
  try {
    const { certificate_id = '' } = req.query;
    let where = '';
    const params: any[] = [];
    if (certificate_id) { where = 'WHERE rr.certificate_id = ?'; params.push(certificate_id); }

    const list = queryAll(`
      SELECT rr.*, c.name as certificate_name, ct.name as type_name
      FROM registration_rules rr
      LEFT JOIN certificates c ON rr.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id ${where} ORDER BY rr.id DESC
    `, params);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createRegistrationRule(req: Request, res: Response): void {
  try {
    const { certificate_id, rule_name, description, requirements_json, start_date, end_date, max_capacity, is_active } = req.body;
    if (!certificate_id || !rule_name) {
      res.status(400).json({ error: '证书和规则名称为必填项' }); return;
    }
    const result = run(
      'INSERT INTO registration_rules (certificate_id, rule_name, description, requirements_json, start_date, end_date, max_capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [certificate_id, rule_name, description || '', JSON.stringify(requirements_json || {}), start_date || '', end_date || '', max_capacity || 0, is_active ? 1 : 0]
    );
    saveDb();
    const rule = queryOne('SELECT * FROM registration_rules WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateRegistrationRule(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { rule_name, description, requirements_json, start_date, end_date, max_capacity, is_active } = req.body;
    run(
      'UPDATE registration_rules SET rule_name=?, description=?, requirements_json=?, start_date=?, end_date=?, max_capacity=?, is_active=? WHERE id=?',
      [rule_name, description || '', JSON.stringify(requirements_json || {}), start_date || '', end_date || '', max_capacity || 0, is_active ?? 1, id]
    );
    saveDb();
    const rule = queryOne('SELECT * FROM registration_rules WHERE id = ?', [id]);
    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteRegistrationRule(req: Request, res: Response): void {
  try {
    run('DELETE FROM registration_rules WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
