import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { StoreService } from '../database/store.service.js';
import { ChecksService } from './checks.service.js';
import type { Request } from 'express';
import { CreateCheckDto } from './checks.dto.js';

@Controller('checks')
export class ChecksController {
  constructor(
    private store: StoreService,
    private checks: ChecksService,
  ) {}

  /** 护工视角：待上门 / 已完成的核查记录（管家端同样可调） */
  @Get()
  list(@Query('elderId') elderId?: string) {
    return this.store.listChecks(elderId).map((c) => this.decorate(c));
  }

  @Post()
  @Roles('caregiver')
  @UseGuards(RolesGuard)
  create(@Req() req: Request, @Body() dto: CreateCheckDto) {
    const caregiverId = (req.headers['x-user-id'] as string | undefined) ?? '';
    const { check, observationIds } = this.checks.create(dto, caregiverId);
    return {
      ...this.decorate(check),
      generatedObservationIds: observationIds,
      alert:
        observationIds.length > 0
          ? `已生成 ${observationIds.length} 条健康观察记录，请管家跟进`
          : null,
    };
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    const c = this.store.listChecks().find((x) => x.id === id);
    if (!c) return null;
    return this.decorate(c);
  }

  private decorate(c: Awaited<ReturnType<StoreService['listChecks']>>[number]) {
    const elder = this.store.getElder(c.elderId);
    const photos = this.store.getPhotos(c.photoIds);
    const items = c.items.map((it) => {
      const med = this.store.getMed(it.medId);
      return {
        ...it,
        medName: med.name,
        dosageText: med.dosageText,
        scheduleText: med.scheduleText,
        category: med.category,
        conditionLabel:
          CONDITION_LABEL[it.condition as keyof typeof CONDITION_LABEL],
        hasIssue: it.condition !== 'normal',
      };
    });
    return { ...c, elderName: elder.name, photos, items };
  }
}

const CONDITION_LABEL = {
  normal: '正常',
  suspected_missed: '疑似漏服',
  suspected_mixed: '疑似混药',
  low_stock: '余量偏低/与记录不符',
};
