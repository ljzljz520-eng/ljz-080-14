/**
 * 慢病药盒管理 - 领域模型
 *
 * 角色：
 *  - 管家(housekeeper)：为老人登记长期用药、维护复诊日期与家属代买习惯
 *  - 护工(caregiver)：上门拍照核查药盒，发现漏服/混药时生成健康观察记录
 *  - 家属(family)：仅可见提醒、照片与下一步建议，不可见医疗诊断结论
 */

export type ChronicCondition =
  | '高血压'
  | '糖尿病'
  | '冠心病'
  | '慢阻肺'
  | '高血脂';

export interface FamilyContact {
  name: string;
  relation: string; // 与老人关系：子女/配偶等
  phone: string;
  isBuyer: boolean; // 是否为代买药家属
}

export interface Elder {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  address: string;
  conditions: ChronicCondition[]; // 慢病标签
  housekeeperId: string; // 负责管家
  familyContacts: FamilyContact[];
}

/** 家属代买习惯 */
export interface PurchaseHabit {
  buyerName: string; // 代买人（家属姓名或“管家代买”）
  channel: string; // 购买渠道：社区医院/医保药店/线上药房
  leadTimeDays: number; // 习惯提前几天购买
  cycleDays: number; // 平均购买周期（天）
  lastPurchaseAt: string; // 上次购买日期 ISO
}

/** 用药计划（管家登记） */
export interface MedicationPlan {
  id: string;
  elderId: string;
  medicineName: string; // 药品名，如 苯磺酸氨氯地平片
  condition: ChronicCondition; // 对应慢病
  unit: string; // 片/粒/支
  dosagePerIntake: number; // 每次用量
  timesPerDay: number; // 每日次数
  boxCapacity: number; // 药盒容量
  remainingQty: number; // 药盒当前余量
  nextVisitDate: string; // 下次复诊日期 ISO
  purchaseHabit: PurchaseHabit;
  registeredBy: string; // 登记管家
  createdAt: string;
  active: boolean;
}

export type ReminderType = 'low_stock' | 'visit_due' | 'purchase_cycle';
export type ReminderLevel = 'info' | 'warning' | 'urgent';
export type ReminderStatus = 'pending' | 'done' | 'dismissed';

/** 补药提醒（系统按规则生成） */
export interface RefillReminder {
  id: string;
  elderId: string;
  planId: string;
  type: ReminderType;
  level: ReminderLevel;
  title: string;
  message: string; // 提醒内容（家属可见，非诊断）
  suggestion: string; // 下一步建议（家属可见）
  suggestDate: string; // 建议完成日期 ISO
  status: ReminderStatus;
  createdAt: string;
}

export type CheckIssueType = 'none' | 'missed_dose' | 'mixed_meds';

/** 护工上门药盒核查（拍照确认） */
export interface PillboxCheck {
  id: string;
  elderId: string;
  caregiverId: string;
  caregiverName: string;
  checkedAt: string;
  photoUrl: string; // 药盒照片（data URL 或对象存储地址）
  remainingQty: number; // 核查时清点的药盒余量
  issueType: CheckIssueType; // none=正常 / missed_dose=漏服 / mixed_meds=混药
  issueNote: string; // 护工备注（内部）
}

export type ObservationType = 'missed_dose' | 'mixed_meds';
export type ObservationStatus = 'open' | 'following' | 'resolved';

/**
 * 健康观察记录（内部记录，含医学描述）
 * 注意：clinicalNote 属医疗相关信息，仅管理端可见；
 * 家属端仅暴露 familySuggestion（下一步建议）。
 */
export interface HealthObservation {
  id: string;
  elderId: string;
  checkId: string; // 关联的上门核查
  type: ObservationType;
  clinicalNote: string; // 内部医学描述/结论（家属端不可见）
  familySuggestion: string; // 给家属的下一步建议（家属可见）
  severity: 'low' | 'medium' | 'high';
  status: ObservationStatus;
  createdBy: string; // 护工
  createdAt: string;
}

export interface Caregiver {
  id: string;
  name: string;
  role: 'housekeeper' | 'caregiver';
}
