import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Dropdown, Avatar } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, UserOutlined, SafetyCertificateOutlined,
  FormOutlined, FileTextOutlined, FileDoneOutlined,
  FolderOpenOutlined, ReadOutlined, BookOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/students', icon: <UserOutlined />, label: '学生管理' },
  {
    key: '/certificates-group', icon: <SafetyCertificateOutlined />, label: '证书管理',
    children: [
      { key: '/certificates', label: '证书信息' },
      { key: '/certificates/rules', label: '报名规则' },
    ],
  },
  { key: '/registrations', icon: <FormOutlined />, label: '报名管理' },
  { key: '/exams', icon: <FileTextOutlined />, label: '考试管理' },
  { key: '/records', icon: <FileDoneOutlined />, label: '证书获取记录' },
  { key: '/archives', icon: <FolderOpenOutlined />, label: '归档管理' },
  { key: '/training', icon: <ReadOutlined />, label: '培训信息' },
  { key: '/materials', icon: <BookOutlined />, label: '辅导材料' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer } } = theme.useToken();

  const user = JSON.parse(localStorage.getItem('user') || '{"name":"管理员"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'public', icon: <GlobalOutlined />, label: '公开信息门户', onClick: () => window.open('/public', '_blank') },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{ height: 48, margin: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: collapsed ? 14 : 18, whiteSpace: 'nowrap' }}>
            {collapsed ? '📜' : '📜 双证管理系统'}
          </span>
        </div>
        <Menu
          theme="dark" mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['/certificates-group']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{user.name}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer, borderRadius: 8, overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
