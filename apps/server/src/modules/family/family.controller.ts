import { Controller, Get, Param, Post } from '@nestjs/common';
import { FamilyService } from './family.service';

@Controller('family')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  /** 家属端首页聚合数据（已脱敏：无医疗诊断结论） */
  @Get(':elderId/overview')
  overview(@Param('elderId') elderId: string) {
    return this.family.overview(elderId);
  }

  /** 家属标记补药提醒为“已购买” */
  @Post('reminders/:id/done')
  markDone(@Param('id') id: string) {
    return this.family.markReminderDone(id);
  }
}
