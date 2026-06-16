import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { trainingApi, certificateApi } from '../../services/api';
import type { TrainingMaterial, Certificate } from '../../types';

export default function MaterialList() {
  const [data, setData] = useState<TrainingMaterial[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingMaterial | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await trainingApi.list({ type: 'material' });
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { certificateApi.list().then(r => setCerts(r.data)); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = { ...values, type: 'material' };
    try {
      if (editing) { await trainingApi.update(editing.id, payload); }
      else { await trainingApi.create(payload); }
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '操作失败'); }
  };

  const materialTypeColor: Record<string, string> = { video: 'purple', document: 'blue', link: 'cyan' };
  const materialTypeText: Record<string, string> = { video: '视频', document: '文档', link: '链接' };

  const columns = [
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '关联证书', dataIndex: 'certificate_name', width: 160 },
    { title: '类型', dataIndex: 'material_type', width: 80, render: (v: string) => <Tag color={materialTypeColor[v]}>{materialTypeText[v]}</Tag> },
    { title: '内容', dataIndex: 'content', ellipsis: true, width: 250 },
    { title: '文件', dataIndex: 'file_url', width: 120, render: (v: string) => v ? <a href={v} target="_blank" rel="noreferrer">查看</a> : '-' },
    {
      title: '公开', dataIndex: 'is_public', width: 70,
      render: (v: number) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>
    },
    {
      title: '操作', width: 150,
      render: (_: any, r: TrainingMaterial) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => { await trainingApi.delete(r.id); fetchData(); }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>辅导材料管理</h2>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新增材料</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1100 }} pagination={{ showTotal: (t) => `共 ${t} 条` }} />

      <Modal title={editing ? '编辑材料' : '新增材料'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="certificate_id" label="关联证书">
            <Select allowClear options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="material_type" label="材料类型" initialValue="document">
            <Select options={[{ label: '文档', value: 'document' }, { label: '视频', value: 'video' }, { label: '链接', value: 'link' }]} />
          </Form.Item>
          <Form.Item name="content" label="内容"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="file_url" label="文件链接"><Input placeholder="https://..." /></Form.Item>
          <Form.Item name="is_public" label="是否公开" initialValue={0}>
            <Select options={[{ label: '不公开', value: 0 }, { label: '公开', value: 1 }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
