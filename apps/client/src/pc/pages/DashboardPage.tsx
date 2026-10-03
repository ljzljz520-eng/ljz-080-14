import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  InputNumber,
  Modal,
  Progress,
  Segmented,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { api } from '../../shared/api';
import type { ReminderDTO, RoleIdentity } from '../../shared/api';
import '../../shared/common.less';
import './pages.less';

const CAREGIVER: RoleIdentity = { role: 'caregiver', id: 'c1', name: '李护工' };

const urgencyMeta = {
  critical: { label: '紧急', cls: 'pill-critical', color: '#e0524d' },
  warning: { label: '待安排', cls: 'pill-warning', color: '#ee9a2e' },
  info: { label: '关注', cls: 'pill-info', color: '#5b8def' },
} as const;

function channelLabel(c: string) {
  return c === 'family' ? '家属代买' : c === 'online' ? '线上下单' : '药房自购';
}

export default function DashboardPage() {
  const [items, setItems] = useState<ReminderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'family'>('all');
  const [refill, setRefill] = useState<ReminderDTO | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.reminders();
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: items.length,
      critical: items.filter((i) => i.urgency === 'critical').length,
      warning: items.filter((i) => i.urgency === 'warning').length,
      habit: items.filter((i) => i.habitDue).length,
    }),
    [items],
  );

  const shown = items.filter((i) =>
    filter === 'all'
      ? true
      : filter === 'critical'
        ? i.urgency === 'critical'
        : i.channel === 'family',
  );

  const submitRefill = async () => {
    if (!refill) return;
    setSaving(true);
    try {
      await api.updateStock(refill.medId, newStock, CAREGIVER);
      message.success('已回写药盒余量，提醒已重新计算');
      setRefill(null);
      await load();
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <Alert
        className="dash-intro"
        type="info"
        showIcon
        message="系统依据「药盒余量 + 复诊日期 + 家属代买习惯」自动生成补药提醒"
        description="余量按每日剂量折算可服天数；复诊前 7 天提示备药；并结合家属习惯的购药渠道与提前量，提示最晚下单日期。"
      />

      <div className="stat-row">
        <Card className="stat-card stat-critical">
          <Statistic title="需紧急处理" value={stats.critical} suffix="项" />
        </Card>
        <Card className="stat-card stat-warning">
          <Statistic title="待安排购药" value={stats.warning} suffix="项" />
        </Card>
        <Card className="stat-card">
          <Statistic title="提醒总数" value={stats.total} suffix="项" />
        </Card>
        <Card className="stat-card">
          <Statistic title="今日到家属习惯下单时间" value={stats.habit} suffix="人" />
        </Card>
      </div>

      <div className="toolbar">
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as typeof filter)}
          options={[
            { label: '全部提醒', value: 'all' },
            { label: '仅紧急', value: 'critical' },
            { label: '家属代买类', value: 'family' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          刷新
        </Button>
      </div>

      {shown.length === 0 && !loading ? (
        <Empty description="暂无需要关注的补药提醒" className="empty-block" />
      ) : (
        <div className="card-grid">
          {shown.map((r) => {
            const meta = urgencyMeta[r.urgency];
            const pct = Math.min(
              100,
              Math.round((r.stockDays / Math.max(r.stockDays + 2, 7)) * 100),
            );
            return (
              <Card key={r.medId} className={`reminder-card urgency-${r.urgency}`} loading={loading}>
                <div className="reminder-head">
                  <div>
                    <div className="reminder-elder">{r.elderName}</div>
                    <div className="reminder-med">{r.medName}</div>
                  </div>
                  <span className={`pill ${meta.cls}`}>{meta.label}</span>
                </div>

                <div className="stock-line">
                  <span>
                    余量可服 <b className="strong-num" style={{ color: meta.color }}>{r.stockDays}</b> 天
                  </span>
                  <span className="muted">预计 {r.runOutDate} 用完</span>
                </div>
                <Progress percent={pct} showInfo={false} strokeColor={meta.color} size="small" />

                <ul className="reason-list">
                  {r.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>

                <div className="meta-grid">
                  <div>
                    <span className="muted">复诊</span>
                    <b>{r.nextVisitDate}</b>
                    <small className="muted">（{r.daysToVisit} 天后）</small>
                  </div>
                  <div>
                    <span className="muted">最晚购药</span>
                    <b>{r.orderByDate}</b>
                  </div>
                  <div>
                    <span className="muted">建议补药</span>
                    <b className="strong-num">{r.suggestedRefillDoses} 剂</b>
                  </div>
                  <div>
                    <span className="muted">代买习惯</span>
                    <b>{channelLabel(r.channel)}</b>
                  </div>
                </div>

                <Typography.Paragraph className="next-step" type="secondary">
                  下一步：{r.nextStep}
                </Typography.Paragraph>

                <Space>
                  <Button
                    type={r.urgency === 'critical' ? 'primary' : 'default'}
                    danger={r.urgency === 'critical'}
                    onClick={() => {
                      setRefill(r);
                      setNewStock(Math.max(r.suggestedRefillDoses, 28));
                    }}
                  >
                    登记补药 / 回写余量
                  </Button>
                  {r.habitDue && <Tag color="orange">已到习惯下单时间</Tag>}
                </Space>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        title={refill ? `回写余量 · ${refill.medName}` : ''}
        open={!!refill}
        onCancel={() => setRefill(null)}
        onOk={submitRefill}
        confirmLoading={saving}
        okText="保存余量"
      >
        {refill && (
          <div className="refill-modal">
            <p className="muted">
              {refill.elderName} · 系统建议本次补 {refill.suggestedRefillDoses}{' '}
              剂（覆盖复诊后一个用药周期）
            </p>
            <div className="refill-row">
              补药后药盒总余量
              <InputNumber
                min={0}
                value={newStock}
                onChange={(v) => setNewStock(Number(v ?? 0))}
                addonAfter="剂"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
