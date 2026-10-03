/** 领域模型类型定义（对应 Supabase 中的数据表结构） */

export type UserRole = 'manager' | 'caregiver' | 'family';

export type MedCategory = 'hypertension' | 'diabetes' | 'other_chronic';

export type BuyerChannel = 'family' | 'pharmacy' | 'online';

export type CheckCondition =
  | 'normal'
  | 'suspected_missed'
  | 'suspected_mixed'
  | 'low_stock';

export type ObservationType = 'missed_dose' | 'mixed_pills' | 'abnormal_stock';

export type Severity = 'info' | 'warning' | 'critical';

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface Elder {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  address: string;
  roomNo: string;
  managerId: string;
  caregiverIds: string[];
  family: FamilyContact[];
  primaryFamilyId: string;
}

export interface Caregiver {
  id: string;
  name: string;
  phone: string;
}

export interface Manager {
  id: string;
  name: string;
}

/** 管家登记的长期用药（药盒） */
export interface Medication {
  id: string;
  elderId: string;
  /** 药品名称（家属代购需要看到具体药名） */
  name: string;
  /** 慢病分类：属于内部健康档案，不向家属端展示（避免暴露诊断结论） */
  category: MedCategory;
  dosageText: string;
  /** 服药频次说明，如 每日1次 / 每日2次(早晚) */
  scheduleText: string;
  /** 每日消耗剂量，用于推算余量天数 */
  dosesPerDay: number;
  /** 药盒当前余量（单位：剂/片） */
  stockDoses: number;
  /** 补药提醒阈值（剩余天数） */
  thresholdDays: number;
  /** 下次复诊日期 ISO yyyy-mm-dd */
  nextVisitDate: string;
  /** 家属代买/取药习惯 */
  buyerChannel: BuyerChannel;
  buyerName: string;
  /** 购药提前量（习惯提前几天买） */
  buyerLeadDays: number;
  buyerNote: string;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface Photo {
  id: string;
  dataUrl: string;
  label: string;
  createdAt: string;
}

export interface MedCheckItem {
  medId: string;
  condition: CheckCondition;
  stockObserved: number;
  note: string;
}

/** 护工上门药盒核查记录 */
export interface MedCheck {
  id: string;
  elderId: string;
  caregiverId: string;
  caregiverName: string;
  visitAt: string;
  photoIds: string[];
  items: MedCheckItem[];
  /** 护工现场描述（内部可见） */
  summary: string;
  generatedObservationIds: string[];
}

/** 健康观察记录（内部医疗/照护信息，家属端仅展示建议部分） */
export interface HealthObservation {
  id: string;
  elderId: string;
  checkId: string;
  type: ObservationType;
  severity: Severity;
  /** 观察详情（内部） */
  content: string;
  /** 下一步建议（可对家属展示的非诊断性表述） */
  suggestion: string;
  photoIds: string[];
  createdAt: string;
  acknowledged: boolean;
}
