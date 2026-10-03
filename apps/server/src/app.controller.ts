import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataStore } from './common/data.store';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly store: DataStore,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** 员工列表（管家/护工），用于表单选择 */
  @Get('staff')
  staff() {
    return this.store.staff;
  }
}
