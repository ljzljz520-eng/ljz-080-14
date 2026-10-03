import { MobileOutlined, DesktopOutlined } from '@ant-design/icons';
import { Card, Col, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

/** 平台入口：管理端（PC）与家属端（H5） */
export default function EntryPage() {
  const navigate = useNavigate();
  return (
    <div className="entry-page">
      <div className="entry-hero">
        <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
          社区养老协作平台
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
          慢病药盒管理 · 管家登记用药 · 护工上门核查 · 家属协同补药
        </Paragraph>
      </div>
      <Row gutter={24} justify="center" style={{ maxWidth: 880, margin: '0 auto' }}>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="entry-card"
            onClick={() => navigate('/admin')}
          >
            <DesktopOutlined style={{ fontSize: 40, color: '#2f6f4f' }} />
            <Title level={4} style={{ marginTop: 16 }}>
              管理端（PC）
            </Title>
            <Text type="secondary">
              管家登记长期用药、查看补药提醒；护工上门拍照核查药盒，异常自动生成健康观察记录。
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            hoverable
            className="entry-card"
            onClick={() => navigate('/family')}
          >
            <MobileOutlined style={{ fontSize: 40, color: '#2f6f4f' }} />
            <Title level={4} style={{ marginTop: 16 }}>
              家属端（H5）
            </Title>
            <Text type="secondary">
              接收补药提醒、查看护工上门照片与下一步建议，一键反馈“已购买”。
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
