import { Injectable } from '@nestjs/common';
import { StoreService } from '../database/store.service.js';
import { Medication } from '../database/types.js';
import { daysBetween, today } from '../common/util.js';
import { CHANNEL_LABEL, formatDate } from './reminder-texts.js';
import { FamilyReminderView, MedReminder, Urgency } from './reminders.types.js';

const ISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return ISO(d);
};

@Injectable()
export class RemindersService {
  constructor(private store: StoreService) {}

  /** 计算单盒药的补药提醒 */
  evaluate(med: Medication): MedReminder {
    const now = today();
    const elder = this.store.getElder(med.elderId);

    const stockDays =
      med.dosesPerDay > 0 ? Math.floor(med.stockDoses / med.dosesPerDay) : 999;
    const runOutDate = addDays(now, stockDays);
    const daysToVisit = daysBetween(now, med.nextVisitDate);

    // 触发条件
    const stockLow = stockDays <= med.thresholdDays;
    const visitSoon = daysToVisit >= 0 && daysToVisit <= 7;
    // 家属习惯：希望复诊前/断药前 leadDays 天完成购药
    const latestOrderDate = addDays(med.nextVisitDate, -med.buyerLeadDays);
    const orderVsRunout = addDays(runOutDate, -med.buyerLeadDays);
    const orderByDate =
      latestOrderDate < orderVsRunout ? latestOrderDate : orderVsRunout;
    const habitDue = daysBetween(now, orderByDate) <= 0;

    // 建议补药量：覆盖到复诊后一个用药周期（28天），至少补足阈值天数
    const coverTarget = daysToVisit > 0 ? daysToVisit + 28 : 28;
    const suggestedRefillDoses = Math.max(
      med.dosesPerDay * coverTarget - med.stockDoses,
      0,
    );

    const reasons: string[] = [];
    if (stockLow) {
      reasons.push(
        stockDays <= 0
          ? '药盒余量已用完'
          : `药盒余量约 ${stockDays} 天（阈值 ${med.thresholdDays} 天）`,
      );
    }
    if (visitSoon) {
      reasons.push(
        daysToVisit === 0
          ? '今天复诊，可请医生开下一周期用药'
          : `${daysToVisit} 天后复诊（${formatDate(med.nextVisitDate)}），建议复诊前备药`,
      );
    }
    if (habitDue && (stockLow || visitSoon)) {
      reasons.push(
        `按${med.buyerName.split('（')[0]}的代买习惯（提前 ${med.buyerLeadDays} 天），今天该安排购药了`,
      );
    }

    let urgency: Urgency = 'info';
    if (stockDays <= 2 || (stockLow && daysToVisit > stockDays)) {
      urgency = 'critical';
    } else if (stockLow || visitSoon || habitDue) {
      urgency = 'warning';
    }

    const nextStep = this.buildNextStep(med, stockDays, daysToVisit);

    return {
      medId: med.id,
      elderId: med.elderId,
      elderName: elder.name,
      medName: med.name,
      category: med.category,
      channel: med.buyerChannel,
      urgency,
      stockDays,
      runOutDate,
      daysToVisit,
      nextVisitDate: med.nextVisitDate,
      orderByDate,
      habitDue,
      suggestedRefillDoses,
      reasons,
      nextStep,
      stock: stockLow,
      visit: visitSoon,
      buyerHabit: habitDue,
    };
  }

  private buildNextStep(
    med: Medication,
    stockDays: number,
    daysToVisit: number,
  ): string {
    if (stockDays <= 2) {
      return `请尽快安排购药，预计 ${
        stockDays <= 0 ? '已断药' : `${stockDays} 天后断药`
      }；可联系${med.buyerName}通过「${CHANNEL_LABEL[med.buyerChannel]}」处理。`;
    }
    if (daysToVisit >= 0 && daysToVisit <= 7) {
      return `复诊临近（${formatDate(med.nextVisitDate)}），可按习惯${CHANNEL_LABEL[med.buyerChannel]}，或复诊时请医生开下一周期用药。`;
    }
    return `按「${CHANNEL_LABEL[med.buyerChannel]}」习惯关注药盒余量，余量低于 ${med.thresholdDays} 天时系统会再次提醒。`;
  }

  /** 管家端：所有需要关注的补药提醒，按紧急程度排序 */
  listAll(): MedReminder[] {
    return this.store
      .listMeds()
      .filter((m) => m.status === 'active')
      .map((m) => this.evaluate(m))
      .filter((r) => r.stock || r.visit || r.buyerHabit)
      .sort(
        (a, b) =>
          this.rank(b.urgency) - this.rank(a.urgency) ||
          a.stockDays - b.stockDays,
      );
  }

  /** 管家端：某位老人的全部药盒评估（含正常项） */
  listByElder(elderId: string): MedReminder[] {
    return this.store
      .listMeds(elderId)
      .filter((m) => m.status === 'active')
      .map((m) => this.evaluate(m))
      .sort(
        (a, b) =>
          this.rank(b.urgency) - this.rank(a.urgency) ||
          a.stockDays - b.stockDays,
      );
  }

  /** 家属端：过滤为某位老人的提醒，并剥离诊断性信息 */
  listForFamily(elderId: string): FamilyReminderView[] {
    return this.listByElder(elderId)
      .filter((r) => r.stock || r.visit || r.buyerHabit)
      .map((r) => this.toFamilyView(r));
  }

  toFamilyView(r: MedReminder): FamilyReminderView {
    const med = this.store.getMed(r.medId);
    return {
      medId: r.medId,
      elderId: r.elderId,
      elderName: r.elderName,
      medName: r.medName,
      dosageText: med.dosageText,
      scheduleText: med.scheduleText,
      urgency: r.urgency,
      stockDays: r.stockDays,
      runOutDate: r.runOutDate,
      nextVisitDate: r.nextVisitDate,
      orderByDate: r.orderByDate,
      suggestedRefillDoses: r.suggestedRefillDoses,
      // 家属端文案重写：只说“余量/复诊/安排购药”，不出现慢病诊断
      reasons: r.reasons.map((x) =>
        x.replace(/高血压|糖尿病|慢病/g, '长期用药').replace(/诊断/g, '复诊'),
      ),
      nextStep: r.nextStep
        .replace(/高血压|糖尿病|慢病/g, '长期用药')
        .replace(/诊断/g, '复诊'),
      buyerChannel: CHANNEL_LABEL[med.buyerChannel],
      buyerName: med.buyerName,
      buyerNote: med.buyerNote,
    };
  }

  private rank(u: Urgency): number {
    return u === 'critical' ? 2 : u === 'warning' ? 1 : 0;
  }
}
