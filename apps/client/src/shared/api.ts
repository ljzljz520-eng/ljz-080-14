import type {
  CheckCondition,
  Elder,
  FamilyContact,
  MedCategory,
  BuyerChannel,
} from "./types";

const BASE = "/api";

export interface RoleIdentity {
  role: "manager" | "caregiver" | "family";
  id: string;
  name: string;
}

function headers(identity?: RoleIdentity): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (identity) {
    h["x-user-role"] = identity.role;
    h["x-user-id"] = identity.id;
  }
  return h;
}

async function request<T>(
  path: string,
  options: RequestInit & { identity?: RoleIdentity } = {},
): Promise<T> {
  const { identity, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...headers(identity),
      ...((rest.headers as Record<string, string>) ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `请求失败 (${res.status})`);
  }
  return res.json();
}

// ---- 通用类型 ----
export interface MedDTO {
  id: string;
  elderId: string;
  name: string;
  category: MedCategory;
  categoryLabel: string;
  dosageText: string;
  scheduleText: string;
  dosesPerDay: number;
  stockDoses: number;
  thresholdDays: number;
  nextVisitDate: string;
  buyerChannel: BuyerChannel;
  buyerName: string;
  buyerLeadDays: number;
  buyerNote: string;
  status: string;
}

export interface ReminderDTO {
  medId: string;
  elderId: string;
  elderName: string;
  medName: string;
  category: MedCategory;
  channel: BuyerChannel;
  urgency: "info" | "warning" | "critical";
  stockDays: number;
  runOutDate: string;
  daysToVisit: number;
  nextVisitDate: string;
  orderByDate: string;
  habitDue: boolean;
  suggestedRefillDoses: number;
  reasons: string[];
  nextStep: string;
  stock: boolean;
  visit: boolean;
  buyerHabit: boolean;
}

export interface PhotoDTO {
  id: string;
  dataUrl: string;
  label: string;
  createdAt: string;
}

export interface CheckDTO {
  id: string;
  elderId: string;
  elderName: string;
  caregiverName: string;
  visitAt: string;
  summary: string;
  photos: PhotoDTO[];
  generatedObservationIds: string[];
  items: {
    medId: string;
    medName: string;
    dosageText: string;
    scheduleText: string;
    category: MedCategory;
    condition: CheckCondition;
    conditionLabel: string;
    stockObserved: number;
    note: string;
    hasIssue: boolean;
  }[];
}

export interface ObservationDTO {
  id: string;
  elderId: string;
  elderName: string;
  type: "missed_dose" | "mixed_pills" | "abnormal_stock";
  typeLabel: string;
  severity: "info" | "warning" | "critical";
  content: string;
  suggestion: string;
  photos: PhotoDTO[];
  createdAt: string;
  acknowledged: boolean;
}

// ---- 家属端 DTO ----
export interface FamilyElderDTO {
  id: string;
  name: string;
  roomNo: string;
  address: string;
  reminderCount: number;
  attentionCount: number;
  latestReminder: FamilyReminderDTO | null;
}

export interface FamilyReminderDTO {
  medId: string;
  elderId: string;
  elderName: string;
  medName: string;
  dosageText: string;
  scheduleText: string;
  urgency: "info" | "warning" | "critical";
  stockDays: number;
  runOutDate: string;
  nextVisitDate: string;
  orderByDate: string;
  suggestedRefillDoses: number;
  reasons: string[];
  nextStep: string;
  buyerChannel: string;
  buyerName: string;
  buyerNote: string;
}

export interface FamilyObservationDTO {
  id: string;
  createdAt: string;
  title: string;
  needAttention: boolean;
  nextStep: string;
  photos: PhotoDTO[];
}

export interface FamilyPhotoGroupDTO {
  checkId: string;
  visitAt: string;
  caregiverName: string;
  photos: PhotoDTO[];
  medStatus: { medName: string; statusText: string; normal: boolean }[];
}

export const api = {
  elders: () => request<Elder[]>("/elders"),
  elder: (id: string) =>
    request<
      Elder & { caregivers: { id: string; name: string; phone: string }[] }
    >(`/elders/${id}`),

  meds: (elderId?: string) =>
    request<MedDTO[]>(`/meds${elderId ? `?elderId=${elderId}` : ""}`),
  createMed: (dto: unknown) =>
    request<MedDTO>("/meds", { method: "POST", body: JSON.stringify(dto) }),
  updateMed: (id: string, dto: unknown) =>
    request<MedDTO>(`/meds/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    }),
  updateStock: (id: string, stockDoses: number, identity: RoleIdentity) =>
    request<MedDTO>(`/meds/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stockDoses }),
      identity,
    }),

  reminders: () =>
    request<{
      total: number;
      critical: number;
      warning: number;
      items: ReminderDTO[];
    }>("/reminders"),
  remindersByElder: (elderId: string) =>
    request<ReminderDTO[]>(`/reminders/by-elder?elderId=${elderId}`),

  uploadPhoto: (dataUrl: string, label: string, identity: RoleIdentity) =>
    request<{ id: string }>("/media/photos", {
      method: "POST",
      body: JSON.stringify({ dataUrl, label }),
      identity,
    }),

  createCheck: (
    dto: {
      elderId: string;
      photoIds: string[];
      summary: string;
      items: {
        medId: string;
        condition: CheckCondition;
        stockObserved: number;
        note?: string;
      }[];
    },
    identity: RoleIdentity,
  ) =>
    request<CheckDTO & { alert: string | null }>("/checks", {
      method: "POST",
      body: JSON.stringify(dto),
      identity,
    }),
  checks: (elderId?: string) =>
    request<CheckDTO[]>(`/checks${elderId ? `?elderId=${elderId}` : ""}`),

  observations: (elderId?: string) =>
    request<ObservationDTO[]>(
      `/observations${elderId ? `?elderId=${elderId}` : ""}`,
    ),
  ackObservation: (id: string) =>
    request<unknown>(`/observations/${id}/ack`, { method: "PATCH" }),

  // 家属端
  familyElders: (identity: RoleIdentity) =>
    request<FamilyElderDTO[]>("/family/elders", { identity }),
  familyReminders: (elderId: string, identity: RoleIdentity) =>
    request<{ notice: string; items: FamilyReminderDTO[] }>(
      `/family/elders/${elderId}/reminders`,
      { identity },
    ),
  familyObservations: (elderId: string, identity: RoleIdentity) =>
    request<FamilyObservationDTO[]>(`/family/elders/${elderId}/observations`, {
      identity,
    }),
  familyPhotos: (elderId: string, identity: RoleIdentity) =>
    request<FamilyPhotoGroupDTO[]>(`/family/elders/${elderId}/photos`, {
      identity,
    }),
};

export type { Elder, FamilyContact };
