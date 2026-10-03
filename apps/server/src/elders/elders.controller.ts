import { Controller, Get, Param } from '@nestjs/common';
import { StoreService } from '../database/store.service.js';

@Controller('elders')
export class EldersController {
  constructor(private store: StoreService) {}

  @Get()
  list() {
    return this.store.listElders().map((e) => ({
      id: e.id,
      name: e.name,
      age: e.age,
      gender: e.gender,
      address: e.address,
      roomNo: e.roomNo,
      caregiverIds: e.caregiverIds,
      family: e.family,
      primaryFamilyId: e.primaryFamilyId,
    }));
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    const e = this.store.getElder(id);
    const caregivers = e.caregiverIds.map((cid) =>
      this.store.getCaregiver(cid),
    );
    return { ...e, caregivers };
  }
}
