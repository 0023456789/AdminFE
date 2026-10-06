import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import {
  AppstoreOutlined,
  TagsOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Content, Sider } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const selectedKey = location.pathname.startsWith('/plans')
    ? '/plans'
    : location.pathname.startsWith('/apps')
      ? '/apps'
      : location.pathname.startsWith('/promos')
        ? '/promos'
        : '/plans';

  const menuItems = [
    {
      key: '/plans',
      icon: <AppstoreOutlined />,
      label: 'Gói cước',
      onClick: () => navigate('/plans'),
    },
    {
      key: '/apps',
      icon: <TagsOutlined />,
      label: 'Ứng dụng',
      onClick: () => navigate('/apps'),
    },
    {
      key: '/promos',
      icon: <GiftOutlined />,
      label: 'Mã giảm giá',
      onClick: () => navigate('/promos'),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: collapsed ? 16 : 20,
            color: '#1677ff',
            transition: 'all 0.2s',
          }}
        >
          {collapsed ? 'AS' : 'AdminSky'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Quản lý gói cước MVNO</h2>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 360,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
