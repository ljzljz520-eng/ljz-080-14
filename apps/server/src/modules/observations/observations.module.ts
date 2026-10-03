import { Module } from '@nestjs/common';
import { ObservationsController } from './observations.controller';

@Module({
  controllers: [ObservationsController],
})
export class ObservationsModule {}
