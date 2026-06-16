import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Upload, Tag, Spin, Empty, message, Typography } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { StudentExam, ApprovedCertificate } from '../types';

const { Paragraph } = Typography;

export default function MyExamsPage() {
  const [data, setData] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [approvedCerts, setApprovedCerts] = useState<ApprovedCertificate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    studentApi.getMyExams()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openSubmitModal = async () => {
    try {
      const res = await studentApi.getApprovedCertificates();
      setApprovedCerts(res.data);
      if (res.data.length === 0) {
        message.warning('您暂无已通过报名的证书，请先报名并获得审核通过');
        return;
      }
      form.resetFields();
      setModalOpen(true);
    } catch {
      message.error('获取可考试证书失败');
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const file = values.file?.[0]?.originFileObj;
      const payload = {
        certificate_id: values.certificate_id,
        exam_date: values.exam_date,
        score: values.score || 0,
      };
      const res = await studentApi.submitExam(payload, file);
      message.success(res.data.message || '提交成功');
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err.response) {
        message.error(err.response.data?.error || '提交失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'gold', ai_reviewed: 'blue', approved: 'green', rejected: 'red'
  };
  const statusText: Record<string, string> = {
    pending: '待审核', ai_reviewed: 'AI已审', approved: '已通过', rejected: '已拒绝'
  };

  const columns = [
    { title: '证书名称', dataIndex: 'certificate_name', width: 180 },
    { title: '类型', dataIndex: 'type_name', width: 100 },
    { title: '考试日期', dataIndex: 'exam_date', width: 110 },
    { title: '成绩', dataIndex: 'score', width: 80 },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (s: string) => <Tag color={statusColor[s]}>{statusText[s]}</Tag> },
    { title: 'AI审核', dataIndex: 'ai_review_result', width: 90,
      render: (v: string, r: StudentExam) => v ? (
        <span>{v === 'pass' ? '✅ 通过' : v === 'fail' ? '❌ 不通过' : '⚠ 需补充'} ({Math.round(r.ai_review_confidence * 100)}%)</span>
      ) : '--' },
    { title: '审核意见', dataIndex: 'review_comment', render: (v: string) => v || '--' },
    { title: '提交时间', dataIndex: 'created_at', width: 160, render: (v: string) => v?.slice(0, 19) },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}><FileTextOutlined /> 我的考试</h2>
          <Paragraph type="secondary">查看考试记录及审核结果</Paragraph>
        </div>
        <Button type="primary" icon={<UploadOutlined />} onClick={openSubmitModal}>
          提交考试成绩
        </Button>
      </div>

      {data.length === 0 ? <Empty description="暂无考试记录" /> : (
        <Table columns={columns} dataSource={data} rowKey="id"
          pagination={false} scroll={{ x: 1000 }} />
      )}

      {/* 提交考试 Modal */}
      <Modal title="提交考试成绩" open={modalOpen} onOk={handleSubmit}
        onCancel={() => setModalOpen(false)} confirmLoading={submitting}>
        <Form form={form} layout="vertical">
          <Form.Item name="certificate_id" label="证书" rules={[{ required: true, message: '请选择证书' }]}>
            <Select options={approvedCerts.map(c => ({ label: `${c.name} (${c.type_name})`, value: c.id }))}
              placeholder="选择已通过报名的证书" />
          </Form.Item>
          <Form.Item name="exam_date" label="考试日期" rules={[{ required: true, message: '请选择考试日期' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="score" label="成绩（分数）">
            <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="请输入考试成绩" />
          </Form.Item>
          <Form.Item name="file" label="成绩单/证书附件" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
            <Upload accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx" maxCount={1} beforeUpload={() => false}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
