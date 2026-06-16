import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { studentAuthApi } from '../services/api';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { student_no: string; password: string }) => {
    setLoading(true);
    try {
      const res = await studentAuthApi.login(values.student_no, values.password);
      localStorage.setItem('student_token', res.data.token);
      localStorage.setItem('student_user', JSON.stringify(res.data.user));
      message.success(`欢迎回来，${res.data.user.name}！`);
      navigate('/');
    } catch (err: any) {
      message.error(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 420, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 4 }}>📜</Title>
          <Title level={4} style={{ marginBottom: 4 }}>学生校内双证管理系统</Title>
          <Text type="secondary">学生端登录</Text>
        </div>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="student_no" rules={[{ required: true, message: '请输入学号' }]}>
            <Input prefix={<IdcardOutlined />} placeholder="学号" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码（默认学号后6位）" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>登 录</Button>
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
          默认密码为学号后6位，首次登录后请及时修改
        </Text>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/public" style={{ fontSize: 12 }}>查看公开信息</Link>
        </div>
      </Card>
    </div>
  );
}
