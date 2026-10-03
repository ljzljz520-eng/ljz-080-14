import { DataStore } from '../../common/data.store';
import { daysFromNow } from '../../common/seed';
import { MedicationPlan } from '../../common/types';
import { RemindersService } from './reminders.service';

function makePlan(patch: Partial<MedicationPlan>): MedicationPlan {
  return {
    id: 'plan-x',
    elderId: 'elder-x',
    medicineName: '测试药',
    condition: '高血压',
    unit: '片',
    dosagePerIntake: 1,
    timesPerDay: 1,
    boxCapacity: 30,
    remainingQty: 30,
    nextVisitDate: daysFromNow(30),
    purchaseHabit: {
      buyerName: '家属甲',
      channel: '医保定点药店',
      leadTimeDays: 3,
      cycleDays: 30,
      lastPurchaseAt: daysFromNow(-5),
    },
    registeredBy: 'hk-1',
    createdAt: daysFromNow(-30),
    active: true,
    ...patch,
  };
}

describe('RemindersService 补药提醒规则', () => {
  let store: DataStore;
  let service: RemindersService;

  beforeEach(() => {
    store = new DataStore();
    store.medicationPlans.length = 0;
    store.reminders.length = 0;
    service = new RemindersService(store);
  });

  it('药盒余量不足（低于提前期+缓冲）时生成 low_stock 提醒', () => {
    // 每日 1 片，余 4 片 → 4 天 ≤ 3(提前期)+2(缓冲)
    store.medicationPlans.push(makePlan({ remainingQty: 4 }));
    const reminders = service.refreshReminders();
    const low = reminders.find((r) => r.type === 'low_stock');
    expect(low).toBeDefined();
    expect(low!.level).toBe('warning');
    expect(low!.message).toContain('4 天');
  });

  it('余量 ≤2 天时提醒级别为 urgent', () => {
    store.medicationPlans.push(makePlan({ remainingQty: 2 }));
    const low = service.refreshReminders().find((r) => r.type === 'low_stock');
    expect(low!.level).toBe('urgent');
  });

  it('余量充足时不生成 low_stock 提醒', () => {
    store.medicationPlans.push(makePlan({ remainingQty: 20 }));
    const low = service.refreshReminders().find((r) => r.type === 'low_stock');
    expect(low).toBeUndefined();
  });

  it('复诊日期 7 天内生成 visit_due 提醒，过期则 urgent', () => {
    store.medicationPlans.push(
      makePlan({ id: 'p1', nextVisitDate: daysFromNow(5) }),
      makePlan({ id: 'p2', nextVisitDate: daysFromNow(-3) }),
    );
    const reminders = service.refreshReminders();
    const soon = reminders.find(
      (r) => r.type === 'visit_due' && r.planId === 'p1',
    );
    const overdue = reminders.find(
      (r) => r.type === 'visit_due' && r.planId === 'p2',
    );
    expect(soon!.level).toBe('info');
    expect(overdue!.level).toBe('urgent');
  });

  it('临近家属代买周期时生成 purchase_cycle 提醒', () => {
    // 周期 30 天，上次购买在 28 天前 → 距下次购买 2 天 ≤ 3
    store.medicationPlans.push(
      makePlan({
        purchaseHabit: {
          buyerName: '家属甲',
          channel: '线上药房',
          leadTimeDays: 3,
          cycleDays: 30,
          lastPurchaseAt: daysFromNow(-28),
        },
      }),
    );
    const cycle = service
      .refreshReminders()
      .find((r) => r.type === 'purchase_cycle');
    expect(cycle).toBeDefined();
    expect(cycle!.suggestion).toContain('家属甲');
    expect(cycle!.suggestion).toContain('线上药房');
  });

  it('同一计划同一类型不重复生成 pending 提醒', () => {
    store.medicationPlans.push(makePlan({ remainingQty: 2 }));
    service.refreshReminders();
    service.refreshReminders();
    const lows = store.reminders.filter(
      (r) => r.type === 'low_stock' && r.status === 'pending',
    );
    expect(lows).toHaveLength(1);
  });

  it('标记已补药后回写药盒余量与购买日期', () => {
    store.medicationPlans.push(makePlan({ id: 'p9', remainingQty: 2 }));
    const [reminder] = service
      .refreshReminders()
      .filter((r) => r.type === 'low_stock');
    service.setStatus(reminder.id, 'done');
    const plan = store.findPlan('p9')!;
    expect(plan.remainingQty).toBe(plan.boxCapacity);
    expect(plan.purchaseHabit.lastPurchaseAt).toBe(
      new Date().toISOString().slice(0, 10),
    );
  });
});
