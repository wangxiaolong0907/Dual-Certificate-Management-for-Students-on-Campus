import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Spin } from 'antd';
import { UserOutlined, SafetyCertificateOutlined, FormOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { recordApi } from '../services/api';
import type { DashboardStats } from '../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    recordApi.stats().then(res => { setStats(res.data); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="在校学生" value={stats?.totalStudents || 0} prefix={<UserOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="证书获取总数" value={stats?.totalRecords || 0} prefix={<SafetyCertificateOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="报名总数" value={stats?.totalRegistrations || 0} prefix={<FormOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="待审核" value={stats?.pendingReviews || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: stats?.pendingReviews ? '#cf1322' : undefined }} /></Card></Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="各类型证书获取统计">
            <Table dataSource={stats?.typeStats || []} rowKey="code" pagination={false}
              columns={[
                { title: '证书类型', dataIndex: 'name', key: 'name' },
                { title: '代码', dataIndex: 'code', key: 'code' },
                { title: '获取数量', dataIndex: 'count', key: 'count' },
              ]} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各班级证书获取统计">
            <Table dataSource={stats?.classStats || []} rowKey="class_name" pagination={false}
              columns={[
                { title: '班级', dataIndex: 'class_name', key: 'class_name' },
                { title: '获证学生', dataIndex: 'student_count', key: 'student_count' },
                { title: '证书数量', dataIndex: 'record_count', key: 'record_count' },
              ]} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
