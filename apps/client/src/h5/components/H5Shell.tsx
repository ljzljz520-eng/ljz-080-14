import type { ReactNode } from 'react';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, HeartOutline } from 'antd-mobile-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useIdentity } from '../identity';

const CAREGIVER_TABS = [
  { key: '/h5/tasks', title: '今日上门', icon: <AppOutline /> },
  { key: '/h5/history', title: '核查记录', icon: <UnorderedListOutline /> },
];

const FAMILY_TABS = [{ key: '/h5/family', title: '我的老人', icon: <HeartOutline /> }];

export default function H5Shell({ children }: { children: ReactNode }) {
  const { identity } = useIdentity();
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = identity.role === 'family' ? FAMILY_TABS : CAREGIVER_TABS;
  const activeKey =
    tabs.find((t) => location.pathname.startsWith(t.key))?.key ?? tabs[0].key;

  return (
    <div className="h5-frame">
      <div className="h5-statusbar">
        <span>{identity.role === 'family' ? '家属端' : '护工端'}</span>
        <span className="h5-role-switch" onClick={() => navigate('/h5/role')}>
          切换身份
        </span>
      </div>
      <div className="h5-content">{children}</div>
      <TabBar
        className="h5-tabbar"
        activeKey={activeKey}
        onChange={(key) => navigate(key)}
      >
        {tabs.map((t) => (
          <TabBar.Item key={t.key} icon={t.icon} title={t.title} />
        ))}
      </TabBar>
    </div>
  );
}
