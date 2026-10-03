import { Layout, Menu, Typography, Tag } from 'antd';
import {
  BellOutlined,
  MedicineBoxOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import EldersPage from './pages/EldersPage';
import ObservationsPage from './pages/ObservationsPage';
import './pc.less';

const { Header, Sider, Content } = Layout;

const MENU = [
  { key: '/pc/dashboard', icon: <BellOutlined />, label: '补药提醒' },
  { key: '/pc/elders', icon: <MedicineBoxOutlined />, label: '老人用药档案' },
  { key: '/pc/observations', icon: <EyeOutlined />, label: '健康观察记录' },
];

export default function PcApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const selected =
    MENU.find((m) => location.pathname.startsWith(m.key))?.key ?? '/pc/dashboard';

  return (
    <Layout className="pc-layout">
      <Sider width={216} className="pc-sider">
        <div className="pc-logo">
          <span className="pc-logo-mark">康</span>
          <div>
            <div className="pc-logo-title">邻里康养协作台</div>
            <div className="pc-logo-sub">管家工作台 · PC</div>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selected]}
          items={MENU}
          onClick={({ key }) => navigate(key)}
          className="pc-menu"
        />
        <div className="pc-sider-foot">
          <TeamOutlined /> 王管家 · 幸福里社区
        </div>
      </Sider>
      <Layout>
        <Header className="pc-header">
          <Typography.Text strong className="pc-header-title">
            {MENU.find((m) => m.key === selected)?.label}
          </Typography.Text>
          <Tag color="green" className="pc-header-tag">
            数据日期 2026-10-03
          </Tag>
        </Header>
        <Content className="pc-content">
          <Routes>
            <Route path="/" element={<Navigate to="/pc/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/elders" element={<EldersPage />} />
            <Route path="/observations" element={<ObservationsPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
