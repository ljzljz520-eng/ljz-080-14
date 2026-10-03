import { DataStore } from '../../common/data.store';
import { RemindersService } from '../reminders/reminders.service';
import { FamilyService } from './family.service';

describe('FamilyService 家属端隐私边界', () => {
  let service: FamilyService;

  beforeEach(() => {
    const store = new DataStore();
    service = new FamilyService(store, new RemindersService(store));
  });

  it('返回提醒、照片与下一步建议', () => {
    const view = service.overview('elder-1');
    expect(view.elder.name).toBe('陈建国');
    expect(view.reminders.length).toBeGreaterThan(0);
    expect(view.visits.length).toBeGreaterThan(0);
    expect(view.visits[0].photoUrl).toContain('data:image');
    const attention = view.visits.find((v) => v.result === 'attention');
    expect(attention).toBeDefined();
    expect(attention!.suggestion).toBeTruthy();
  });

  it('不泄露医疗诊断结论与内部字段', () => {
    const view = service.overview('elder-1');
    const raw = JSON.stringify(view);
    // 内部医学描述、严重度、异常类型明细、慢病标签均不得出现在家属端
    expect(raw).not.toContain('clinicalNote');
    expect(raw).not.toContain('severity');
    expect(raw).not.toContain('missed_dose');
    expect(raw).not.toContain('mixed_meds');
    expect(raw).not.toContain('血压晨峰');
    expect(raw).not.toContain('conditions');
    // 家属可见的下一步建议应保留
    expect(raw).toContain('建议');
  });

  it('老人不存在时抛出 NotFoundException', () => {
    expect(() => service.overview('nobody')).toThrow();
  });
});
