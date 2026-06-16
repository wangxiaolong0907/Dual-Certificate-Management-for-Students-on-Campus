import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Input, Select, Modal, Form, message, Upload, Tag, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import { studentApi } from '../../services/api';
import type { Student } from '../../types';

export default function StudentList() {
  const [data, setData] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentApi.list({ page, pageSize: 20, keyword, class_name: classFilter });
      setData(res.data.list); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, keyword, classFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    studentApi.getClasses().then(res => setClasses((res.data as any[]).map((c: any) => c.class_name)));
  }, []);

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editingStudent) {
        await studentApi.update(editingStudent.id, values);
        message.success('更新成功');
      } else {
        await studentApi.create(values);
        message.success('创建成功');
      }
      setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '操作失败'); }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await studentApi.batchImport(file);
      message.success(res.data.message);
      setImportModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '导入失败'); }
    return false;
  };

  const columns = [
    { title: '学号', dataIndex: 'student_no', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '班级', dataIndex: 'class_name', width: 150 },
    { title: '专业', dataIndex: 'major', width: 150 },
    { title: '年级', dataIndex: 'grade', width: 80 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'inactive' ? 'orange' : 'red'}>
        {s === 'active' ? '在读' : s === 'inactive' ? '休学' : '毕业'}
      </Tag>
    },
    {
      title: '操作', width: 150,
      render: (_: any, record: Student) => (
        <Space>
          <Button size="small" onClick={() => { setEditingStudent(record); form.setFieldsValue(record); setModalOpen(true); }}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={async () => { await studentApi.delete(record.id); fetchData(); message.success('删除成功'); }}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>学生管理</h2>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索学号/姓名/专业" value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }} allowClear style={{ width: 220 }} />
          <Select placeholder="按班级筛选" value={classFilter || undefined} onChange={v => { setClassFilter(v || ''); setPage(1); }}
            allowClear style={{ width: 160 }} options={classes.map(c => ({ label: c, value: c }))} />
        </Space>
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingStudent(null); form.resetFields(); setModalOpen(true); }}>新增学生</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1200 }} />

      {/* 新增/编辑 Modal */}
      <Modal title={editingStudent ? '编辑学生' : '新增学生'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="student_no" label="学号" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="class_name" label="班级" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="major" label="专业"><Input /></Form.Item>
          <Form.Item name="grade" label="年级"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          {editingStudent && <Form.Item name="status" label="状态">
            <Select options={[{ label: '在读', value: 'active' }, { label: '休学', value: 'inactive' }, { label: '毕业', value: 'graduated' }]} />
          </Form.Item>}
        </Form>
      </Modal>

      {/* 批量导入 Modal */}
      <Modal title="批量导入学生" open={importModalOpen} onCancel={() => setImportModalOpen(false)} footer={null}>
        <p style={{ marginBottom: 16 }}>请上传 Excel 文件（.xlsx/.xls），表头包含：学号、姓名、班级、专业、年级、电话、邮箱</p>
        <Upload accept=".xlsx,.xls" beforeUpload={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />}>选择文件并导入</Button>
        </Upload>
      </Modal>
    </div>
  );
}
