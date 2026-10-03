import type {
  CreateCheckPayload,
  Elder,
  ElderDetail,
  FamilyOverview,
  HealthObservation,
  ObservationStatus,
  PillboxCheck,
  RefillReminder,
  RegisterMedicationPayload,
  ReminderStatus,
  Staff,
} from './types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = `请求失败（${res.status}）`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message[0] : body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // 管理端
  listElders: () => request<Elder[]>('/elders'),
  elderDetail: (id: string) => request<ElderDetail>(`/elders/${id}`),
  listStaff: () => request<Staff[]>('/staff'),
  listReminders: (status?: ReminderStatus) =>
    request<RefillReminder[]>(`/reminders${status ? `?status=${status}` : ''}`),
  setReminderStatus: (id: string, status: ReminderStatus) =>
    request<RefillReminder>(`/reminders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  registerMedication: (payload: RegisterMedicationPayload) =>
    request('/medications', { method: 'POST', body: JSON.stringify(payload) }),
  listChecks: (elderId?: string) =>
    request<PillboxCheck[]>(`/checks${elderId ? `?elderId=${elderId}` : ''}`),
  createCheck: (payload: CreateCheckPayload) =>
    request<{ check: PillboxCheck; observation?: HealthObservation }>(
      '/checks',
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  listObservations: (status?: ObservationStatus) =>
    request<HealthObservation[]>(
      `/observations${status ? `?status=${status}` : ''}`,
    ),
  setObservationStatus: (id: string, status: ObservationStatus) =>
    request<HealthObservation>(`/observations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // 家属端
  familyOverview: (elderId: string) =>
    request<FamilyOverview>(`/family/${elderId}/overview`),
  familyMarkDone: (reminderId: string) =>
    request(`/family/reminders/${reminderId}/done`, { method: 'POST' }),
};
