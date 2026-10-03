import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('慢病药盒管理 (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('补药提醒按余量/复诊/代买习惯生成', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/reminders')
      .expect(200);
    const types = new Set(res.body.map((r: { type: string }) => r.type));
    expect(types.has('low_stock')).toBe(true);
    expect(types.has('visit_due')).toBe(true);
    expect(types.has('purchase_cycle')).toBe(true);
  });

  it('护工核查发现漏服时自动生成健康观察记录', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/checks')
      .send({
        elderId: 'elder-1',
        caregiverId: 'cg-1',
        photoUrl: 'data:image/svg+xml;utf8,<svg/>',
        remainingQty: 8,
        issueType: 'missed_dose',
        issueNote: '早格剩余',
        planId: 'plan-1',
      })
      .expect(201);
    expect(res.body.observation).toBeDefined();
    expect(res.body.observation.type).toBe('missed_dose');
    expect(res.body.observation.familySuggestion).toBeTruthy();
  });

  it('家属端视图不包含医疗诊断结论', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/family/elder-1/overview')
      .expect(200);
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('clinicalNote');
    expect(raw).not.toContain('severity');
    expect(raw).not.toContain('conditions');
    expect(res.body.reminders.length).toBeGreaterThan(0);
    expect(res.body.visits[0].photoUrl).toContain('data:image');
  });
});
