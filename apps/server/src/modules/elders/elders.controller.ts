import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import { RemindersService } from '../reminders/reminders.service';

@Controller('elders')
export class EldersController {
  constructor(
    private readonly store: DataStore,
    private readonly reminders: RemindersService,
  ) {}

  /** 老人列表（含用药计划与消耗概览） */
  @Get()
  list() {
    return this.store.elders.map((elder) => ({
      ...elder,
      plans: this.store.plansOfElder(elder.id).map((plan) => ({
        ...plan,
        stock: this.reminders.summarizePlan(plan),
      })),
    }));
  }

  /** 老人详情：用药计划 + 核查记录 + 观察记录（管理端全量） */
  @Get(':id')
  detail(@Param('id') id: string) {
    const elder = this.store.findElder(id);
    if (!elder) throw new NotFoundException('老人不存在');
    return {
      ...elder,
      plans: this.store.plansOfElder(id).map((plan) => ({
        ...plan,
        stock: this.reminders.summarizePlan(plan),
      })),
      checks: this.store.checksOfElder(id),
      observations: this.store.observationsOfElder(id),
      reminders: this.reminders.listForElder(id),
    };
  }
}
