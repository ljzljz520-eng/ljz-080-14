import { Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module';
import { EldersController } from './elders.controller';

@Module({
  imports: [RemindersModule],
  controllers: [EldersController],
})
export class EldersModule {}
