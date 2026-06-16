import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Select, Modal, Form, Input, InputNumber, message, Tag, Upload, Descriptions, Badge } from 'antd';
import { PlusOutlined, UploadOutlined, RobotOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { examApi, studentApi, certificateApi } from '../../services/api';
import type { ExamSubmission, Student, Certificate } from '../../types';

export default function ExamList() {
  const [data, setData] = useState<ExamSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [aiResultModalOpen, setAiResultModalOpen] = useState(false);
  const [reviewingExam, setReviewingExam] = useState<ExamSubmission | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [addForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [importModalOpen, setImportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await examApi.list({ page, pageSize: 20, status: statusFilter });
      setData(res.data.list); setTotal(res.data.total);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    studentApi.list({ pageSize: 1000 }).then(r => setStudents(r.data.list));
    certificateApi.list().then(r => setCerts(r.data));
  }, []);

  const handleCreate = async () => {
    const values = await addForm.validateFields();
    try {
      await examApi.create(values);
      message.success('提交成功'); setAddModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '提交失败'); }
  };

  const handleAiReview = async (id: number) => {
    try {
      const res = await examApi.aiReview(id);
      setAiResult(res.data.review);
      setAiResultModalOpen(true);
      fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || 'AI审核失败'); }
  };

  const handleManualReview = async () => {
    if (!reviewingExam) return;
    const values = await reviewForm.validateFields();
    try {
      await examApi.review(reviewingExam.id, values);
      message.success('审核完成'); setReviewModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '审核失败'); }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await examApi.batchImport(file);
      message.success(res.data.message);
      setImportModalOpen(false); fetchData();
    } catch (err: any) { message.error(err.response?.data?.error || '导入失败'); }
    return false;
  };

  const statusColor: Record<string, string> = { pending: 'default', ai_reviewed: 'blue', approved: 'green', rejected: 'red' };
  const statusText: Record<string, string> = { pending: '待审核', ai_reviewed: 'AI已审核', approved: '已通过', rejected: '已拒绝' };
  const aiResultText: Record<string, string> = { pass: '通过', need_material: '需补充材料', fail: '不通过' };
  const aiResultColor: Record<string, string> = { pass: 'green', need_material: 'orange', fail: 'red' };

  const columns = [
    { title: '学号', dataIndex: 'student_no', width: 110 },
    { title: '姓名', dataIndex: 'student_name', width: 80 },
    { title: '班级', dataIndex: 'class_name', width: 130 },
    { title: '证书', dataIndex: 'certificate_name', width: 170 },
    { title: '考试日期', dataIndex: 'exam_date', width: 110 },
    { title: '成绩', dataIndex: 'score', width: 70 },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: (s: string, r: ExamSubmission) => (
        <Space>
          <Tag color={statusColor[s]}>{statusText[s]}</Tag>
          {r.ai_review_result && <Tag color={aiResultColor[r.ai_review_result]}>{aiResultText[r.ai_review_result]}</Tag>}
        </Space>
      )
    },
    { title: '审核人', dataIndex: 'reviewer_name', width: 90 },
    {
      title: '操作', width: 280, fixed: 'right' as const,
      render: (_: any, r: ExamSubmission) => (
        <Space>
          {r.status === 'pending' && (
            <Button size="small" type="primary" icon={<RobotOutlined />} onClick={() => handleAiReview(r.id)}>AI审核</Button>
          )}
          {(r.status === 'pending' || r.status === 'ai_reviewed') && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => {
              setReviewingExam(r); reviewForm.resetFields(); setReviewModalOpen(true);
            }}>人工审核</Button>
          )}
          {r.ai_review_result && (
            <Button size="small" icon={<EyeOutlined />} onClick={() => {
              setAiResult({
                result: r.ai_review_result,
                confidence: r.ai_review_confidence,
                comment: r.ai_review_comment,
              });
              setAiResultModalOpen(true);
            }}>查看AI结果</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2>考试管理</h2>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Select placeholder="按状态筛选" value={statusFilter || undefined} onChange={v => { setStatusFilter(v || ''); setPage(1); }}
          allowClear style={{ width: 160 }} options={[
            { label: '待审核', value: 'pending' }, { label: 'AI已审核', value: 'ai_reviewed' },
            { label: '已通过', value: 'approved' }, { label: '已拒绝', value: 'rejected' }
          ]} />
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>批量导入</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { addForm.resetFields(); setAddModalOpen(true); }}>提交考试信息</Button>
        </Space>
      </div>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading}
        pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1300 }} />

      {/* 提交考试 Modal */}
      <Modal title="提交考试信息" open={addModalOpen} onOk={handleCreate} onCancel={() => setAddModalOpen(false)}>
        <Form form={addForm} layout="vertical">
          <Form.Item name="student_id" label="学生" rules={[{ required: true }]}>
            <Select showSearch filterOption={(input, option) => (option?.label as string)?.includes(input)}
              options={students.map(s => ({ label: `${s.student_no} ${s.name}`, value: s.id }))} />
          </Form.Item>
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true }]}>
            <Select options={certs.map(c => ({ label: c.name, value: c.id }))} />
          </Form.Item>
          <Form.Item name="exam_date" label="考试日期"><Input placeholder="2025-01-15" /></Form.Item>
          <Form.Item name="score" label="成绩"><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* 人工审核 Modal */}
      <Modal title="人工审核" open={reviewModalOpen} onOk={handleManualReview} onCancel={() => setReviewModalOpen(false)}>
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select options={[{ label: '通过', value: 'approved' }, { label: '拒绝', value: 'rejected' }]} />
          </Form.Item>
          <Form.Item name="review_comment" label="审核意见"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      {/* AI 审核结果 Modal */}
      <Modal title="AI 审核结果" open={aiResultModalOpen} onCancel={() => setAiResultModalOpen(false)} footer={null} width={560}>
        {aiResult && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="审核结果">
              <Tag color={aiResultColor[aiResult.result]}>{aiResultText[aiResult.result]}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="置信度">{Math.round((aiResult.confidence || 0) * 100)}%</Descriptions.Item>
            <Descriptions.Item label="AI评语">{aiResult.comment}</Descriptions.Item>
            <Descriptions.Item label="材料完整性">
              <Badge status={aiResult.details?.materialComplete ? 'success' : 'error'}
                text={aiResult.details?.materialComplete ? '完整' : '不完整'} />
            </Descriptions.Item>
            <Descriptions.Item label="成绩及格">
              <Badge status={aiResult.details?.scorePassed ? 'success' : 'error'}
                text={aiResult.details?.scorePassed ? '已通过' : '未通过'} />
            </Descriptions.Item>
            <Descriptions.Item label="前置条件">
              <Badge status={aiResult.details?.prerequisitesMet ? 'success' : 'error'}
                text={aiResult.details?.prerequisitesMet ? '满足' : '不满足'} />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* 批量导入 Modal */}
      <Modal title="批量导入考试成绩" open={importModalOpen} onCancel={() => setImportModalOpen(false)} footer={null}>
        <p>上传 Excel 文件，表头：学号、证书名称、考试日期、成绩</p>
        <Upload accept=".xlsx,.xls" beforeUpload={handleImport} maxCount={1}>
          <Button icon={<UploadOutlined />}>选择文件并导入</Button>
        </Upload>
      </Modal>
    </div>
  );
}
