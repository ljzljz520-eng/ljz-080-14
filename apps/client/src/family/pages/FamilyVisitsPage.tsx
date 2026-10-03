import { Card, Empty, Tag } from 'antd-mobile';
import type { FamilyOverview } from '../../api/types';

/** 上门动态：护工核查照片时间线 + 下一步建议 */
export default function FamilyVisitsPage({
  overview,
}: {
  overview: FamilyOverview | null;
}) {
  if (!overview) return null;
  const visits = overview.visits;

  if (visits.length === 0) {
    return <Empty description="暂无上门核查记录" style={{ padding: 32 }} />;
  }

  return (
    <div style={{ padding: 12 }}>
      {visits.map((v, idx) => (
        <div key={v.id} style={{ display: 'flex', gap: 12 }}>
          {/* 时间线轴 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                marginTop: 6,
                background: v.result === 'normal' ? '#2f6f4f' : '#ff8f1f',
                flexShrink: 0,
              }}
            />
            {idx < visits.length - 1 && (
              <div style={{ width: 2, flex: 1, background: '#e0e0e0', marginTop: 4 }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#666' }}>
              {new Date(v.checkedAt).toLocaleString('zh-CN', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              {v.caregiverName}
            </div>
            <Card className="med-card" style={{ margin: '8px 0 0' }}>
              <img src={v.photoUrl} alt="药盒照片" className="visit-photo" />
              <div style={{ marginTop: 8 }}>
                <Tag color={v.result === 'normal' ? 'success' : 'warning'}>
                  {v.resultText}
                </Tag>
              </div>
              {v.suggestion && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#2f6f4f' }}>
                  下一步建议：{v.suggestion}
                </div>
              )}
            </Card>
          </div>
        </div>
      ))}
      <div style={{ padding: '0 8px', fontSize: 12, color: '#999' }}>
        如需了解更详细的健康情况，请联系社区管家或家庭医生。
      </div>
    </div>
  );
}
