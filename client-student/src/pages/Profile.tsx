import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Modal, Form, Input, Spin, message, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { studentApi, studentAuthApi } from '../services/api';
import type { StudentProfile } from '../types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    studentApi.getProfile()
      .then(res => setProfile(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async () => {
    const values = await form.validateFields();
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致');
      return;
    }
    setChangingPwd(true);
    try {
      await studentAuthApi.changePassword(values.old_password, values.new_password);
      message.success('密码修改成功，请重新登录');
      setPwdModalOpen(false);
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_user');
      window.location.href = '/login';
    } catch (err: any) {
      message.error(err.response?.data?.error || '修改失败');
    } finally {
      setChangingPwd(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const statusColor: Record<string, string> = { active: 'green', inactive: 'orange', graduated: 'red' };
  const statusText: Record<string, string> = { active: '在读', inactive: '休学', graduated: '毕业' };

  return (
    <div>
      <h2><UserOutlined /> 个人信息</h2>
      <Card style={{ maxWidth: 700 }}>
        <Descriptions bordered column={2} size="middle">
          <Descriptions.Item label="学号">{profile?.student_no}</Descriptions.Item>
          <Descriptions.Item label="姓名">{profile?.name}</Descriptions.Item>
          <Descriptions.Item label="班级">{profile?.class_name}</Descriptions.Item>
          <Descriptions.Item label="专业">{profile?.major}</Descriptions.Item>
          <Descriptions.Item label="年级">{profile?.grade}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColor[profile?.status || 'active']}>
              {statusText[profile?.status || 'active']}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="电话">{profile?.phone || '--'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{profile?.email || '--'}</Descriptions.Item>
        </Descriptions>

        <Divider />
        <Button icon={<LockOutlined />} onClick={() => { form.resetFields(); setPwdModalOpen(true); }}>
          修改密码
        </Button>
        <span style={{ marginLeft: 12, color: '#999', fontSize: 12 }}>
          默认密码为学号后6位，首次登录后请修改
        </span>
      </Card>

      <Modal title="修改密码" open={pwdModalOpen} onOk={handleChangePassword}
        onCancel={() => setPwdModalOpen(false)} confirmLoading={changingPwd}>
        <Form form={form} layout="vertical">
          <Form.Item name="old_password" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="new_password" label="新密码" rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' },
          ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="confirm_password" label="确认新密码" rules={[
            { required: true, message: '请再次输入新密码' },
          ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
