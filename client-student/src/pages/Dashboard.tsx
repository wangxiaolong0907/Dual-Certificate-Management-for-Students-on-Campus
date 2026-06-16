import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Tag, Empty } from 'antd';
import {
  FormOutlined, FileTextOutlined, SafetyCertificateOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { StudentDashboard } from '../types';

export default function DashboardPage() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getDashboard()
      .then(res => { setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const statusColor: Record<string, string> = { pending: 'gold', approved: 'green', rejected: 'red' };
  const statusText: Record<string, string> = { pending: '待审核', approved: '已通过', rejected: '已拒绝' };

  return (
    <div>
      <h2>我的仪表盘</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="我的报名" value={data?.regCount || 0} prefix={<FormOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="考试提交" value={data?.examCount || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="已获证书" value={data?.recordCount || 0} prefix={<SafetyCertificateOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待审核" value={data?.pendingCount || 0} prefix={<ClockCircleOutlined />}
              valueStyle={{ color: data?.pendingCount ? '#cf1322' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="各类型证书获取统计">
            {data?.typeStats?.length ? (
              <Table dataSource={data.typeStats} rowKey="code" pagination={false} size="small"
                columns={[
                  { title: '证书类型', dataIndex: 'name', key: 'name' },
                  { title: '代码', dataIndex: 'code', key: 'code' },
                  { title: '已获数量', dataIndex: 'count', key: 'count' },
                ]} />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近报名记录">
            {data?.recentRegistrations?.length ? (
              <Table dataSource={data.recentRegistrations} rowKey="id" pagination={false} size="small"
                columns={[
                  { title: '证书', dataIndex: 'certificate_name', key: 'cert' },
                  { title: '时间', dataIndex: 'created_at', key: 'time', render: (v: string) => v?.slice(0, 10) },
                  { title: '状态', dataIndex: 'status', key: 'status',
                    render: (s: string) => <Tag color={statusColor[s]}>{statusText[s]}</Tag> },
                ]} />
            ) : <Empty description="暂无报名记录" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
