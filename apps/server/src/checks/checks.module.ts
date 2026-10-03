import { Module } from '@nestjs/common';
import { ChecksController } from './checks.controller.js';
import { ChecksService } from './checks.service.js';
import { ObservationsModule } from '../observations/observations.module.js';

@Module({
  imports: [ObservationsModule],
  controllers: [ChecksController],
  providers: [ChecksService],
})
export class ChecksModule {}
