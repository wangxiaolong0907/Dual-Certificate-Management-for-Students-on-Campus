import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { certificateApi } from '../../services/api';
import type { Certificate, CertificateType } from '../../types';

export default function CertificateList() {
  const [data, setData] = useState<Certificate[]>([]);
  const [types, setTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [certs, typesRes] = await Promise.all([certificateApi.list(), certificateApi.types()]);
      setData(certs.data); setTypes(typesRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) { await certificateApi.update(editing.id, values); }
      else { await certificateApi.create(values); }
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '操作失败'); }
  };

  const columns = [
    { title: '证书名称', dataIndex: 'name', width: 200 },
    { title: '类型', dataIndex: 'type_name', width: 120, render: (v: string, r: Certificate) => <Tag color={r.type_code === 'RENSHE' ? 'blue' : r.type_code === 'ZHUANYE' ? 'green' : 'orange'}>{v}</Tag> },
    { title: '颁发机构', dataIndex: 'issuing_authority', width: 180 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '报名要求', dataIndex: 'requirements', width: 200, ellipsis: true },
    { title: '有效期', dataIndex: 'validity_period', width: 100 },
    {
      title: '状态', dataIndex: 'is_active', width: 80,
      render: (v: number) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag>
    },
    {
      title: '操作', width: 150,
      render: (_: any, r: Certificate) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => { await certificateApi.delete(r.id); fetchData(); }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>证书信息管理</h2>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setModalOpen(true); }}>新增证书</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1200 }} pagination={{ showTotal: (t) => `共 ${t} 条` }} />

      <Modal title={editing ? '编辑证书' : '新增证书'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="证书名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type_id" label="证书类型" rules={[{ required: true }]}>
            <Select options={types.map(t => ({ label: t.name, value: t.id }))} />
          </Form.Item>
          <Form.Item name="issuing_authority" label="颁发机构"><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="requirements" label="报名要求"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="validity_period" label="有效期"><Input placeholder="如: 3年" /></Form.Item>
          {editing && <Form.Item name="is_active" label="状态">
            <Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} />
          </Form.Item>}
        </Form>
      </Modal>
    </div>
  );
}
