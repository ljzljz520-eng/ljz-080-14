import { MedicineBoxOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App as AntApp,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Elder, MedicationPlan, Staff } from '../../api/types';

const CONDITIONS = ['高血压', '糖尿病', '冠心病', '慢阻肺', '高血脂'];

interface PlanRow extends MedicationPlan {
  elderName: string;
}

/** 老人与用药：管家查看药盒余量、登记长期用药 */
export default function EldersPage() {
  const { message } = AntApp.useApp();
  const [elders, setElders] = useState<Elder[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selected, setSelected] = useState<Elder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const [e, s] = await Promise.all([api.listElders(), api.listStaff()]);
    setElders(e);
    setStaff(s);
    setSelected((prev) => e.find((x) => x.id === prev?.id) ?? e[0] ?? null);
  }, []);

  useEffect(() => {
    load().catch((err) => message.error(err.message));
  }, [load, message]);

  const openRegister = () => {
    if (!selected) return;
    const buyer = selected.familyContacts.find((c) => c.isBuyer);
    form.setFieldsValue({
      condition: selected.conditions[0],
      unit: '片',
      dosagePerIntake: 1,
      timesPerDay: 1,
      boxCapacity: 28,
      remainingQty: 28,
      buyerName: buyer?.name ?? '',
      channel: '医保定点药店',
      leadTimeDays: 3,
      cycleDays: 28,
      lastPurchaseAt: dayjs().subtract(7, 'day'),
      nextVisitDate: dayjs().add(30, 'day'),
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!selected) return;
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await api.registerMedication({
        elderId: selected.id,
        medicineName: values.medicineName,
        condition: values.condition,
        unit: values.unit,
        dosagePerIntake: values.dosagePerIntake,
        timesPerDay: values.timesPerDay,
        boxCapacity: values.boxCapacity,
        remainingQty: values.remainingQty,
        nextVisitDate: values.nextVisitDate.format('YYYY-MM-DD'),
        purchaseHabit: {
          buyerName: values.buyerName,
          channel: values.channel,
          leadTimeDays: values.leadTimeDays,
          cycleDays: values.cycleDays,
          lastPurchaseAt: values.lastPurchaseAt.format('YYYY-MM-DD'),
        },
        registeredBy: staff.find((s) => s.role === 'housekeeper')?.id ?? 'hk-1',
      });
      message.success('用药登记成功，系统已开始按规则生成补药提醒');
      setModalOpen(false);
      form.resetFields();
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登记失败');
    } finally {
      setSubmitting(false);
    }
  };

  const planRows: PlanRow[] = (selected?.plans ?? []).map((p) => ({
    ...p,
    elderName: selected?.name ?? '',
  }));

  return (
    <Row gutter={16}>
      <Col span={7}>
        <Card title="在管老人" size="small">
          {elders.map((elder) => (
            <Card
              key={elder.id}
              size="small"
              hoverable
              onClick={() => setSelected(elder)}
              style={{
                marginBottom: 8,
                borderColor:
                  selected?.id === elder.id ? '#2f6f4f' : undefined,
                borderWidth: selected?.id === elder.id ? 2 : 1,
              }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Space>
                  <Typography.Text strong>{elder.name}</Typography.Text>
                  <Typography.Text type="secondary">
                    {elder.gender === 'male' ? '男' : '女'} · {elder.age} 岁
                  </Typography.Text>
                </Space>
                <Space wrap size={4}>
                  {elder.conditions.map((c) => (
                    <Tag key={c} color="green">
                      {c}
                    </Tag>
                  ))}
                </Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {elder.address}
                </Typography.Text>
              </Space>
            </Card>
          ))}
        </Card>
      </Col>
      <Col span={17}>
        <Card
          title={
            <Space>
              <MedicineBoxOutlined />
              <span>{selected?.name ?? ''} 的用药计划</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openRegister}
              disabled={!selected}
            >
              登记长期用药
            </Button>
          }
        >
          {selected && (
            <Descriptions size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="代买家属">
                {selected.familyContacts
                  .filter((c) => c.isBuyer)
                  .map((c) => `${c.name}（${c.relation}）`)
                  .join('、') || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selected.familyContacts.find((c) => c.isBuyer)?.phone ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="负责管家">
                {staff.find((s) => s.id === selected.housekeeperId)?.name ??
                  '-'}
              </Descriptions.Item>
            </Descriptions>
          )}
          <Table<PlanRow>
            rowKey="id"
            dataSource={planRows}
            pagination={false}
            columns={[
              {
                title: '药品',
                dataIndex: 'medicineName',
                render: (v: string, row) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{v}</Typography.Text>
                    <Tag color="green">{row.condition}</Tag>
                  </Space>
                ),
              },
              {
                title: '用法',
                render: (_, row) =>
                  `每次 ${row.dosagePerIntake}${row.unit} · 每日 ${row.timesPerDay} 次`,
              },
              {
                title: '药盒余量',
                width: 180,
                render: (_, row) => {
                  const pct = Math.round(
                    (row.remainingQty / row.boxCapacity) * 100,
                  );
                  const daysLeft = row.stock?.daysLeft ?? 0;
                  return (
                    <Space direction="vertical" size={0} style={{ width: 150 }}>
                      <Progress
                        percent={pct}
                        size="small"
                        status={daysLeft <= 5 ? 'exception' : 'normal'}
                      />
                      <Typography.Text
                        type={daysLeft <= 5 ? 'danger' : 'secondary'}
                        style={{ fontSize: 12 }}
                      >
                        余 {row.remainingQty}
                        {row.unit}，约可服用 {daysLeft} 天
                      </Typography.Text>
                    </Space>
                  );
                },
              },
              {
                title: '复诊日期',
                dataIndex: 'nextVisitDate',
                render: (v: string, row) => (
                  <Space direction="vertical" size={0}>
                    <span>{v}</span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {row.stock && row.stock.daysToVisit <= 7
                        ? `临近（${row.stock.daysToVisit} 天后）`
                        : ''}
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                title: '代买习惯',
                render: (_, row) => (
                  <Space direction="vertical" size={0}>
                    <span>
                      {row.purchaseHabit.buyerName} ·{' '}
                      {row.purchaseHabit.channel}
                    </span>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      每 {row.purchaseHabit.cycleDays} 天购买 · 提前{' '}
                      {row.purchaseHabit.leadTimeDays} 天
                    </Typography.Text>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Col>

      <Modal
        title={`为 ${selected?.name ?? ''} 登记长期用药`}
        open={modalOpen}
        onOk={submit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={640}
        okText="登记"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="medicineName"
                label="药品名称（含规格）"
                rules={[{ required: true, message: '请输入药品名称' }]}
              >
                <Input placeholder="如：苯磺酸氨氯地平片 5mg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="condition"
                label="对应慢病"
                rules={[{ required: true }]}
              >
                <Select options={CONDITIONS.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Select
                  options={['片', '粒', '支', '袋'].map((u) => ({
                    value: u,
                    label: u,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="dosagePerIntake"
                label="每次用量"
                rules={[{ required: true }]}
              >
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="timesPerDay"
                label="每日次数"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="boxCapacity"
                label="药盒容量"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="remainingQty"
                label="当前余量"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="nextVisitDate"
                label="下次复诊日期"
                rules={[{ required: true, message: '请选择复诊日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Typography.Title level={5}>家属代买习惯</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="buyerName"
                label="代买人"
                rules={[{ required: true, message: '请输入代买人' }]}
              >
                <Input placeholder="通常为家属姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="channel" label="购买渠道" rules={[{ required: true }]}>
                <Select
                  options={['医保定点药店', '社区医院', '线上药房'].map((c) => ({
                    value: c,
                    label: c,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="lastPurchaseAt"
                label="上次购买日期"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="leadTimeDays"
                label="习惯提前购买天数"
                rules={[{ required: true }]}
              >
                <InputNumber min={0} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cycleDays"
                label="平均购买周期（天）"
                rules={[{ required: true }]}
              >
                <InputNumber min={7} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Row>
  );
}
