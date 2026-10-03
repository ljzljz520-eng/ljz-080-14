import { useEffect, useState } from 'react';
import { Empty, Image as AdmImage, Tag } from 'antd-mobile';
import { api } from '../../shared/api';
import type { CheckDTO } from '../../shared/api';

export default function CheckHistoryPage() {
  const [checks, setChecks] = useState<CheckDTO[]>([]);

  useEffect(() => {
    api.checks().then(setChecks);
  }, []);

  return (
    <div>
      <div className="h5-card-title">药盒核查记录</div>
      {checks.length === 0 ? (
        <Empty
          description="暂无核查记录"
          style={{ padding: '40px 0' }}
        />
      ) : (
        checks.map((c) => (
          <div className="h5-card" key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b style={{ fontSize: 15 }}>
                {c.items.length > 0 ? c.caregiverName : ''} 上门核查
              </b>
              <span className="h5-muted">
                {new Date(c.visitAt).toLocaleString('zh-CN', { hour12: false })}
              </span>
            </div>
            <div className="h5-muted" style={{ margin: '4px 0 8px' }}>
              老人：{c.elderName} · {new Date(c.visitAt).toLocaleDateString('zh-CN')}
            </div>
            {c.items.map((it) => (
              <div
                key={it.medId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e6edea',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{it.medName}</div>
                  {it.note && <div className="h5-muted">现场：{it.note}</div>}
                  <div className="h5-muted">清点 {it.stockObserved} 剂</div>
                </div>
                <Tag
                  color={it.hasIssue ? (it.condition === 'suspected_mixed' ? 'danger' : 'warning') : 'success'}
                  style={{ '--border-radius': '999px' }}
                >
                  {it.conditionLabel}
                </Tag>
              </div>
            ))}
            {c.summary && (
              <div style={{ fontSize: 13, marginTop: 8, color: '#5b6b67' }}>
                备注：{c.summary}
              </div>
            )}
            {c.photos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
                {c.photos.map((p) => (
                  <AdmImage
                    key={p.id}
                    src={p.dataUrl}
                    width={96}
                    height={96}
                    fit="cover"
                    style={{ borderRadius: 12, flexShrink: 0 }}
                  />
                ))}
              </div>
            )}
            {c.generatedObservationIds.length > 0 && (
              <div className="privacy-banner" style={{ marginTop: 10 }}>
                已生成 {c.generatedObservationIds.length} 条健康观察记录并推送管家跟进。
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
