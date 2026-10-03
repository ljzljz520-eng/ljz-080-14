import { DataStore } from '../../common/data.store';
import { pillboxPhoto } from '../../common/seed';
import { ChecksService } from './checks.service';

describe('ChecksService 上门药盒核查', () => {
  let store: DataStore;
  let service: ChecksService;

  beforeEach(() => {
    store = new DataStore();
    service = new ChecksService(store);
  });

  const baseDto = {
    elderId: 'elder-1',
    caregiverId: 'cg-1',
    photoUrl: pillboxPhoto('#999', '测试'),
    remainingQty: 10,
    planId: 'plan-1',
  };

  it('正常核查不生成健康观察记录', () => {
    const before = store.observations.length;
    const { observation } = service.create({ ...baseDto, issueType: 'none' });
    expect(observation).toBeUndefined();
    expect(store.observations.length).toBe(before);
  });

  it('发现漏服时自动生成健康观察记录并回写药盒余量', () => {
    const { check, observation } = service.create({
      ...baseDto,
      issueType: 'missed_dose',
      issueNote: '早格剩余两片',
    });
    expect(observation).toBeDefined();
    expect(observation!.type).toBe('missed_dose');
    expect(observation!.checkId).toBe(check.id);
    expect(observation!.clinicalNote).toContain('早格剩余两片');
    expect(observation!.familySuggestion).toContain('提醒');
    // 余量回写
    expect(store.findPlan('plan-1')!.remainingQty).toBe(10);
  });

  it('发现混药时生成 high 严重度观察记录', () => {
    const { observation } = service.create({
      ...baseDto,
      issueType: 'mixed_meds',
    });
    expect(observation!.severity).toBe('high');
    expect(observation!.status).toBe('open');
  });

  it('缺少照片时拒绝提交', () => {
    expect(() =>
      service.create({ ...baseDto, photoUrl: '', issueType: 'none' }),
    ).toThrow('请上传药盒照片');
  });
});
