import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Tag, Popconfirm, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ruleApi, certificateApi } from '../../services/api';
import type { RegistrationRule, Certificate } from '../../types';
import dayjs from 'dayjs';

export default function RuleList() {
  const [data, setData] = useState<RegistrationRule[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RegistrationRule | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rules, certsRes] = await Promise.all([ruleApi.list(), certificateApi.list()]);
      setData(rules.data); setCerts(certsRes.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      start_date: values.dateRange?.[0]?.format('YYYY-MM-DD') || '',
      end_date: values.dateRange?.[1]?.format('YYYY-MM-DD') || '',
      requirements_json: values.requirements_json ? JSON.parse(values.requirements_json) : {},
    };
    delete payload.dateRange;
    try {
      if (editing) { await ruleApi.update(editing.id, payload); }
      else { await ruleApi.create(payload); }
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '操作失败'); }
  };

  const columns = [
    { title: '规则名称', dataIndex: 'rule_name', width: 180 },
    { title: '证书', dataIndex: 'certificate_name', width: 200 },
    { title: '类型', dataIndex: 'type_name', width: 120 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '开始日期', dataIndex: 'start_date', width: 110 },
    { title: '结束日期', dataIndex: 'end_date', width: 110 },
    { title: '最大容量', dataIndex: 'max_capacity', width: 90 },
    { title: '状态', dataIndex: 'is_active', width: 80, render: (v: number) => <Tag color={v ? 'green' : 'red'}>{v ? '启用' : '停用'}</Tag> },
    {
      title: '操作', width: 150,
      render: (_: any, r: RegistrationRule) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditing(r); form.setFieldsValue({
              ...r, dateRange: r.start_date ? [dayjs(r.start_date), dayjs(r.end_date)] : undefined,
              requirements_json: r.requirements_json ? JSON.stringify(JSON.parse(r.requirements_json), null, 2) : '{}'
            }); setModalOpen(true);
          }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => { await ruleApi.delete(r.id); fetchData(); }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>报名规则管理</h2>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); form.setFieldsValue({ requirements_json: '{}' }); setModalOpen(true); }}>新增规则</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1200 }} pagination={{ showTotal: (t) => `共 ${t} 条` }} />

      <Modal title={editing ? '编辑规则' : '新增规则'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true }]}>
            <Select options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="rule_name" label="规则名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="dateRange" label="报名时间范围"><DatePicker.RangePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="max_capacity" label="最大报名人数"><Input type="number" /></Form.Item>
          <Form.Item name="requirements_json" label="报名条件 (JSON)"><Input.TextArea rows={4} placeholder='{"grade":"2024","major":"计算机"}' /></Form.Item>
          <Form.Item name="is_active" label="状态" initialValue={1}>
            <Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
