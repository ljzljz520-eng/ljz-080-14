import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { StoreService } from '../database/store.service.js';
import { CreateMedDto, UpdateMedDto, UpdateStockDto } from './meds.dto.js';
import { MedsService } from './meds.service.js';

const CATEGORY_LABEL: Record<string, string> = {
  hypertension: '高血压用药',
  diabetes: '糖尿病用药',
  other_chronic: '其他长期用药',
};

@Controller('meds')
export class MedsController {
  constructor(
    private store: StoreService,
    private meds: MedsService,
  ) {}

  /** 内部接口：管家/护工可见慢病分类 */
  @Get()
  list(@Query('elderId') elderId?: string) {
    return this.store.listMeds(elderId).map((m) => ({
      ...m,
      categoryLabel: CATEGORY_LABEL[m.category],
    }));
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    const m = this.store.getMed(id);
    return { ...m, categoryLabel: CATEGORY_LABEL[m.category] };
  }

  @Post()
  @Roles('manager')
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateMedDto) {
    return this.meds.create(dto);
  }

  @Put(':id')
  @Roles('manager')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateMedDto) {
    return this.meds.update(id, dto);
  }

  /** 补药完成：回写新余量 */
  @Patch(':id/stock')
  @Roles('manager', 'caregiver')
  @UseGuards(RolesGuard)
  updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.meds.updateStock(id, Number(dto.stockDoses));
  }
}
