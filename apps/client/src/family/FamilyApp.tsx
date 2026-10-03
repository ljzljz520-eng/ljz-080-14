import {
  BellOutline,
  FileOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons';
import { TabBar, Toast } from 'antd-mobile';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Elder, FamilyOverview } from '../api/types';
import FamilyHomePage from './pages/FamilyHomePage';
import FamilyRemindersPage from './pages/FamilyRemindersPage';
import FamilyVisitsPage from './pages/FamilyVisitsPage';

const tabs = [
  { key: 'home', title: '用药概览', icon: <UnorderedListOutline /> },
  { key: 'reminders', title: '补药提醒', icon: <BellOutline /> },
  { key: 'visits', title: '上门动态', icon: <FileOutline /> },
];

/**
 * 家属端（H5）。
 * 仅展示：补药提醒、护工上门照片、下一步建议。
 * 不展示任何医疗诊断结论（由服务端聚合接口脱敏保证）。
 */
export default function FamilyApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [elders, setElders] = useState<Elder[]>([]);
  const [elderId, setElderId] = useState<string>('');
  const [overview, setOverview] = useState<FamilyOverview | null>(null);

  useEffect(() => {
    api
      .listElders()
      .then((list) => {
        setElders(list);
        if (list[0]) setElderId(list[0].id);
      })
      .catch((err) => Toast.show({ content: err.message }));
  }, []);

  useEffect(() => {
    if (!elderId) return;
    api
      .familyOverview(elderId)
      .then(setOverview)
      .catch((err) => Toast.show({ content: err.message }));
  }, [elderId]);

  const reload = () => {
    if (!elderId) return;
    api.familyOverview(elderId).then(setOverview).catch(() => undefined);
  };

  const pendingCount =
    overview?.reminders.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="family-shell">
      <div className="family-hero">
        <div style={{ fontSize: 13, opacity: 0.85 }}>社区养老协作平台 · 家属端</div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 8 }}>
          {overview ? `${overview.elder.name} 的用药守护` : '加载中…'}
        </div>
        {overview && (
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
            {overview.elder.age} 岁 · {overview.elder.address}
          </div>
        )}
        {elders.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {elders.map((e) => (
              <span
                key={e.id}
                onClick={() => setElderId(e.id)}
                style={{
                  fontSize: 12,
                  padding: '2px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background:
                    e.id === elderId ? '#fff' : 'rgba(255,255,255,0.25)',
                  color: e.id === elderId ? '#2f6f4f' : '#fff',
                }}
              >
                {e.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="family-body">
        {activeTab === 'home' && <FamilyHomePage overview={overview} />}
        {activeTab === 'reminders' && (
          <FamilyRemindersPage overview={overview} onChanged={reload} />
        )}
        {activeTab === 'visits' && <FamilyVisitsPage overview={overview} />}
      </div>

      <div className="family-tabbar">
        <TabBar activeKey={activeTab} onChange={setActiveTab}>
          {tabs.map((item) => (
            <TabBar.Item
              key={item.key}
              icon={item.icon}
              title={item.title}
              badge={item.key === 'reminders' && pendingCount > 0 ? pendingCount : undefined}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
}
