import { Controller, Get, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
export class RemindersController {
  constructor(private reminders: RemindersService) {}

  /** 管家端：全部待处理补药提醒 */
  @Get()
  all() {
    const items = this.reminders.listAll();
    return {
      generatedAt: new Date().toISOString(),
      total: items.length,
      critical: items.filter((i) => i.urgency === 'critical').length,
      warning: items.filter((i) => i.urgency === 'warning').length,
      items,
    };
  }

  /** 管家端：某位老人的药盒评估（含正常） */
  @Get('by-elder')
  byElder(@Query('elderId') elderId: string) {
    return this.reminders.listByElder(elderId);
  }
}
