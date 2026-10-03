import { Module } from '@nestjs/common';
import { EldersController } from './elders.controller.js';

@Module({
  controllers: [EldersController],
})
export class EldersModule {}
