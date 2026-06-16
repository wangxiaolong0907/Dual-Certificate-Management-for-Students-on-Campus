import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Spin, Empty, Typography, Tabs } from 'antd';
import { ReadOutlined, BookOutlined } from '@ant-design/icons';
import { studentApi } from '../services/api';
import type { TrainingMaterial } from '../types';

const { Paragraph, Title } = Typography;

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getMaterials()
      .then(res => setMaterials(res.data))
      .finally(() => setLoading(false));
  }, []);

  const trainings = materials.filter(m => m.type === 'training');
  const studyMaterials = materials.filter(m => m.type === 'material');

  const materialTypeColor: Record<string, string> = { video: 'purple', document: 'blue', link: 'cyan' };
  const materialTypeText: Record<string, string> = { video: '视频', document: '文档', link: '链接' };

  const renderTraining = () => (
    trainings.length === 0 ? <Empty description="暂无培训信息" /> : (
      <List itemLayout="vertical" dataSource={trainings}
        renderItem={(item: TrainingMaterial) => (
          <List.Item>
            <Card title={`📅 ${item.title}`} style={{ width: '100%' }}>
              {item.certificate_name && <Tag color="blue">{item.certificate_name}</Tag>}
              <p><strong>培训日期：</strong>{item.training_date || '--'}</p>
              <p><strong>地点：</strong>{item.location || '--'}</p>
              <p><strong>讲师：</strong>{item.instructor || '--'}</p>
              <Paragraph>{item.content}</Paragraph>
            </Card>
          </List.Item>
        )}
      />
    )
  );

  const renderMaterials = () => (
    studyMaterials.length === 0 ? <Empty description="暂无辅导材料" /> : (
      <List itemLayout="vertical" dataSource={studyMaterials}
        renderItem={(item: TrainingMaterial) => (
          <List.Item>
            <Card title={`📖 ${item.title}`}
              extra={<Tag color={materialTypeColor[item.material_type]}>{materialTypeText[item.material_type]}</Tag>}>
              {item.certificate_name && <Tag color="blue">{item.certificate_name}</Tag>}
              <Paragraph>{item.content}</Paragraph>
              {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer">📎 查看材料</a>}
            </Card>
          </List.Item>
        )}
      />
    )
  );

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <h2><ReadOutlined /> 学习资源</h2>
      <Paragraph type="secondary">查看培训信息和辅导材料</Paragraph>
      <Tabs defaultActiveKey="training" items={[
        { key: 'training', label: <span><ReadOutlined /> 培训信息 ({trainings.length})</span>, children: renderTraining() },
        { key: 'materials', label: <span><BookOutlined /> 辅导材料 ({studyMaterials.length})</span>, children: renderMaterials() },
      ]} />
    </div>
  );
}
