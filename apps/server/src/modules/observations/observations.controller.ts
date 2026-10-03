import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import type { ObservationStatus } from '../../common/types';

@Controller('observations')
export class ObservationsController {
  constructor(private readonly store: DataStore) {}

  /** 健康观察记录列表（管理端，含内部医学描述） */
  @Get()
  list(
    @Query('elderId') elderId?: string,
    @Query('status') status?: ObservationStatus,
  ) {
    const all = elderId
      ? this.store.observationsOfElder(elderId)
      : [...this.store.observations].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
    return all.filter((o) => !status || o.status === status);
  }

  /** 跟进状态流转：open → following → resolved */
  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body() body: { status: ObservationStatus },
  ) {
    const obs = this.store.observations.find((o) => o.id === id);
    if (obs) obs.status = body.status;
    return obs;
  }
}
