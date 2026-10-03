import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
} from '@nestjs/common';
import { StoreService } from '../database/store.service.js';
import { CheckCondition } from '../database/types.js';
import { FAMILY_OBSERVATION_TITLE } from '../observations/observations.types.js';
import { RemindersService } from '../reminders/reminders.service.js';

interface RoleRequest {
  headers: Record<string, string | undefined>;
}

/** 家属端状态中性文案（不含任何诊断性结论） */
const FAMILY_CONDITION_LABEL: Record<CheckCondition, string> = {
  normal: '药盒状态正常',
  suspected_missed: '服药提醒关注',
  suspected_mixed: '药盒需要整理',
  low_stock: '药盒数量已核对',
};

@Controller('family')
export class FamilyController {
  constructor(
    private store: StoreService,
    private reminders: RemindersService,
  ) {}

  /** 家属身份解析（演示：x-user-id 即家属联系人 id） */
  private resolveFamilyId(req: RoleRequest): string {
    const role = req.headers['x-user-role'];
    const id = req.headers['x-user-id'];
    if (role !== 'family' || !id) {
      throw new ForbiddenException('请选择家属身份');
    }
    return id;
  }

  private assertFamily(elderId: string, familyId: string) {
    const elder = this.store.getElder(elderId);
    if (!elder.family.some((f) => f.id === familyId)) {
      throw new ForbiddenException('仅可查看已关联老人的信息');
    }
    return elder;
  }

  /** 家属首页：关联的老人 + 待办数量 */
  @Get('elders')
  elders(@Req() req: RoleRequest) {
    const familyId = this.resolveFamilyId(req);
    return this.store
      .listElders()
      .filter((e) => e.family.some((f) => f.id === familyId))
      .map((e) => {
        const reminderItems = this.reminders.listForFamily(e.id);
        const obs = this.store
          .listObservations(e.id)
          .filter((o) => o.severity !== 'info' || !o.acknowledged);
        return {
          id: e.id,
          name: e.name,
          roomNo: e.roomNo,
          address: e.address,
          reminderCount: reminderItems.length,
          attentionCount: obs.filter((o) => o.severity === 'critical').length,
          latestReminder: reminderItems[0] ?? null,
        };
      });
  }

  /** 1) 补药提醒（安全视图） */
  @Get('elders/:id/reminders')
  listReminders(@Req() req: RoleRequest, @Param('id') id: string) {
    const familyId = this.resolveFamilyId(req);
    this.assertFamily(id, familyId);
    return {
      generatedAt: new Date().toISOString(),
      notice: '以下为用药安排与购药提醒，具体诊疗请以复诊医生意见为准。',
      items: this.reminders.listForFamily(id),
    };
  }

  /** 2) 健康观察 -> 家属端仅展示中性标题、照片和下一步建议 */
  @Get('elders/:id/observations')
  observations(@Req() req: RoleRequest, @Param('id') id: string) {
    const familyId = this.resolveFamilyId(req);
    this.assertFamily(id, familyId);
    return this.store.listObservations(id).map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      title: FAMILY_OBSERVATION_TITLE[o.type],
      needAttention: o.severity === 'critical',
      // 仅返回“下一步建议”，不返回观察详情/类型/诊断措辞
      nextStep: o.suggestion,
      photos: this.store.getPhotos(o.photoIds).map((p) => ({
        id: p.id,
        dataUrl: p.dataUrl,
        label: p.label,
        createdAt: p.createdAt,
      })),
    }));
  }

  /** 3) 护工上门药盒照片时间线（只含中性状态文案） */
  @Get('elders/:id/photos')
  photoTimeline(@Req() req: RoleRequest, @Param('id') id: string) {
    const familyId = this.resolveFamilyId(req);
    this.assertFamily(id, familyId);
    return this.store.listChecks(id).map((c) => ({
      checkId: c.id,
      visitAt: c.visitAt,
      caregiverName: c.caregiverName,
      photos: this.store.getPhotos(c.photoIds).map((p) => ({
        id: p.id,
        dataUrl: p.dataUrl,
        label: p.label,
        createdAt: p.createdAt,
      })),
      medStatus: c.items.map((it) => ({
        medName: this.store.getMed(it.medId).name,
        statusText: FAMILY_CONDITION_LABEL[it.condition],
        normal: it.condition === 'normal',
      })),
    }));
  }
}
