import { useEffect, useState } from 'react';
import { Badge, Button, DotLoading } from 'antd-mobile';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../../shared/api';
import type { FamilyElderDTO, RoleIdentity } from '../../shared/api';
import { useIdentity } from '../identity';

export default function FamilyHomePage() {
  const { identity } = useIdentity() as { identity: RoleIdentity };
  const navigate = useNavigate();
  const [elders, setElders] = useState<FamilyElderDTO[] | null>(null);

  useEffect(() => {
    if (identity.role === 'family') {
      api.familyElders(identity).then(setElders).catch(() => setElders([]));
    }
  }, [identity]);

  if (identity.role !== 'family') return <Navigate to="/h5/role" replace />;

  return (
    <div>
      <div className="h5-hero">
        <div className="hero-hi">您好，{identity.name}</div>
        <div className="hero-title">家人用药提醒</div>
        <div className="hero-stats">
          <div className="hero-stat">
            <b>{elders?.length ?? '—'}</b>
            <span>已关联老人</span>
          </div>
          <div className="hero-stat">
            <b>{elders?.reduce((s, e) => s + e.reminderCount, 0) ?? '—'}</b>
            <span>待处理提醒</span>
          </div>
        </div>
      </div>

      <div className="privacy-banner">
        这里为您展示用药安排、购药提醒、护工上门照片与下一步建议；具体诊疗请以复诊医生意见为准。
      </div>

      {!elders ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <DotLoading /> 加载中
        </div>
      ) : (
        elders.map((e) => (
          <div className="h5-card" key={e.id}>
            <div className="elder-row">
              <Badge
                content={e.reminderCount > 0 ? `${e.reminderCount} 提醒` : ''}
                style={{ '--right': '0px', '--top': '-4px' }}
              >
                <div className="elder-avatar">{e.name[0]}</div>
              </Badge>
              <div className="elder-main">
                <div className="elder-name">{e.name}</div>
                <div className="elder-sub">{e.address}</div>
                {e.latestReminder && (
                  <div style={{ marginTop: 6, fontSize: 13, color: '#c97c14' }}>
                    最近：{e.latestReminder.medName} 余量约 {e.latestReminder.stockDays} 天
                  </div>
                )}
              </div>
            </div>
            <Button
              block
              color="primary"
              size="small"
              style={{ marginTop: 12, borderRadius: 999 }}
              onClick={() => navigate(`/h5/family/${e.id}`)}
            >
              查看提醒与照片
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
