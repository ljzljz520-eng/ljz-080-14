import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../../shared/api';
import type { MedDTO } from '../../shared/api';
import type { Elder } from '../../shared/types';
import './pages.less';

const CATEGORY_OPTIONS = [
  { value: 'hypertension', label: '高血压用药' },
  { value: 'diabetes', label: '糖尿病用药' },
  { value: 'other_chronic', label: '其他长期用药' },
];
const CHANNEL_OPTIONS = [
  { value: 'family', label: '家属代买' },
  { value: 'pharmacy', label: '附近药房自购' },
  { value: 'online', label: '线上下单配送到家' },
];

interface MedFormValues {
  name: string;
  category: 'hypertension' | 'diabetes' | 'other_chronic';
  dosageText: string;
  scheduleText: string;
  dosesPerDay: number;
  stockDoses: number;
  thresholdDays: number;
  nextVisitDate: string;
  buyerChannel: 'family' | 'pharmacy' | 'online';
  buyerName: string;
  buyerLeadDays: number;
  buyerNote: string;
}

export default function EldersPage() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [meds, setMeds] = useState<MedDTO[]>([]);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof api.elder>> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedDTO | null>(null);
  const [form] = Form.useForm<MedFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.elders().then((data) => {
      setElders(data);
      if (data[0]) setCurrentId(data[0].id);
    });
  }, []);

  const loadMeds = async (elderId: string) => {
    const [m, d] = await Promise.all([api.meds(elderId), api.elder(elderId)]);
    setMeds(m);
    setDetail(d);
  };

  useEffect(() => {
    if (currentId) loadMeds(currentId);
  }, [currentId]);

  const current = elders.find((e) => e.id === currentId);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'hypertension',
      buyerChannel: 'family',
      dosesPerDay: 1,
      thresholdDays: 7,
      buyerLeadDays: 2,
      nextVisitDate: '2026-10-17',
    });
    setModalOpen(true);
  };

  const openEdit = (med: MedDTO) => {
    setEditing(med);
    form.setFieldsValue({
      name: med.name,
      category: med.category,
      dosageText: med.dosageText,
      scheduleText: med.scheduleText,
      dosesPerDay: med.dosesPerDay,
      stockDoses: med.stockDoses,
      thresholdDays: med.thresholdDays,
      nextVisitDate: med.nextVisitDate,
      buyerChannel: med.buyerChannel,
      buyerName: med.buyerName,
      buyerLeadDays: med.buyerLeadDays,
      buyerNote: med.buyerNote,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.updateMed(editing.id, { ...values, elderId: currentId });
        message.success('用药档案已更新');
      } else {
        await api.createMed({ ...values, elderId: currentId });
        message.success('长期用药已登记，系统将自动计算补药提醒');
      }
      setModalOpen(false);
      await loadMeds(currentId);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const stockDays = (m: MedDTO) =>
    m.dosesPerDay > 0 ? Math.floor(m.stockDoses / m.dosesPerDay) : 0;

  const warningIds = useMemo(() => new Set(meds.filter((m) => stockDays(m) <= m.thresholdDays).map((m) => m.id)), [meds]);

  return (
    <div className="page-wrap elders-layout">
      <div className="elder-list-col">
        <Typography.Text strong>在册老人（{elders.length}）</Typography.Text>
        {elders.map((e) => (
          <div
            key={e.id}
            className={`elder-pick ${e.id === currentId ? 'active' : ''}`}
            onClick={() => setCurrentId(e.id)}
          >
            <div className="ep-name">{e.name}</div>
            <div className="ep-sub">
              {e.age} 岁 · {e.address}
            </div>
          </div>
        ))}
      </div>

      <div className="elder-main">
        {current && detail && (
          <>
            <Card className="glass-card" style={{ marginBottom: 14 }}>
              <Descriptions
                title={`${current.name} 的照护档案`}
                column={3}
                size="small"
                items={[
                  { key: 'a', label: '住址', children: current.address },
                  {
                    key: 'b',
                    label: '责任护工',
                    children: detail.caregivers.map((c) => c.name).join('、'),
                  },
                  {
                    key: 'c',
                    label: '家属联系人',
                    children: current.family
                      .map((f) => `${f.name}（${f.relation} ${f.phone}）`)
                      .join('；'),
                  },
                ]}
              />
            </Card>

            <div className="section-title">
              长期用药药盒（{meds.length}）
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={openCreate}
                style={{ marginLeft: 'auto' }}
              >
                登记长期用药
              </Button>
            </div>

            {meds.length === 0 ? (
              <Empty description="尚未登记长期用药" />
            ) : (
              <div className="card-grid">
                {meds.map((m) => (
                  <Card key={m.id} className="med-card">
                    <div className="med-top">
                      <div>
                        <div className="med-name">{m.name}</div>
                        <div className="med-sub">
                          {m.dosageText} · {m.scheduleText}
                        </div>
                      </div>
                      <Space direction="vertical" align="end" size={4}>
                        <Tag color="cyan">{m.categoryLabel}</Tag>
                        {warningIds.has(m.id) && <Tag color="red">余量预警</Tag>}
                      </Space>
                    </div>
                    <div className="med-info-row">
                      <span>
                        当前余量
                        <b>
                          {m.stockDoses} 剂 ≈ {stockDays(m)} 天
                        </b>
                      </span>
                      <span>
                        提醒阈值
                        <b>{m.thresholdDays} 天</b>
                      </span>
                      <span>
                        下次复诊
                        <b>{m.nextVisitDate}</b>
                      </span>
                      <span>
                        代买渠道
                        <b>
                          {CHANNEL_OPTIONS.find((c) => c.value === m.buyerChannel)?.label}
                        </b>
                      </span>
                      <span>
                        代买人
                        <b>{m.buyerName}</b>
                      </span>
                      <span>
                        习惯提前量
                        <b>{m.buyerLeadDays} 天</b>
                      </span>
                    </div>
                    <Typography.Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 10 }}>
                      代买备注：{m.buyerNote || '—'}
                    </Typography.Paragraph>
                    <Popconfirm title="编辑该用药档案？" onConfirm={() => openEdit(m)}>
                      <Button size="small">编辑 / 调整参数</Button>
                    </Popconfirm>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title={editing ? '编辑长期用药' : '登记长期用药'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={submit}
        confirmLoading={saving}
        okText="保存"
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="med-form">
          <Form.Item name="name" label="药品名称" rules={[{ required: true, message: '请输入药品名称' }]}>
            <Input placeholder="如 苯磺酸氨氯地平片" />
          </Form.Item>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="category" label="慢病分类（内部档案）" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item name="dosageText" label="规格" style={{ flex: 1 }}>
              <Input placeholder="5mg/片" />
            </Form.Item>
          </Space>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="scheduleText" label="服药安排" style={{ flex: 1 }}>
              <Input placeholder="每日1次（早餐后）" />
            </Form.Item>
            <Form.Item name="dosesPerDay" label="每日剂量(剂)" rules={[{ required: true }]} style={{ width: 150 }}>
              <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="stockDoses" label="药盒当前余量(剂)" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="thresholdDays" label="补药阈值(天)" style={{ width: 150 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="nextVisitDate" label="下次复诊日期" rules={[{ required: true, message: '请选择复诊日期' }]}>
            <Input type="date" />
          </Form.Item>
          <Space size={16} style={{ display: 'flex' }}>
            <Form.Item name="buyerChannel" label="代买/取药习惯渠道" style={{ flex: 1 }}>
              <Select options={CHANNEL_OPTIONS} />
            </Form.Item>
            <Form.Item name="buyerName" label="习惯购药人" style={{ flex: 1 }}>
              <Input placeholder="如 周建国（儿子）" />
            </Form.Item>
            <Form.Item name="buyerLeadDays" label="习惯提前(天)" style={{ width: 140 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="buyerNote" label="代买习惯备注">
            <Input.TextArea rows={2} placeholder="如 习惯在社区医院便民门诊开28天量；线上下单次日达" />
          </Form.Item>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            慢病分类仅用于内部照护档案，不会出现在家属端。
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}
