import { Injectable } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import {
  MedicationPlan,
  RefillReminder,
  ReminderLevel,
  ReminderStatus,
  ReminderType,
} from '../../common/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 余量缓冲天数：在代买提前期之外再留 2 天缓冲 */
const STOCK_BUFFER_DAYS = 2;
/** 复诊提醒提前天数 */
const VISIT_AHEAD_DAYS = 7;
/** 购买周期提醒提前天数 */
const CYCLE_AHEAD_DAYS = 3;

export interface PlanStockView {
  planId: string;
  dailyUsage: number; // 日耗量
  daysLeft: number; // 余量可支撑天数
  daysToVisit: number; // 距复诊天数
  daysToNextPurchase: number; // 距习惯购买日天数
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(isoDate: string): number {
  const target = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  return Math.round((target.getTime() - todayStart().getTime()) / DAY_MS);
}

function isoAfterDays(days: number): string {
  const d = todayStart();
  d.setDate(d.getDate() + Math.max(0, Math.round(days)));
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class RemindersService {
  constructor(private readonly store: DataStore) {}

  /** 计算用药计划的消耗与日期指标 */
  summarizePlan(plan: MedicationPlan): PlanStockView {
    const dailyUsage = plan.dosagePerIntake * plan.timesPerDay;
    const daysLeft =
      dailyUsage > 0 ? Math.floor(plan.remainingQty / dailyUsage) : Infinity;
    const nextPurchase =
      new Date(
        `${plan.purchaseHabit.lastPurchaseAt.slice(0, 10)}T00:00:00`,
      ).getTime() +
      plan.purchaseHabit.cycleDays * DAY_MS;
    const daysToNextPurchase = Math.round(
      (nextPurchase - todayStart().getTime()) / DAY_MS,
    );
    return {
      planId: plan.id,
      dailyUsage,
      daysLeft,
      daysToVisit: diffDays(plan.nextVisitDate),
      daysToNextPurchase,
    };
  }

  /**
   * 按规则为全部在用用药计划生成补药提醒：
   *  1. low_stock       药盒余量不足以覆盖“代买提前期 + 缓冲”
   *  2. visit_due       复诊日期临近（7 天内）或已过期，需复诊续方
   *  3. purchase_cycle  按家属代买习惯，临近/超过平均购买周期
   * 同一计划同一类型已存在 pending 提醒时不重复生成。
   */
  refreshReminders(): RefillReminder[] {
    for (const plan of this.store.medicationPlans) {
      if (!plan.active) continue;
      const view = this.summarizePlan(plan);
      this.applyLowStockRule(plan, view);
      this.applyVisitRule(plan, view);
      this.applyPurchaseCycleRule(plan, view);
    }
    return this.sorted(this.store.reminders);
  }

  private hasPending(planId: string, type: ReminderType): boolean {
    return this.store.reminders.some(
      (r) => r.planId === planId && r.type === type && r.status === 'pending',
    );
  }

  private push(
    plan: MedicationPlan,
    type: ReminderType,
    level: ReminderLevel,
    title: string,
    message: string,
    suggestion: string,
    suggestDate: string,
  ): void {
    if (this.hasPending(plan.id, type)) return;
    this.store.reminders.push({
      id: this.store.nextId('rem'),
      elderId: plan.elderId,
      planId: plan.id,
      type,
      level,
      title,
      message,
      suggestion,
      suggestDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }

  private applyLowStockRule(plan: MedicationPlan, view: PlanStockView): void {
    const threshold = plan.purchaseHabit.leadTimeDays + STOCK_BUFFER_DAYS;
    if (view.daysLeft > threshold) return;
    const level: ReminderLevel = view.daysLeft <= 2 ? 'urgent' : 'warning';
    const habit = plan.purchaseHabit;
    this.push(
      plan,
      'low_stock',
      level,
      '药盒余量不足',
      `「${plan.medicineName}」药盒余量约可服用 ${view.daysLeft} 天，低于安全线（${threshold} 天）。`,
      `建议由${habit.buyerName}通过「${habit.channel}」购买，通常需提前 ${habit.leadTimeDays} 天准备。`,
      isoAfterDays(Math.max(view.daysLeft - habit.leadTimeDays, 0)),
    );
  }

  private applyVisitRule(plan: MedicationPlan, view: PlanStockView): void {
    if (view.daysToVisit > VISIT_AHEAD_DAYS) return;
    const overdue = view.daysToVisit < 0;
    this.push(
      plan,
      'visit_due',
      overdue ? 'urgent' : 'info',
      overdue ? '复诊已过期' : '复诊临近，记得续方',
      overdue
        ? `「${plan.medicineName}」的复诊日期已过 ${-view.daysToVisit} 天，长期用药需要重新评估。`
        : `距离复诊还有 ${view.daysToVisit} 天，「${plan.medicineName}」可在复诊时请医生续方。`,
      overdue
        ? '建议尽快联系管家预约复诊，复诊时携带当前药盒。'
        : `建议复诊当天携带药盒，由医生确认用药方案后直接续方（${plan.purchaseHabit.channel}）。`,
      overdue ? isoAfterDays(0) : isoAfterDays(view.daysToVisit),
    );
  }

  private applyPurchaseCycleRule(
    plan: MedicationPlan,
    view: PlanStockView,
  ): void {
    if (view.daysToNextPurchase > CYCLE_AHEAD_DAYS) return;
    const habit = plan.purchaseHabit;
    const overdue = view.daysToNextPurchase < 0;
    this.push(
      plan,
      'purchase_cycle',
      overdue ? 'warning' : 'info',
      '到了习惯购药时间',
      overdue
        ? `按${habit.buyerName}的代买习惯（约每 ${habit.cycleDays} 天一次），「${plan.medicineName}」已超出常规购买日 ${-view.daysToNextPurchase} 天。`
        : `按${habit.buyerName}的代买习惯（约每 ${habit.cycleDays} 天一次），「${plan.medicineName}」预计 ${view.daysToNextPurchase} 天后需要购买。`,
      `建议${habit.buyerName}按往常习惯通过「${habit.channel}」购买，并与药盒余量核对。`,
      isoAfterDays(Math.max(view.daysToNextPurchase, 0)),
    );
  }

  listAll(status?: ReminderStatus): RefillReminder[] {
    this.refreshReminders();
    return this.sorted(
      this.store.reminders.filter((r) => !status || r.status === status),
    );
  }

  private sorted(reminders: RefillReminder[]): RefillReminder[] {
    return [...reminders].sort((a, b) => {
      const weight: Record<ReminderLevel, number> = {
        urgent: 0,
        warning: 1,
        info: 2,
      };
      return (
        weight[a.level] - weight[b.level] ||
        a.suggestDate.localeCompare(b.suggestDate)
      );
    });
  }

  listForElder(elderId: string): RefillReminder[] {
    return this.listAll().filter((r) => r.elderId === elderId);
  }

  setStatus(id: string, status: ReminderStatus): RefillReminder | undefined {
    const reminder = this.store.reminders.find((r) => r.id === id);
    if (!reminder) return undefined;
    reminder.status = status;
    // 补药完成后同步更新药盒余量与购买记录
    if (status === 'done') {
      const plan = this.store.findPlan(reminder.planId);
      if (plan) {
        plan.remainingQty = plan.boxCapacity;
        plan.purchaseHabit.lastPurchaseAt = new Date()
          .toISOString()
          .slice(0, 10);
      }
    }
    return reminder;
  }
}
