import { StoreService } from '../database/store.service.js';
import { Medication } from '../database/types.js';
import { RemindersService } from './reminders.service.js';

describe('RemindersService 补药提醒引擎', () => {
  let store: StoreService;
  let service: RemindersService;

  beforeEach(() => {
    store = new StoreService();
    service = new RemindersService(store);
  });

  it('低余量触发 stock 提醒并折算可服天数', () => {
    const med = store.getMed('md1'); // 5 剂 / 每日 1 = 5 天，阈值 7
    const r = service.evaluate(med);
    expect(r.stock).toBe(true);
    expect(r.stockDays).toBe(5);
    expect(r.runOutDate).toBe('2026-10-08');
    expect(r.urgency).toBe('critical');
  });

  it('复诊临近触发 visit 提醒', () => {
    const med = store.getMed('md3'); // 复诊 2026-10-06，即 3 天后
    const r = service.evaluate(med);
    expect(r.visit).toBe(true);
    expect(r.daysToVisit).toBe(3);
  });

  it('结合家属代买习惯计算最晚购药日与 habitDue', () => {
    const med: Medication = store.getMed('md3'); // 提前 2 天，复诊 10-06 -> 最晚 10-04
    expect(med.buyerLeadDays).toBe(2);
    const r = service.evaluate(med);
    // 断药 10-05 - 2 天 = 10-03，早于复诊-提前量 10-04，取更早者
    expect(r.orderByDate).toBe('2026-10-03');
    expect(r.habitDue).toBe(true);
  });

  it('余量充足且复诊尚远时不产生提醒', () => {
    const med = store.getMed('md5'); // 90 剂、复诊 11-15
    const r = service.evaluate(med);
    expect(r.stock || r.visit || r.buyerHabit).toBe(false);
  });

  it('家属视图不携带慢病分类字段', () => {
    const r = service.evaluate(store.getMed('md1'));
    const view = service.toFamilyView(r);
    expect(JSON.stringify(view)).not.toMatch(
      /hypertension|diabetes|高血压|糖尿病|诊断/,
    );
    expect(view).not.toHaveProperty('category');
    expect(view.medName).toBeTruthy();
    expect(view.nextStep).toContain('复诊');
  });

  it('建议补药量覆盖复诊后一个周期', () => {
    const r = service.evaluate(store.getMed('md1')); // (7+28)*1-5
    expect(r.suggestedRefillDoses).toBe(30);
  });
});
