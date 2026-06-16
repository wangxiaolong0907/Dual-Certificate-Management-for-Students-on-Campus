import React, { useEffect, useState } from 'react';
import { Layout, Menu, Card, List, Tag, Typography, Spin, Empty, Divider, Table } from 'antd';
import { ReadOutlined, BookOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { trainingApi, certificateApi } from '../services/api';
import type { TrainingMaterial, Certificate } from '../types';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

export default function PublicPortal() {
  const [tab, setTab] = useState('certificates');
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      certificateApi.list({ is_active: 1 }),
      trainingApi.publicList(),
    ]).then(([certsRes, matsRes]) => {
      setCerts(certsRes.data);
      setMaterials(matsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const trainings = materials.filter(m => m.type === 'training');
  const studyMaterials = materials.filter(m => m.type === 'material');

  const materialTypeColor: Record<string, string> = { video: 'purple', document: 'blue', link: 'cyan' };
  const materialTypeText: Record<string, string> = { video: '视频', document: '文档', link: '链接' };

  const renderCertificates = () => (
    <div>
      <Title level={4}><SafetyCertificateOutlined /> 证书信息</Title>
      <Paragraph type="secondary">以下是校内推荐/必须完成的各类证书考试信息</Paragraph>
      {certs.length === 0 ? <Empty description="暂无证书信息" /> : (
        <List grid={{ gutter: 16, column: 2 }} dataSource={certs}
          renderItem={(cert: Certificate) => (
            <List.Item>
              <Card title={cert.name} extra={<Tag color={cert.type_code === 'RENSHE' ? 'blue' : cert.type_code === 'ZHUANYE' ? 'green' : 'orange'}>{cert.type_name}</Tag>}>
                <p><strong>颁发机构：</strong>{cert.issuing_authority || '--'}</p>
                <p><strong>描述：</strong>{cert.description}</p>
                <p><strong>报名要求：</strong>{cert.requirements || '无'}</p>
                <p><strong>有效期：</strong>{cert.validity_period || '--'}</p>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const renderTraining = () => (
    <div>
      <Title level={4}><ReadOutlined /> 公开培训信息</Title>
      {trainings.length === 0 ? <Empty description="暂无公开培训" /> : (
        <List itemLayout="vertical" dataSource={trainings}
          renderItem={(item: TrainingMaterial) => (
            <List.Item>
              <Card title={item.title} style={{ width: '100%' }}>
                {item.certificate_name && <Tag color="blue">{item.certificate_name}</Tag>}
                <p><strong>培训日期：</strong>{item.training_date || '--'}</p>
                <p><strong>地点：</strong>{item.location || '--'}</p>
                <p><strong>讲师：</strong>{item.instructor || '--'}</p>
                <Paragraph>{item.content}</Paragraph>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const renderMaterials = () => (
    <div>
      <Title level={4}><BookOutlined /> 辅导材料</Title>
      {studyMaterials.length === 0 ? <Empty description="暂无公开辅导材料" /> : (
        <List itemLayout="vertical" dataSource={studyMaterials}
          renderItem={(item: TrainingMaterial) => (
            <List.Item>
              <Card title={item.title}
                extra={<Tag color={materialTypeColor[item.material_type]}>{materialTypeText[item.material_type]}</Tag>}>
                {item.certificate_name && <Tag color="blue">{item.certificate_name}</Tag>}
                <Paragraph>{item.content}</Paragraph>
                {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer">📎 查看材料</a>}
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ background: '#001529', display: 'flex', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>📜 学生校内双证管理系统 — 信息公示</span>
      </Header>
      <Content style={{ maxWidth: 1000, margin: '24px auto', width: '100%', padding: '0 24px' }}>
        <Card>
          <Menu mode="horizontal" selectedKeys={[tab]} onClick={({ key }) => setTab(key)}
            items={[
              { key: 'certificates', icon: <SafetyCertificateOutlined />, label: '证书信息' },
              { key: 'training', icon: <ReadOutlined />, label: '培训信息' },
              { key: 'materials', icon: <BookOutlined />, label: '辅导材料' },
            ]}
          />
          <div style={{ padding: '24px 0' }}>
            {loading ? <Spin size="large" style={{ display: 'block', margin: '40px auto' }} /> :
              tab === 'certificates' ? renderCertificates() :
              tab === 'training' ? renderTraining() :
              renderMaterials()}
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
