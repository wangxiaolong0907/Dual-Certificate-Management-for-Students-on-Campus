import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Empty, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { StudentRegistration } from '../types';

const { Paragraph } = Typography;

export default function MyRegistrationsPage() {
  const [data, setData] = useState<StudentRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMyRegistrations()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = { pending: 'gold', approved: 'green', rejected: 'red' };
  const statusText: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

  const columns = [
    { title: '证书名称', dataIndex: 'certificate_name', key: 'cert', width: 200 },
    { title: '证书类型', dataIndex: 'type_name', key: 'type', width: 120 },
    { title: '报名时间', dataIndex: 'created_at', key: 'time', width: 160, render: (v: string) => v?.slice(0, 19) },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusColor[s]}>{statusText[s]}</Tag>
    },
    { title: '审核人', dataIndex: 'reviewer_name', key: 'reviewer', width: 100, render: (v: string) => v || '--' },
    { title: '审核意见', dataIndex: 'review_comment', key: 'comment', render: (v: string) => v || '--' },
    { title: '审核时间', dataIndex: 'reviewed_at', key: 'reviewed', width: 160, render: (v: string) => v ? v.slice(0, 19) : '--' },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2><FormOutlined /> 我的报名</h2>
      <Paragraph type="secondary">查看您的证书考试报名记录及审核状态</Paragraph>
      {data.length === 0 ? <Empty description="暂无报名记录" /> : (
        <Table columns={columns} dataSource={data} rowKey="id"
          pagination={false} scroll={{ x: 900 }} />
      )}
    </div>
  );
}
