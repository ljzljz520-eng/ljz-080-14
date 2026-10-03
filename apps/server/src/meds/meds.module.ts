import { Module } from '@nestjs/common';
import { MedsController } from './meds.controller.js';
import { MedsService } from './meds.service.js';

@Module({
  controllers: [MedsController],
  providers: [MedsService],
  exports: [MedsService],
})
export class MedsModule {}
