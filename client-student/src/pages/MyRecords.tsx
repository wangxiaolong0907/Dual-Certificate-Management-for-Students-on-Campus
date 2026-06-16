import React, { useEffect, useState } from 'react';
import { Table, Tag, Spin, Empty, Typography } from 'antd';
import { FileDoneOutlined } from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { CertificateRecord } from '../types';

const { Paragraph } = Typography;

export default function MyRecordsPage() {
  const [data, setData] = useState<CertificateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMyRecords()
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = { obtained: 'green', pending: 'gold', failed: 'red' };
  const statusText: Record<string, string> = { obtained: '已获得', pending: '获取中', failed: '未通过' };

  const columns = [
    { title: '证书名称', dataIndex: 'certificate_name', width: 200 },
    { title: '类型', dataIndex: 'type_name', width: 100 },
    { title: '获取日期', dataIndex: 'obtain_date', width: 120 },
    { title: '证书编号', dataIndex: 'certificate_no', width: 150, render: (v: string) => v || '--' },
    { title: '成绩', dataIndex: 'score', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: string) => <Tag color={statusColor[s]}>{statusText[s]}</Tag>
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2><FileDoneOutlined /> 我的证书</h2>
      <Paragraph type="secondary">您已获得的证书记录</Paragraph>
      {data.length === 0 ? <Empty description="暂无证书记录" /> : (
        <Table columns={columns} dataSource={data} rowKey="id"
          pagination={false} scroll={{ x: 800 }} />
      )}
    </div>
  );
}
