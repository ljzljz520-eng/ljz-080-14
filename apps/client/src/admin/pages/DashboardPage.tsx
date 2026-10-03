import {
  CameraOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import type { Elder, HealthObservation, RefillReminder } from '../../api/types';

const levelColor: Record<string, string> = {
  urgent: 'red',
  warning: 'orange',
  info: 'blue',
};

const levelText: Record<string, string> = {
  urgent: '紧急',
  warning: '尽快',
  info: '提示',
};

const typeText: Record<string, string> = {
  low_stock: '药盒余量',
  visit_due: '复诊续方',
  purchase_cycle: '习惯购药',
};

export default function DashboardPage() {
  const { message } = AntApp.useApp();
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [observations, setObservations] = useState<HealthObservation[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [reloadFlag, setReloadFlag] = useState(0);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api.listReminders('pending'),
      api.listObservations(),
      api.listElders(),
    ])
      .then(([r, o, e]) => {
        if (ignore) return;
        setReminders(r);
        setObservations(o.filter((x) => x.status !== 'resolved'));
        setElders(e);
      })
      .catch((err) => message.error(err.message));
    return () => {
      ignore = true;
    };
  }, [reloadFlag, message]);

  const load = () => setReloadFlag((f) => f + 1);

  const elderName = (id: string) =>
    elders.find((e) => e.id === id)?.name ?? id;

  const complete = async (id: string) => {
    await api.setReminderStatus(id, 'done');
    message.success('已标记补药完成，药盒余量已更新');
    load();
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理补药提醒"
              value={reminders.length}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="紧急提醒"
              value={reminders.filter((r) => r.level === 'urgent').length}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="跟进中健康观察"
              value={observations.length}
              prefix={<CameraOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <Statistic
              title="在管老人"
              value={elders.length}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card
            title="补药提醒（按药盒余量 / 复诊日期 / 代买习惯生成）"
            extra={<Link to="/admin/elders">登记用药</Link>}
          >
            {reminders.length === 0 ? (
              <Empty description="暂无待处理提醒" />
            ) : (
              <List
                dataSource={reminders}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        key="done"
                        type="link"
                        onClick={() => complete(item.id)}
                      >
                        已补药
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={levelColor[item.level]}>
                            {levelText[item.level]}
                          </Tag>
                          <Tag>{typeText[item.type]}</Tag>
                          <span>
                            {elderName(item.elderId)} · {item.title}
                          </span>
                        </Space>
                      }
                      description={
                        <div>
                          <Typography.Text>{item.message}</Typography.Text>
                          <br />
                          <Typography.Text type="secondary">
                            建议：{item.suggestion}（{item.suggestDate} 前）
                          </Typography.Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="待跟进健康观察"
            extra={<Link to="/admin/observations">全部记录</Link>}
          >
            {observations.length === 0 ? (
              <Empty description="暂无待跟进观察" />
            ) : (
              <List
                dataSource={observations}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color={item.type === 'mixed_meds' ? 'red' : 'orange'}>
                            {item.type === 'mixed_meds' ? '混药' : '漏服'}
                          </Tag>
                          <span>{elderName(item.elderId)}</span>
                          <Tag>
                            {item.status === 'open' ? '待跟进' : '跟进中'}
                          </Tag>
                        </Space>
                      }
                      description={item.clinicalNote}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
