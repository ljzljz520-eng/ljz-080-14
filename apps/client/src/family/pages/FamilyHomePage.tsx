import { Card, Empty, ProgressBar, Tag } from 'antd-mobile';
import type { FamilyOverview } from '../../api/types';

/** 用药概览：药盒余量天数与复诊安排（不含诊断结论） */
export default function FamilyHomePage({
  overview,
}: {
  overview: FamilyOverview | null;
}) {
  if (!overview) return null;
  const { medications } = overview;

  return (
    <div>
      {medications.length === 0 && (
        <Empty description="暂无用药信息" style={{ padding: 32 }} />
      )}
      {medications.map((med) => {
        const daysLeft = med.daysLeft;
        const low = daysLeft !== null && daysLeft <= 5;
        return (
          <Card key={med.planId} className="med-card" title={med.medicineName}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <ProgressBar
                  percent={Math.min(100, ((daysLeft ?? 0) / 30) * 100)}
                  style={{
                    '--fill-color': low ? '#ff3141' : '#2f6f4f',
                  }}
                />
              </div>
              {low ? <Tag color="danger">需补药</Tag> : <Tag color="primary">充足</Tag>}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
              {daysLeft === null
                ? '余量充足'
                : `药盒余量约可服用 ${daysLeft} 天`}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#666' }}>
              下次复诊：{med.nextVisitDate}（复诊时请医生续方）
            </div>
          </Card>
        );
      })}
      <div style={{ padding: '0 16px', fontSize: 12, color: '#999' }}>
        以上信息由社区管家维护，仅用于用药提醒，不构成医疗诊断或用药建议。
      </div>
    </div>
  );
}
