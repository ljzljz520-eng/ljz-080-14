import { StoreService } from '../database/store.service.js';
import { ObservationsService } from './observations.service.js';

describe('ObservationsService 健康观察记录生成', () => {
  let store: StoreService;
  let service: ObservationsService;

  beforeEach(() => {
    store = new StoreService();
    service = new ObservationsService(store);
  });

  it('疑似漏服生成 warning 级观察记录，含中性家属建议', () => {
    const o = service.generateFromCheck({
      elderId: 'e1',
      checkId: 'ck1',
      medId: 'md1',
      condition: 'suspected_missed',
      stockObserved: 3,
      photoIds: ['ph1'],
    });
    expect(o).not.toBeNull();
    expect(o!.type).toBe('missed_dose');
    expect(o!.severity).toBe('warning');
    expect(o!.content).toContain('苯磺酸氨氯地平片');
    // 建议措辞不出现诊断结论
    expect(o!.suggestion).not.toMatch(/高血压|糖尿病|确诊/);
  });

  it('疑似混药生成 critical 级观察记录', () => {
    const o = service.generateFromCheck({
      elderId: 'e1',
      checkId: 'ck1',
      medId: 'md2',
      condition: 'suspected_mixed',
      stockObserved: 18,
      photoIds: [],
    });
    expect(o!.type).toBe('mixed_pills');
    expect(o!.severity).toBe('critical');
  });

  it('正常状态不生成观察记录', () => {
    const o = service.generateFromCheck({
      elderId: 'e1',
      checkId: 'ck1',
      medId: 'md1',
      condition: 'normal',
      stockObserved: 5,
      photoIds: [],
    });
    expect(o).toBeNull();
  });
});
