/** 与后端对齐的领域类型 */

export type ChronicCondition = '高血压' | '糖尿病' | '冠心病' | '慢阻肺' | '高血脂';

export interface FamilyContact {
  name: string;
  relation: string;
  phone: string;
  isBuyer: boolean;
}

export interface PurchaseHabit {
  buyerName: string;
  channel: string;
  leadTimeDays: number;
  cycleDays: number;
  lastPurchaseAt: string;
}

export interface PlanStockView {
  planId: string;
  dailyUsage: number;
  daysLeft: number;
  daysToVisit: number;
  daysToNextPurchase: number;
}

export interface MedicationPlan {
  id: string;
  elderId: string;
  medicineName: string;
  condition: ChronicCondition;
  unit: string;
  dosagePerIntake: number;
  timesPerDay: number;
  boxCapacity: number;
  remainingQty: number;
  nextVisitDate: string;
  purchaseHabit: PurchaseHabit;
  registeredBy: string;
  createdAt: string;
  active: boolean;
  stock?: PlanStockView;
}

export interface Elder {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  address: string;
  conditions: ChronicCondition[];
  housekeeperId: string;
  familyContacts: FamilyContact[];
  plans?: MedicationPlan[];
}

export type ReminderType = 'low_stock' | 'visit_due' | 'purchase_cycle';
export type ReminderLevel = 'info' | 'warning' | 'urgent';
export type ReminderStatus = 'pending' | 'done' | 'dismissed';

export interface RefillReminder {
  id: string;
  elderId: string;
  planId: string;
  type: ReminderType;
  level: ReminderLevel;
  title: string;
  message: string;
  suggestion: string;
  suggestDate: string;
  status: ReminderStatus;
  createdAt: string;
}

export type CheckIssueType = 'none' | 'missed_dose' | 'mixed_meds';

export interface PillboxCheck {
  id: string;
  elderId: string;
  caregiverId: string;
  caregiverName: string;
  checkedAt: string;
  photoUrl: string;
  remainingQty: number;
  issueType: CheckIssueType;
  issueNote: string;
}

export type ObservationStatus = 'open' | 'following' | 'resolved';

export interface HealthObservation {
  id: string;
  elderId: string;
  checkId: string;
  type: 'missed_dose' | 'mixed_meds';
  clinicalNote: string;
  familySuggestion: string;
  severity: 'low' | 'medium' | 'high';
  status: ObservationStatus;
  createdBy: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'housekeeper' | 'caregiver';
}

export interface ElderDetail extends Elder {
  plans: MedicationPlan[];
  checks: PillboxCheck[];
  observations: HealthObservation[];
  reminders: RefillReminder[];
}

/** 家属端聚合视图（已脱敏：无医疗诊断结论） */
export interface FamilyOverview {
  elder: { id: string; name: string; age: number; address: string };
  medications: Array<{
    planId: string;
    medicineName: string;
    unit: string;
    daysLeft: number | null;
    nextVisitDate: string;
  }>;
  reminders: Array<{
    id: string;
    type: ReminderType;
    level: ReminderLevel;
    title: string;
    message: string;
    suggestion: string;
    suggestDate: string;
    status: ReminderStatus;
  }>;
  visits: Array<{
    id: string;
    checkedAt: string;
    caregiverName: string;
    photoUrl: string;
    result: 'normal' | 'attention';
    resultText: string;
    suggestion: string | null;
  }>;
}

export interface RegisterMedicationPayload {
  elderId: string;
  medicineName: string;
  condition: ChronicCondition;
  unit: string;
  dosagePerIntake: number;
  timesPerDay: number;
  boxCapacity: number;
  remainingQty: number;
  nextVisitDate: string;
  purchaseHabit: PurchaseHabit;
  registeredBy: string;
}

export interface CreateCheckPayload {
  elderId: string;
  caregiverId: string;
  photoUrl: string;
  remainingQty: number;
  issueType: CheckIssueType;
  issueNote?: string;
  planId?: string;
}
