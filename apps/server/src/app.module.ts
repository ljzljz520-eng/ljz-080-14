import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ChecksModule } from './checks/checks.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EldersModule } from './elders/elders.module.js';
import { FamilyModule } from './family/family.module.js';
import { MediaModule } from './media/media.module.js';
import { MedsModule } from './meds/meds.module.js';
import { ObservationsModule } from './observations/observations.module.js';
import { RemindersModule } from './reminders/reminders.module.js';

@Module({
  imports: [
    DatabaseModule,
    EldersModule,
    MedsModule,
    RemindersModule,
    MediaModule,
    ChecksModule,
    ObservationsModule,
    FamilyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
