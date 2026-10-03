import { App as AntApp, Button, Card, Select, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Elder, HealthObservation, ObservationStatus } from '../../api/types';

const statusFlow: Record<ObservationStatus, { text: string; color: string; next?: ObservationStatus; nextText?: string }> = {
  open: { text: '待跟进', color: 'red', next: 'following', nextText: '开始跟进' },
  following: { text: '跟进中', color: 'orange', next: 'resolved', nextText: '标记解决' },
  resolved: { text: '已解决', color: 'green' },
};

const severityText: Record<string, { text: string; color: string }> = {
  low: { text: '低', color: 'blue' },
  medium: { text: '中', color: 'orange' },
  high: { text: '高', color: 'red' },
};

/** 健康观察记录（管理端内部视图，含医学描述，不对家属展示） */
export default function ObservationsPage() {
  const { message } = AntApp.useApp();
  const [observations, setObservations] = useState<HealthObservation[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [statusFilter, setStatusFilter] = useState<ObservationStatus | undefined>();
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([api.listObservations(statusFilter), api.listElders()])
      .then(([o, e]) => {
        if (ignore) return;
        setObservations(o);
        setElders(e);
      })
      .catch((err) => message.error(err.message));
    return () => {
      ignore = true;
    };
  }, [statusFilter, reloadFlag, message]);

  const advance = async (id: string, next: ObservationStatus) => {
    await api.setObservationStatus(id, next);
    message.success('状态已更新');
    setReloadFlag((f) => f + 1);
  };

  return (
    <Card
      title="健康观察记录"
      extra={
        <Select
          allowClear
          placeholder="按状态筛选"
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v)}
          options={[
            { value: 'open', label: '待跟进' },
            { value: 'following', label: '跟进中' },
            { value: 'resolved', label: '已解决' },
          ]}
        />
      }
    >
      <Table<HealthObservation>
        rowKey="id"
        dataSource={observations}
        pagination={false}
        columns={[
          {
            title: '老人',
            dataIndex: 'elderId',
            width: 100,
            render: (id: string) => elders.find((e) => e.id === id)?.name ?? id,
          },
          {
            title: '类型',
            dataIndex: 'type',
            width: 90,
            render: (t: string) => (
              <Tag color={t === 'mixed_meds' ? 'red' : 'orange'}>
                {t === 'mixed_meds' ? '混药' : '漏服'}
              </Tag>
            ),
          },
          {
            title: '观察记录（内部）',
            dataIndex: 'clinicalNote',
            render: (v: string) => <Typography.Text>{v}</Typography.Text>,
          },
          {
            title: '对家属的建议',
            dataIndex: 'familySuggestion',
            render: (v: string) => (
              <Typography.Text type="secondary">{v}</Typography.Text>
            ),
          },
          {
            title: '程度',
            dataIndex: 'severity',
            width: 80,
            render: (s: string) => (
              <Tag color={severityText[s].color}>{severityText[s].text}</Tag>
            ),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (s: ObservationStatus) => (
              <Tag color={statusFlow[s].color}>{statusFlow[s].text}</Tag>
            ),
          },
          {
            title: '操作',
            width: 110,
            render: (_, row) => {
              const flow = statusFlow[row.status];
              return flow.next ? (
                <Button
                  size="small"
                  type="link"
                  onClick={() => advance(row.id, flow.next!)}
                >
                  {flow.nextText}
                </Button>
              ) : (
                <Space />
              );
            },
          },
        ]}
      />
    </Card>
  );
}
