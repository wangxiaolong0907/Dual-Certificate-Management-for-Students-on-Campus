import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Spin, Empty, message, Typography, Space } from 'antd';
import { SafetyCertificateOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { Certificate } from '../types';

const { Paragraph } = Typography;

export default function CertificatesPage() {
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    studentApi.getCertificates()
      .then(res => setCerts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegister = async (certificateId: number) => {
    setRegistering(certificateId);
    try {
      const res = await studentApi.register(certificateId);
      message.success(res.data.message || '报名成功！');
      fetchData();
    } catch (err: any) {
      message.error(err.response?.data?.error || '报名失败');
    } finally {
      setRegistering(null);
    }
  };

  const typeColor: Record<string, string> = { RENSHE: 'blue', ZHUANYE: 'green', XIAONEI: 'orange' };

  const getRegisterButton = (cert: Certificate) => {
    if (cert.my_reg_id) {
      const status = cert.my_reg_status;
      if (status === 'pending') {
        return <Tag icon={<ClockCircleOutlined />} color="gold">审核中</Tag>;
      }
      if (status === 'approved') {
        return <Tag icon={<CheckCircleOutlined />} color="green">已通过</Tag>;
      }
      return null;
    }
    // Check if registration window is open
    const now = new Date();
    if (cert.start_date && new Date(cert.start_date) > now) {
      return <Tag color="default">报名未开始</Tag>;
    }
    if (cert.end_date && new Date(cert.end_date) < now) {
      return <Tag color="default">报名已截止</Tag>;
    }
    if (cert.max_capacity > 0 && cert.reg_count >= cert.max_capacity) {
      return <Tag color="red">名额已满</Tag>;
    }
    return (
      <Button type="primary" size="small" loading={registering === cert.id}
        onClick={() => handleRegister(cert.id)}>
        立即报名
      </Button>
    );
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2><SafetyCertificateOutlined /> 证书报名</h2>
      <Paragraph type="secondary">浏览可报名的证书，点击"立即报名"进行考试报名</Paragraph>

      {certs.length === 0 ? <Empty description="暂无可报名的证书" /> : (
        <List grid={{ gutter: 16, column: 2 }} dataSource={certs}
          renderItem={(cert: Certificate) => (
            <List.Item>
              <Card
                title={cert.name}
                extra={<Tag color={typeColor[cert.type_code] || 'default'}>{cert.type_name}</Tag>}
                actions={[getRegisterButton(cert)]}
              >
                <p><strong>颁发机构：</strong>{cert.issuing_authority || '--'}</p>
                <p><strong>描述：</strong>{cert.description || '--'}</p>
                <p><strong>报名要求：</strong>{cert.requirements || '无'}</p>
                {cert.rule_name && (
                  <p><strong>报名规则：</strong>{cert.rule_name}{cert.rule_description ? ` — ${cert.rule_description}` : ''}</p>
                )}
                <Space>
                  {cert.start_date && <Tag>{cert.start_date} ~</Tag>}
                  {cert.end_date && <Tag>{cert.end_date}</Tag>}
                  {cert.max_capacity > 0 && <Tag>名额: {cert.reg_count}/{cert.max_capacity}</Tag>}
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
