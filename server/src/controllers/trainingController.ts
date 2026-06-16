import { Request, Response } from 'express';
import { queryAll, queryOne, run, saveDb } from '../database/init';

export function getTrainingMaterials(req: Request, res: Response): void {
  try {
    const { type = '', certificate_id = '', is_public = '' } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (type) { where += ' AND tm.type = ?'; params.push(type); }
    if (certificate_id) { where += ' AND tm.certificate_id = ?'; params.push(certificate_id); }
    if (is_public !== '') { where += ' AND tm.is_public = ?'; params.push(is_public); }

    const list = queryAll(`
      SELECT tm.*, c.name as certificate_name
      FROM training_materials tm LEFT JOIN certificates c ON tm.certificate_id = c.id
      ${where} ORDER BY tm.id DESC
    `, params);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function createTrainingMaterial(req: Request, res: Response): void {
  try {
    const { type, title, content, certificate_id, training_date, location, instructor, material_type, is_public } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : (req.body.file_url || '');
    if (!type || !title) { res.status(400).json({ error: '类型和标题为必填项' }); return; }

    const result = run(
      `INSERT INTO training_materials (type, title, content, certificate_id, training_date, location, instructor, file_url, material_type, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, title, content || '', certificate_id || null, training_date || '', location || '', instructor || '', file_url, material_type || 'document', is_public ? 1 : 0]
    );
    saveDb();
    const item = queryOne('SELECT * FROM training_materials WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function updateTrainingMaterial(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { type, title, content, certificate_id, training_date, location, instructor, material_type, is_public } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : (req.body.file_url || undefined);

    if (file_url) {
      run(
        `UPDATE training_materials SET type=?, title=?, content=?, certificate_id=?, training_date=?, location=?, instructor=?, file_url=?, material_type=?, is_public=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [type, title, content || '', certificate_id || null, training_date || '', location || '', instructor || '', file_url, material_type || 'document', is_public ?? 0, id]
      );
    } else {
      run(
        `UPDATE training_materials SET type=?, title=?, content=?, certificate_id=?, training_date=?, location=?, instructor=?, material_type=?, is_public=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [type, title, content || '', certificate_id || null, training_date || '', location || '', instructor || '', material_type || 'document', is_public ?? 0, id]
      );
    }
    saveDb();
    const item = queryOne('SELECT * FROM training_materials WHERE id = ?', [id]);
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function deleteTrainingMaterial(req: Request, res: Response): void {
  try {
    run('DELETE FROM training_materials WHERE id = ?', [req.params.id]);
    saveDb();
    res.json({ message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export function getPublicMaterials(_req: Request, res: Response): void {
  try {
    const list = queryAll(`
      SELECT tm.*, c.name as certificate_name, ct.name as type_name
      FROM training_materials tm
      LEFT JOIN certificates c ON tm.certificate_id = c.id
      LEFT JOIN certificate_types ct ON c.type_id = ct.id
      WHERE tm.is_public = 1 ORDER BY tm.id DESC
    `);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
