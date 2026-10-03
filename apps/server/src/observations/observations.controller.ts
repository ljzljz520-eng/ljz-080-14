import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { StoreService } from '../database/store.service.js';
import { OBSERVATION_META } from './observations.types.js';

/**
 * 健康观察记录（内部端：管家/护工）。
 * 含观察详情等内部信息；家属端请走 /family/* 安全视图。
 */
@Controller('observations')
export class ObservationsController {
  constructor(private store: StoreService) {}

  @Get()
  list(@Query('elderId') elderId?: string) {
    return this.store.listObservations(elderId).map((o) => {
      const elder = this.store.getElder(o.elderId);
      return {
        ...o,
        elderName: elder.name,
        typeLabel: OBSERVATION_META[o.type].internalTitle,
        photos: this.store.getPhotos(o.photoIds),
      };
    });
  }

  @Patch(':id/ack')
  @Roles('manager')
  @UseGuards(RolesGuard)
  acknowledge(@Param('id') id: string) {
    return this.store.acknowledgeObservation(id);
  }
}
