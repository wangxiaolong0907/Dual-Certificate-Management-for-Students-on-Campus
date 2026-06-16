import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Select, Modal, Form, Input, InputNumber, message, Tag, Upload } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { recordApi, studentApi, certificateApi } from '../../services/api';
import type { CertificateRecord, Student, Certificate } from '../../types';

export default function RecordList() {
  const [data, setData] = useState<CertificateRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [students, setStudents] = useState<Student[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await recordApi.list({ page, pageSize: 20 });
      setData(res.data.list); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    studentApi.list({ pageSize: 1000 }).then(r => setStudents(r.data.list));
    certificateApi.list().then(r => setCerts(r.data));
  }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    try {
      await recordApi.create(values);
      message.success('添加成功'); setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '添加失败'); }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await recordApi.batchImport(file);
      message.success(res.data.message);
      setImportModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '导入失败'); }
    return false;
  };

  const columns = [
    { title: '学号', dataIndex: 'student_no', width: 110 },
    { title: '姓名', dataIndex: 'student_name', width: 80 },
    { title: '班级', dataIndex: 'class_name', width: 140 },
    { title: '专业', dataIndex: 'major', width: 140 },
    { title: '证书', dataIndex: 'certificate_name', width: 180 },
    { title: '类型', dataIndex: 'type_name', width: 110 },
    { title: '获取日期', dataIndex: 'obtain_date', width: 110 },
    { title: '证书编号', dataIndex: 'certificate_no', width: 160 },
    { title: '成绩', dataIndex: 'score', width: 70 },
    { title: '状态', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'obtained' ? 'green' : s === 'pending' ? 'gold' : 'red'}>{s === 'obtained' ? '已获取' : s === 'pending' ? '待获取' : '未通过'}</Tag> },
  ];

  return (
    <div>
      <h2>证书获取记录</h2>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>新增记录</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1300 }} />

      <Modal title="新增证书记录" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="student_id" label="学生" rules={[{ required: true }]}>
            <Select showSearch filterOption={(input, option) => (option?.label as string)?.includes(input)}
              options={students.map(s => ({ label: `${s.student_no} ${s.name}`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true }]}>
            <Select options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="obtain_date" label="获取日期"><Input placeholder="2025-06-15" /></Form.Item>
          <Form.Item name="certificate_no" label="证书编号"><Input /></Form.Item>
          <Form.Item name="score" label="成绩"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="批量导入证书记录" open={importModalOpen} onCancel={() => setImportModalOpen(false)} footer={null}>
        <p>上传 Excel 文件，表头：学号、证书名称、获取日期、证书编号、成绩</p>
        <Upload accept=".xlsx,.xls" beforeUpload={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />}>选择文件并导入</Button>
        </Upload>
      </Modal>
    </div>
  );
}
