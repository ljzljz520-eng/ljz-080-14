import { useEffect, useState } from 'react';
import { Empty, Image as AdmImage, NavBar, Tabs } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../shared/api';
import type {
  FamilyObservationDTO,
  FamilyPhotoGroupDTO,
  FamilyReminderDTO,
  RoleIdentity,
} from '../../shared/api';
import { useIdentity } from '../identity';

const URGENCY = {
  critical: { cls: 'b-critical', label: '请尽快安排' },
  warning: { cls: 'b-warning', label: '建议安排' },
  info: { cls: 'b-info', label: '关注' },
} as const;

export default function FamilyDetailPage() {
  const { elderId = '' } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity() as { identity: RoleIdentity };

  const [name, setName] = useState('');
  const [reminders, setReminders] = useState<FamilyReminderDTO[]>([]);
  const [notice, setNotice] = useState('');
  const [observations, setObservations] = useState<FamilyObservationDTO[]>([]);
  const [photos, setPhotos] = useState<FamilyPhotoGroupDTO[]>([]);

  useEffect(() => {
    if (identity.role !== 'family') return;
    api.elder(elderId).then((e) => setName(e.name)).catch(() => {});
    api.familyReminders(elderId, identity).then((r) => {
      setReminders(r.items);
      setNotice(r.notice);
    });
    api.familyObservations(elderId, identity).then(setObservations);
    api.familyPhotos(elderId, identity).then(setPhotos);
  }, [elderId, identity]);

  if (identity.role !== 'family') return <Navigate to="/h5/role" replace />;

  return (
    <div>
      <NavBar back={<LeftOutline />} onBack={() => navigate(-1)}>
        {name} 的用药照护
      </NavBar>

      <Tabs className="family-tabs">
        <Tabs.Tab title={`补药提醒 ${reminders.length ? `(${reminders.length})` : ''}`} key="reminders">
          <div className="privacy-banner" style={{ marginTop: 12 }}>
            {notice}
          </div>
          {reminders.length === 0 ? (
            <Empty description="近期没有需要补药的安排" style={{ padding: '36px 0' }} />
          ) : (
            reminders.map((r) => {
              const u = URGENCY[r.urgency];
              return (
                <div key={r.medId} className={`reminder-item r-${r.urgency}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="r-name">{r.medName}</span>
                    <span className={`h5-badge ${u.cls}`}>{u.label}</span>
                  </div>
                  <div className="h5-muted" style={{ marginTop: 4 }}>
                    {r.dosageText} · {r.scheduleText}
                  </div>
                  <div className="r-reason">
                    {r.reasons.map((x, i) => (
                      <div key={i}>· {x}</div>
                    ))}
                  </div>
                  <div className="r-meta">
                    <span>余量约 {r.stockDays} 天</span>
                    <span>预计 {r.runOutDate} 用完</span>
                    <span>复诊 {r.nextVisitDate}</span>
                    <span>建议 {r.orderByDate} 前购药</span>
                    <span>建议补 {r.suggestedRefillDoses} 剂</span>
                  </div>
                  <div className="r-next">
                    <b>下一步：</b>
                    {r.nextStep}
                    <div style={{ marginTop: 6, color: '#5b6b67' }}>
                      购药方式：{r.buyerChannel}（{r.buyerName}）
                      {r.buyerNote ? `；${r.buyerNote}` : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Tabs.Tab>

        <Tabs.Tab
          title={`服药关注 ${observations.length ? `(${observations.length})` : ''}`}
          key="observations"
        >
          {observations.length === 0 ? (
            <Empty description="暂无服药关注事项" style={{ padding: '36px 0' }} />
          ) : (
            observations.map((o) => (
              <div key={o.id} className="reminder-item r-info">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{o.title}</b>
                  {o.needAttention && <span className="h5-badge b-critical">需要关注</span>}
                </div>
                <div className="h5-muted" style={{ marginTop: 4 }}>
                  {new Date(o.createdAt).toLocaleString('zh-CN', { hour12: false })}
                </div>
                <div className="r-next">
                  <b>下一步：</b>
                  {o.nextStep}
                </div>
                {o.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
                    {o.photos.map((p) => (
                      <AdmImage
                        key={p.id}
                        src={p.dataUrl}
                        width={108}
                        height={108}
                        fit="cover"
                        style={{ borderRadius: 12, flexShrink: 0 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </Tabs.Tab>

        <Tabs.Tab title="上门照片" key="photos">
          {photos.length === 0 ? (
            <Empty description="护工上门后会在这里同步药盒照片" style={{ padding: '36px 0' }} />
          ) : (
            photos.map((g) => (
              <div className="h5-card" key={g.checkId}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{g.caregiverName} 上门</b>
                  <span className="h5-muted">
                    {new Date(g.visitAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
                  {g.photos.map((p) => (
                    <AdmImage
                      key={p.id}
                      src={p.dataUrl}
                      width={120}
                      height={120}
                      fit="cover"
                      style={{ borderRadius: 12, flexShrink: 0 }}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  {g.medStatus.map((m) => (
                    <div
                      key={m.medName}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 13,
                        padding: '5px 0',
                      }}
                    >
                      <span>{m.medName}</span>
                      <span className={`h5-badge ${m.normal ? 'b-ok' : 'b-warning'}`}>
                        {m.statusText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </Tabs.Tab>
      </Tabs>
    </div>
  );
}
