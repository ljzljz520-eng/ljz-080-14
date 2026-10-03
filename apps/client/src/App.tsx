import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import ChecksPage from './admin/pages/ChecksPage';
import DashboardPage from './admin/pages/DashboardPage';
import EldersPage from './admin/pages/EldersPage';
import ObservationsPage from './admin/pages/ObservationsPage';
import FamilyApp from './family/FamilyApp';
import EntryPage from './EntryPage';
import './App.less';

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#2f6f4f' } }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="elders" element={<EldersPage />} />
            <Route path="checks" element={<ChecksPage />} />
            <Route path="observations" element={<ObservationsPage />} />
          </Route>
          <Route path="/family/*" element={<FamilyApp />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
