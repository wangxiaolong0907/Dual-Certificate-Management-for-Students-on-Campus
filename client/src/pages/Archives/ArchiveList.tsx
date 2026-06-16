import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Modal, Form, Select, Input, message, Tag, Descriptions } from 'antd';
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import { archiveApi, certificateApi, studentApi } from '../../services/api';
import type { Archive, Certificate } from '../../types';

export default function ArchiveList() {
  const [data, setData] = useState<Archive[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await archiveApi.list({ page, pageSize: 20 });
      setData(res.data.list); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    certificateApi.list().then(r => setCerts(r.data));
    studentApi.getClasses().then(r => setClasses((r.data as any[]).map((c: any) => c.class_name)));
  }, []);

  const handleCreateArchive = async () => {
    const values = await form.validateFields();
    try {
      await archiveApi.create(values);
      message.success('归档成功'); setModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '归档失败'); }
  };

  const handleViewDetail = async (archive: Archive) => {
    try {
      const res = await archiveApi.detail(archive.id);
      setDetailData(res.data as any[]);
      setSummary({ studentCount: archive.student_count, passCount: archive.pass_count });
      setDetailModalOpen(true);
    } catch (err: any) { message.error('获取详情失败'); }
  };

  const columns = [
    { title: '班级', dataIndex: 'class_name', width: 150 },
    { title: '证书', dataIndex: 'certificate_name', width: 200 },
    { title: '归档名称', dataIndex: 'archive_name', width: 180 },
    { title: '归档日期', dataIndex: 'archive_date', width: 160 },
    { title: '学生数', dataIndex: 'student_count', width: 80 },
    { title: '通过数', dataIndex: 'pass_count', width: 80 },
    {
      title: '通过率', width: 80,
      render: (_: any, r: Archive) => <Tag color={r.pass_count / r.student_count >= 0.6 ? 'green' : 'orange'}>{Math.round((r.pass_count / r.student_count) * 100)}%</Tag>
    },
    { title: '创建人', dataIndex: 'creator_name', width: 100 },
    {
      title: '操作', width: 180,
      render: (_: any, r: Archive) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          <a href={archiveApi.exportUrl(r.id)} target="_blank" rel="noopener noreferrer">
            <Button size="small" icon={<DownloadOutlined />}>下载</Button>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>归档管理</h2>
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>新建归档</Button>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }} />

      <Modal title="新建归档" open={modalOpen} onOk={handleCreateArchive} onCancel={() => setModalOpen(false)}>
        <p style={{ color: '#666', marginBottom: 16 }}>归档指定班级中已通过审核的考试记录，生成 Excel 归档文件。</p>
        <Form form={form} layout="vertical">
          <Form.Item name="class_name" label="班级" rules={[{ required: true }]}>
            <Select options={classes.map(c => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true }]}>
            <Select options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="archive_name" label="归档名称"><Input placeholder="可选，默认为班级_证书归档" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="归档详情" open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={null} width={700}>
        {summary && (
          <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="学生总数">{summary.studentCount}</Descriptions.Item>
            <Descriptions.Item label="通过人数">{summary.passCount}</Descriptions.Item>
            <Descriptions.Item label="通过率">{Math.round((summary.passCount / summary.studentCount) * 100)}%</Descriptions.Item>
          </Descriptions>
        )}
        <Table dataSource={detailData} rowKey="id" pagination={false} size="small"
          columns={[
            { title: '学号', dataIndex: 'student_no' },
            { title: '姓名', dataIndex: 'student_name' },
            { title: '成绩', dataIndex: 'score' },
            { title: '考试日期', dataIndex: 'exam_date' },
          ]} />
      </Modal>
    </div>
  );
}
