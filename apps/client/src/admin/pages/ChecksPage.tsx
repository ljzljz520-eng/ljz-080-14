import { CameraOutlined, InboxOutlined } from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Elder, PillboxCheck, Staff } from '../../api/types';

const issueOptions = [
  { value: 'none', label: '正常' },
  { value: 'missed_dose', label: '发现漏服' },
  { value: 'mixed_meds', label: '发现混药' },
];

const issueTag: Record<string, { color: string; text: string }> = {
  none: { color: 'green', text: '正常' },
  missed_dose: { color: 'orange', text: '漏服' },
  mixed_meds: { color: 'red', text: '混药' },
};

/** 护工上门药盒核查：拍照确认，异常自动生成健康观察记录 */
export default function ChecksPage() {
  const { message } = AntApp.useApp();
  const [elders, setElders] = useState<Elder[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [checks, setChecks] = useState<PillboxCheck[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [photoData, setPhotoData] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const watchElderId = Form.useWatch('elderId', form);
  const watchIssue = Form.useWatch('issueType', form);

  const load = useCallback(async () => {
    const [e, s, c] = await Promise.all([
      api.listElders(),
      api.listStaff(),
      api.listChecks(),
    ]);
    setElders(e);
    setStaff(s.filter((x) => x.role === 'caregiver'));
    setChecks(c);
  }, []);

  useEffect(() => {
    load().catch((err) => message.error(err.message));
  }, [load, message]);

  const selectedElder = elders.find((e) => e.id === watchElderId);

  const beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData(String(reader.result));
      setFileList([
        { uid: file.name, name: file.name, status: 'done', url: String(reader.result) },
      ]);
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传，本地转 base64
  };

  const submit = async () => {
    const values = await form.validateFields();
    if (!photoData) {
      message.warning('请先拍摄/上传药盒照片');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.createCheck({
        elderId: values.elderId,
        caregiverId: values.caregiverId,
        photoUrl: photoData,
        remainingQty: values.remainingQty,
        issueType: values.issueType,
        issueNote: values.issueNote,
        planId: values.planId,
      });
      if (result.observation) {
        message.warning('核查已提交，系统已自动生成健康观察记录，请管家跟进');
      } else {
        message.success('核查已提交，药盒状态正常');
      }
      form.resetFields();
      setFileList([]);
      setPhotoData('');
      await load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Row gutter={16}>
      <Col span={10}>
        <Card
          title={
            <Space>
              <CameraOutlined />
              <span>护工上门核查登记</span>
            </Space>
          }
        >
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="拍照确认药盒状态；发现漏服或混药时，系统将自动生成健康观察记录并通知管家跟进。"
          />
          <Form form={form} layout="vertical" initialValues={{ issueType: 'none' }}>
            <Form.Item
              name="elderId"
              label="服务对象"
              rules={[{ required: true, message: '请选择老人' }]}
            >
              <Select
                placeholder="选择上门服务的老人"
                options={elders.map((e) => ({
                  value: e.id,
                  label: `${e.name}（${e.address}）`,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="planId"
              label="核查的用药计划"
              rules={[{ required: true, message: '请选择用药计划' }]}
            >
              <Select
                placeholder="选择本次核查的药盒"
                options={(selectedElder?.plans ?? []).map((p) => ({
                  value: p.id,
                  label: `${p.medicineName}（当前余量 ${p.remainingQty}${p.unit}）`,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="caregiverId"
              label="上门护工"
              rules={[{ required: true, message: '请选择护工' }]}
            >
              <Select
                placeholder="选择护工"
                options={staff.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
            <Form.Item label="药盒照片" required>
              <Upload.Dragger
                accept="image/*"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onRemove={() => {
                  setFileList([]);
                  setPhotoData('');
                }}
                maxCount={1}
                height={120}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传药盒照片</p>
              </Upload.Dragger>
            </Form.Item>
            <Form.Item
              name="remainingQty"
              label="清点后药盒余量"
              rules={[{ required: true, message: '请输入余量' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="实际清点数量" />
            </Form.Item>
            <Form.Item name="issueType" label="核查结果" rules={[{ required: true }]}>
              <Radio.Group options={issueOptions} optionType="button" buttonStyle="solid" />
            </Form.Item>
            {watchIssue !== 'none' && (
              <Form.Item
                name="issueNote"
                label="异常情况说明"
                rules={[{ required: true, message: '请说明异常情况' }]}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="如：周一早格剩余两片未服 / 降压药与保健品混放"
                />
              </Form.Item>
            )}
            <Button
              type="primary"
              block
              size="large"
              onClick={submit}
              loading={submitting}
            >
              提交核查
            </Button>
          </Form>
        </Card>
      </Col>
      <Col span={14}>
        <Card title="核查记录">
          <List
            dataSource={checks}
            renderItem={(item) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <Space align="start" size={16}>
                    <Image src={item.photoUrl} width={120} height={90} style={{ borderRadius: 8, objectFit: 'cover' }} />
                    <Space direction="vertical" size={4}>
                      <Space>
                        <Typography.Text strong>
                          {elders.find((e) => e.id === item.elderId)?.name ?? item.elderId}
                        </Typography.Text>
                        <Tag color={issueTag[item.issueType].color}>
                          {issueTag[item.issueType].text}
                        </Tag>
                      </Space>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.checkedAt).toLocaleString('zh-CN')} ·{' '}
                        {item.caregiverName} · 清点余量 {item.remainingQty}
                      </Typography.Text>
                      {item.issueNote && (
                        <Typography.Text type="warning" style={{ fontSize: 12 }}>
                          备注：{item.issueNote}
                        </Typography.Text>
                      )}
                    </Space>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}
