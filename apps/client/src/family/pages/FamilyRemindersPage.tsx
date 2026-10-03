import { Button, Card, Empty, List, Tag, Toast } from 'antd-mobile';
import { api } from '../../api/client';
import type { FamilyOverview } from '../../api/types';

const levelStyle: Record<string, { color: 'danger' | 'warning' | 'primary'; text: string }> = {
  urgent: { color: 'danger', text: '紧急' },
  warning: { color: 'warning', text: '尽快' },
  info: { color: 'primary', text: '提示' },
};

/** 补药提醒：家属可标记“已购买” */
export default function FamilyRemindersPage({
  overview,
  onChanged,
}: {
  overview: FamilyOverview | null;
  onChanged: () => void;
}) {
  if (!overview) return null;
  const reminders = overview.reminders;

  const markDone = async (id: string) => {
    try {
      await api.familyMarkDone(id);
      Toast.show({ content: '已反馈购买完成，感谢配合' });
      onChanged();
    } catch (err) {
      Toast.show({ content: err instanceof Error ? err.message : '操作失败' });
    }
  };

  if (reminders.length === 0) {
    return <Empty description="暂无补药提醒，药品储备充足" style={{ padding: 32 }} />;
  }

  return (
    <List>
      {reminders.map((r) => {
        const lv = levelStyle[r.level] ?? levelStyle.info;
        const done = r.status === 'done';
        return (
          <List.Item key={r.id}>
            <Card className="med-card" style={{ margin: 0, width: '100%' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Tag color={lv.color}>{lv.text}</Tag>
                <span style={{ fontWeight: 600 }}>{r.title}</span>
                {done && <Tag color="success">已购买</Tag>}
              </div>
              <div style={{ marginTop: 8, fontSize: 14 }}>{r.message}</div>
              <div style={{ marginTop: 8, fontSize: 13, color: '#2f6f4f' }}>
                下一步建议：{r.suggestion}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: '#999' }}>
                  建议 {r.suggestDate} 前完成
                </span>
                {!done && (
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => markDone(r.id)}
                  >
                    我已购买
                  </Button>
                )}
              </div>
            </Card>
          </List.Item>
        );
      })}
    </List>
  );
}
