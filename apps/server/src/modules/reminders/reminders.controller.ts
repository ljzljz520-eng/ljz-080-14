import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import type { ReminderStatus } from '../../common/types';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  /** 补药提醒列表（管理端），支持 ?status=pending 过滤 */
  @Get()
  list(@Query('status') status?: ReminderStatus) {
    return this.reminders.listAll(status);
  }

  /** 更新提醒状态：done=已补药 / dismissed=忽略 */
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() body: { status: ReminderStatus }) {
    return this.reminders.setStatus(id, body.status);
  }
}
