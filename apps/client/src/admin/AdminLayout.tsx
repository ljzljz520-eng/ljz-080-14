import {
  AlertOutlined,
  CameraOutlined,
  DashboardOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Tag } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/admin/elders', icon: <TeamOutlined />, label: '老人与用药' },
  { key: '/admin/checks', icon: <CameraOutlined />, label: '上门药盒核查' },
  { key: '/admin/observations', icon: <AlertOutlined />, label: '健康观察记录' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={220}>
        <div className="admin-logo">慢病药盒管理</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="admin-header">
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            社区养老协作平台 · 管理端
          </span>
          <Tag color="green">管家 / 护工工作台</Tag>
        </Header>
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
