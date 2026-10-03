import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Button,
  Dialog,
  Stepper,
  TextArea,
  Toast,
} from 'antd-mobile';
import { CameraOutline } from 'antd-mobile-icons';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../shared/api';
import type { MedDTO, RoleIdentity } from '../../shared/api';
import type { CheckCondition } from '../../shared/types';
import { useIdentity } from '../identity';

interface RowState {
  medId: string;
  condition: CheckCondition;
  stockObserved: number;
  note: string;
}

const CONDITION_OPTIONS: { value: CheckCondition; label: string; tone: string }[] = [
  { value: 'normal', label: '正常', tone: 'ok' },
  { value: 'suspected_missed', label: '疑似漏服', tone: 'critical' },
  { value: 'suspected_mixed', label: '疑似混药', tone: 'critical' },
  { value: 'low_stock', label: '余量不符', tone: 'warning' },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CheckInPage() {
  const { elderId = '' } = useParams();
  const navigate = useNavigate();
  const { identity } = useIdentity() as { identity: RoleIdentity };
  const fileRef = useRef<HTMLInputElement>(null);

  const [elderName, setElderName] = useState('');
  const [meds, setMeds] = useState<MedDTO[]>([]);
  const [rows, setRows] = useState<RowState[]>([]);
  const [photos, setPhotos] = useState<{ dataUrl: string; label: string }[]>([]);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (identity.role !== 'caregiver') return;
    Promise.all([api.elder(elderId), api.meds(elderId)]).then(([e, m]) => {
      setElderName(e.name);
      setMeds(m);
      setRows(
        m.map((med) => ({
          medId: med.id,
          condition: 'normal',
          stockObserved: med.stockDoses,
          note: '',
        })),
      );
    });
  }, [elderId, identity.role]);

  if (identity.role !== 'caregiver') return <Navigate to="/h5/tasks" replace />;

  const updateRow = (medId: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.medId === medId ? { ...r, ...patch } : r)));
  };

  const onPickPhoto = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files).slice(0, 4)) {
      const dataUrl = await fileToDataUrl(file);
      setPhotos((prev) => [
        ...prev,
        { dataUrl, label: `${elderName}家药盒-${new Date().toLocaleTimeString('zh-CN')}` },
      ]);
    }
    Toast.show({ icon: 'success', content: '照片已加入' });
  };

  const issueCount = rows.filter((r) => r.condition !== 'normal').length;

  const submit = async () => {
    if (photos.length === 0) {
      Toast.show({ icon: 'fail', content: '请至少拍摄 1 张药盒照片' });
      return;
    }
    setSubmitting(true);
    try {
      const photoIds: string[] = [];
      for (const p of photos) {
        const res = await api.uploadPhoto(p.dataUrl, p.label, identity);
        photoIds.push(res.id);
      }
      const res = await api.createCheck(
        { elderId, photoIds, summary, items: rows },
        identity,
      );
      Dialog.alert({
        title: res.alert ? '核查已提交，发现需要关注的情况' : '核查已提交',
        content:
          res.alert ??
          '药盒状态正常，已按现场清点更新余量。',
        confirmText: '查看记录',
        onConfirm: () => navigate('/h5/history'),
      });
    } catch (e) {
      Toast.show({ icon: 'fail', content: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="h5-card" style={{ background: 'linear-gradient(135deg,#2f8f7d,#1f6f61)', color: '#fff' }}>
        <div className="h5-muted" style={{ color: 'rgba(255,255,255,0.85)' }}>
          上门核查
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginTop: 4 }}>{elderName} 家</div>
        <div className="h5-muted" style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
          请逐格核对药盒，拍摄药盒分格照片；发现漏服或混药请选择对应状态
        </div>
      </div>

      <div className="h5-card-title">① 拍照确认药盒</div>
      <div className="h5-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {photos.map((p, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={p.dataUrl} className="photo-thumb" alt="药盒" />
              <span
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '0 8px',
                  fontSize: 12,
                }}
              >
                删除
              </span>
            </div>
          ))}
          {photos.length < 4 && (
            <button
              type="button"
              className="photo-add"
              onClick={() => fileRef.current?.click()}
            >
              <CameraOutline fontSize={26} />
              拍摄 / 选择照片
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          hidden
          onChange={(e) => onPickPhoto(e.target.files)}
        />
        <div className="h5-muted" style={{ marginTop: 8 }}>
          照片仅用于药盒核查，会同步到家属端的照片时间线。
        </div>
      </div>

      <div className="h5-card-title">② 逐盒核对（{meds.length} 盒长期用药）</div>
      {rows.map((row) => {
        const med = meds.find((m) => m.id === row.medId)!;
        const issue = row.condition !== 'normal';
        return (
          <div key={row.medId} className={`checkin-med ${issue ? 'issue' : ''}`}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{med.name}</div>
            <div className="h5-muted" style={{ margin: '3px 0 10px' }}>
              {med.dosageText} · {med.scheduleText} · 系统余量 {med.stockDoses} 剂
            </div>

            <div className="h5-muted" style={{ marginBottom: 6 }}>现场清点余量（剂）</div>
            <Stepper
              min={0}
              value={row.stockObserved}
              onChange={(v) => updateRow(row.medId, { stockObserved: Number(v ?? 0) })}
              style={{ '--border-radius': '10px' } as CSSProperties}
            />

            <div className="h5-muted" style={{ margin: '12px 0 6px' }}>药盒状态</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateRow(row.medId, { condition: opt.value })}
                  className={`cond-btn cond-${opt.tone} ${row.condition === opt.value ? 'sel' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {issue && (
              <div style={{ marginTop: 10 }}>
                <div className="h5-muted" style={{ marginBottom: 4 }}>现场说明（内部记录）</div>
                <TextArea
                  rows={2}
                  placeholder="如 早格少2片；晚格混入白色小片…"
                  value={row.note}
                  onChange={(v) => updateRow(row.medId, { note: v })}
                />
                <div className="privacy-banner" style={{ marginTop: 8 }}>
                  该状态会自动生成健康观察记录；家属端只看到中性提醒与下一步建议，不展示判断结论。
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="h5-card-title">③ 整体情况备注</div>
      <div className="h5-card">
        <TextArea
          rows={3}
          placeholder="记录本次上门的整体情况（供管家查看）"
          value={summary}
          onChange={setSummary}
        />
      </div>

      <div className="submit-bar">
        <Button
          block
          loading={submitting}
          color={issueCount > 0 ? 'danger' : 'primary'}
          size="large"
          onClick={submit}
        >
          {issueCount > 0 ? `提交核查并生成 ${issueCount} 条观察记录` : '提交核查'}
        </Button>
      </div>

    </div>
  );
}
