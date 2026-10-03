import { Module } from '@nestjs/common';
import { RemindersModule } from '../reminders/reminders.module.js';
import { FamilyController } from './family.controller.js';

@Module({
  imports: [RemindersModule],
  controllers: [FamilyController],
})
export class FamilyModule {}
