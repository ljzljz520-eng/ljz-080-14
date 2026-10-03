import { useEffect, useMemo, useState } from 'react';
import { Button, Tag } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api';
import type { MedDTO, ReminderDTO } from '../../shared/api';
import type { Elder } from '../../shared/types';

export default function CaregiverTasksPage() {
  const navigate = useNavigate();
  const [elders, setElders] = useState<Elder[]>([]);
  const [meds, setMeds] = useState<MedDTO[]>([]);
  const [reminders, setReminders] = useState<ReminderDTO[]>([]);

  useEffect(() => {
    Promise.all([api.elders(), api.meds(), api.reminders()]).then(([e, m, r]) => {
      // 演示：李护工负责 e1/e3，赵护工负责 e2
      setElders(e);
      setMeds(m);
      setReminders(r.items);
    });
  }, []);

  const stats = useMemo(() => {
    const criticalElders = new Set(
      reminders.filter((r) => r.urgency === 'critical').map((r) => r.elderId),
    );
    return {
      visits: elders.length,
      critical: criticalElders.size,
    };
  }, [elders, reminders]);

  return (
    <div>
      <div className="h5-hero">
        <div className="hero-hi">上午好，李护工</div>
        <div className="hero-title">今日上门药盒核查</div>
        <div className="hero-stats">
          <div className="hero-stat">
            <b>{stats.visits}</b>
            <span>待上门老人</span>
          </div>
          <div className="hero-stat">
            <b>{stats.critical}</b>
            <span>药盒紧急关注</span>
          </div>
        </div>
      </div>

      <div className="h5-card-title">上门名单</div>
      {elders.map((e) => {
        const eMeds = meds.filter((m) => m.elderId === e.id);
        const eRems = reminders.filter((r) => r.elderId === e.id);
        const critical = eRems.filter((r) => r.urgency === 'critical').length;
        return (
          <div className="h5-card" key={e.id}>
            <div className="elder-row">
              <div className="elder-avatar">{e.name[0]}</div>
              <div className="elder-main">
                <div className="elder-name">
                  {e.name}
                  {critical > 0 && (
                    <span className="h5-badge b-critical" style={{ marginLeft: 8 }}>
                      {critical} 项紧急
                    </span>
                  )}
                </div>
                <div className="elder-sub">{e.address}</div>
                <div style={{ marginTop: 6 }}>
                  {eMeds.slice(0, 3).map((m) => (
                    <Tag
                      key={m.id}
                      color={
                        eRems.some((r) => r.medId === m.id && r.urgency === 'critical')
                          ? 'danger'
                          : eRems.some((r) => r.medId === m.id)
                            ? 'warning'
                            : 'success'
                      }
                      style={{ '--border-radius': '999px' }}
                    >
                      {m.name.slice(0, 6)}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
            <Button
              block
              color="primary"
              size="small"
              style={{ marginTop: 12, borderRadius: 999 }}
              onClick={() => navigate(`/h5/checkin/${e.id}`)}
            >
              上门核查 · 拍照确认
            </Button>
          </div>
        );
      })}
    </div>
  );
}
