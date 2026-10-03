import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { ChecksModule } from './modules/checks/checks.module';
import { EldersModule } from './modules/elders/elders.module';
import { FamilyModule } from './modules/family/family.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { RemindersModule } from './modules/reminders/reminders.module';

@Module({
  imports: [
    CommonModule,
    EldersModule,
    MedicationsModule,
    RemindersModule,
    ChecksModule,
    ObservationsModule,
    FamilyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
