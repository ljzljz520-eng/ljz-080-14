import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Image, Select, Space, Tag, message } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { api } from '../../shared/api';
import type { ObservationDTO } from '../../shared/api';
import type { Elder } from '../../shared/types';
import './pages.less';

const SEV = {
  critical: { label: '高优先级', cls: 'pill-critical' },
  warning: { label: '需关注', cls: 'pill-warning' },
  info: { label: '记录', cls: 'pill-muted' },
} as const;

export default function ObservationsPage() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [elderId, setElderId] = useState<string>('all');
  const [list, setList] = useState<ObservationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (id: string) => {
    setLoading(true);
    try {
      setList(await api.observations(id === 'all' ? undefined : id));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.elders().then(setElders);
    load('all');
  }, []);

  const counts = useMemo(
    () => ({
      critical: list.filter((o) => o.severity === 'critical' && !o.acknowledged).length,
      missed: list.filter((o) => o.type === 'missed_dose').length,
      mixed: list.filter((o) => o.type === 'mixed_pills').length,
    }),
    [list],
  );

  const ack = async (id: string) => {
    await api.ackObservation(id);
    message.success('已标记跟进');
    await load(elderId);
  };

  return (
    <div className="page-wrap">
      <Alert
        className="privacy-note"
        type="warning"
        showIcon
        message="以下为护工上门核查后生成的内部健康观察记录（含疑似漏服/混药判断），仅管家与护工可见"
        description="家属端不会出现观察类型与诊断性结论，仅同步中性的「服药提醒关注 / 药盒需要整理」标题、现场照片与下一步建议。"
      />

      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
        <Space wrap>
          <Tag color="red">待跟进高优先级 {counts.critical}</Tag>
          <Tag color="orange">疑似漏服 {counts.missed}</Tag>
          <Tag color="volcano">疑似混药 {counts.mixed}</Tag>
        </Space>
        <Select
          style={{ width: 200 }}
          value={elderId}
          onChange={(v) => {
            setElderId(v);
            load(v);
          }}
          options={[
            { value: 'all', label: '全部老人' },
            ...elders.map((e) => ({ value: e.id, label: e.name })),
          ]}
        />
      </Space>

      {list.length === 0 && !loading ? (
        <Empty description="暂无健康观察记录；护工提交疑似漏服/混药核查后会自动生成" className="empty-block" />
      ) : (
        <Space direction="vertical" size={12} style={{ display: 'flex' }}>
          {list.map((o) => (
            <Card key={o.id} className={`obs-card sev-${o.severity}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <span className={`pill ${SEV[o.severity].cls}`}>{SEV[o.severity].label}</span>
                  <b>{o.typeLabel}</b>
                  <span className="muted">
                    {o.elderName} · {new Date(o.createdAt).toLocaleString('zh-CN')}
                  </span>
                </Space>
                <Button
                  size="small"
                  type={o.acknowledged ? 'default' : 'primary'}
                  icon={<CheckOutlined />}
                  disabled={o.acknowledged}
                  onClick={() => ack(o.id)}
                >
                  {o.acknowledged ? '已跟进' : '标记已跟进'}
                </Button>
              </div>
              <div className="obs-content" style={{ marginTop: 10 }}>
                <b>观察详情：</b>
                {o.content}
              </div>
              <div className="obs-suggestion">
                <b>下一步建议（将同步家属端）：</b>
                {o.suggestion}
              </div>
              {o.photos.length > 0 && (
                <div className="obs-photos">
                  <Image.PreviewGroup>
                    {o.photos.map((p) => (
                      <Image key={p.id} src={p.dataUrl} alt={p.label} />
                    ))}
                  </Image.PreviewGroup>
                </div>
              )}
            </Card>
          ))}
        </Space>
      )}
    </div>
  );
}
