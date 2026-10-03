import { Selector } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';
import { useIdentity } from '../identity';
import type { RoleIdentity } from '../../shared/api';

const ROLES: { label: string; value: RoleIdentity }[] = [
  { label: '护工 · 李护工', value: { role: 'caregiver', id: 'c1', name: '李护工' } },
  { label: '护工 · 赵护工', value: { role: 'caregiver', id: 'c2', name: '赵护工' } },
  { label: '家属 · 周建国（儿子）', value: { role: 'family', id: 'f1', name: '周建国' } },
  { label: '家属 · 刘敏（孙女）', value: { role: 'family', id: 'f3', name: '刘敏' } },
  { label: '家属 · 孙伟（女婿）', value: { role: 'family', id: 'f4', name: '孙伟' } },
];

export default function RoleGate() {
  const { identity, setIdentity } = useIdentity();
  const navigate = useNavigate();
  return (
    <div style={{ padding: 24 }}>
      <h3>选择演示身份</h3>
      <p className="muted" style={{ fontSize: 13 }}>
        护工可拍照核查药盒并生成健康观察记录；家属端仅展示提醒、照片与下一步建议。
      </p>
      <Selector
        columns={1}
        options={ROLES.map((r) => ({ label: r.label, value: r.label }))}
        value={[identity.name]}
        onChange={(_, extra) => {
          const item = ROLES.find((r) => r.label === (extra.items[0]?.value as string));
          if (item) {
            setIdentity(item.value);
            navigate(item.value.role === 'family' ? '/h5/family' : '/h5/tasks');
          }
        }}
      />
    </div>
  );
}
