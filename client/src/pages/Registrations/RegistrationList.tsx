import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Select, Modal, Form, Input, message, Tag, Upload } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { registrationApi, studentApi, certificateApi } from '../../services/api';
import type { StudentRegistration, Student, Certificate } from '../../types';

export default function RegistrationList() {
  const [data, setData] = useState<StudentRegistration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingReg, setReviewingReg] = useState<StudentRegistration | null>(null);
  const [form] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await registrationApi.list({ page, pageSize: 20, status: statusFilter });
      setData(res.data.list); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    studentApi.list({ pageSize: 1000 }).then(r => setStudents(r.data.list));
    certificateApi.list().then(r => setCerts(r.data));
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await registrationApi.create(values);
      message.success('报名成功'); setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '报名失败'); }
  };

  const handleReview = async () => {
    if (!reviewingReg) return;
    const values = await form.validateFields();
    try {
      await registrationApi.review(reviewingReg.id, values);
      message.success('审核完成'); setReviewModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '审核失败'); }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await registrationApi.batchImport(file);
      message.success(res.data.message);
      setImportModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '导入失败'); }
    return false;
  };

  const statusColor: Record<string, string> = { pending: 'gold', approved: 'green', rejected: 'red' };
  const statusText: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

  const columns = [
    { title: '学号', dataIndex: 'student_no', width: 110 },
    { title: '姓名', dataIndex: 'student_name', width: 90 },
    { title: '班级', dataIndex: 'class_name', width: 140 },
    { title: '证书', dataIndex: 'certificate_name', width: 180 },
    { title: '类型', dataIndex: 'type_name', width: 110 },
    { title: '报名时间', dataIndex: 'created_at', width: 160 },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => <Tag color={statusColor[s]}>{statusText[s]}</Tag> },
    { title: '审核人', dataIndex: 'reviewer_name', width: 100 },
    {
      title: '操作', width: 150,
      render: (_: any, r: StudentRegistration) => (
        <Space>
          {r.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => { setReviewingReg(r); form.resetFields(); setReviewModalOpen(true); }}>审核</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>报名管理</h2>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Select placeholder="按状态筛选" value={statusFilter || undefined} onChange={v => { setStatusFilter(v || ''); setPage(1); }}
          allowClear style={{ width: 140 }} options={[
            { label: '待审核', value: 'pending' }, { label: '已通过', value: 'approved' }, { label: '已拒绝', value: 'rejected' }
          ]} />
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>新增报名</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1100 }} />

      {/* 新增报名 Modal */}
      <Modal title="新增报名" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="student_id" label="学生" rules={[{ required: true }]}>
            <Select showSearch filterOption={(input, option) => (option?.label as string)?.includes(input)}
              options={students.map(s => ({ label: `${s.student_no} ${s.name}`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true }]}>
            <Select options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核 Modal */}
      <Modal title="审核报名" open={reviewModalOpen} onOk={handleReview} onCancel={() => setReviewModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select options={[{ label: '通过', value: 'approved' }, { label: '拒绝', value: 'rejected' }]} />
          </Form.Item>
          <Form.Item name="review_comment" label="审核意见"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      {/* 批量导入 Modal */}
      <Modal title="批量导入报名" open={importModalOpen} onCancel={() => setImportModalOpen(false)} footer={null}>
        <p>上传 Excel 文件，表头：学号、证书名称</p>
        <Upload accept=".xlsx,.xls" beforeUpload={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />}>选择文件并导入</Button>
        </Upload>
      </Modal>
    </div>
  );
}
