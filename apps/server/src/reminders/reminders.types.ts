import { MedCategory, BuyerChannel } from '../database/types.js';

export type Urgency = 'info' | 'warning' | 'critical';

export interface ReminderTriggers {
  /** 余量低于阈值 */
  stock: boolean;
  /** 复诊临近，需要复诊前备药 */
  visit: boolean;
  /** 按家属代买习惯，已到其习惯下单时间 */
  buyerHabit: boolean;
}

/** 管家/护工可见的完整提醒（含慢病分类等内部信息） */
export interface MedReminder extends ReminderTriggers {
  medId: string;
  elderId: string;
  elderName: string;
  medName: string;
  category: MedCategory;
  channel: BuyerChannel;
  urgency: Urgency;
  stockDays: number;
  runOutDate: string;
  daysToVisit: number;
  nextVisitDate: string;
  /** 按代买习惯推算的最晚下单/购药日期 */
  orderByDate: string;
  habitDue: boolean;
  suggestedRefillDoses: number;
  reasons: string[];
  nextStep: string;
}

/** 家属端安全视图：无慢病分类、无诊断性结论 */
export interface FamilyReminderView {
  medId: string;
  elderId: string;
  elderName: string;
  medName: string;
  dosageText: string;
  scheduleText: string;
  urgency: Urgency;
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
