import { Injectable } from '@nestjs/common';
import {
  seedChecks,
  seedElders,
  seedMedicationPlans,
  seedObservations,
  seedReminders,
  seedStaff,
} from './seed';
import {
  Caregiver,
  Elder,
  HealthObservation,
  MedicationPlan,
  PillboxCheck,
  RefillReminder,
} from './types';

/**
 * 内存数据仓库（演示环境）。
 * 生产环境可替换为 Supabase(Postgres) 实现，保持同样的接口。
 */
@Injectable()
export class DataStore {
  readonly staff: Caregiver[] = seedStaff();
  readonly elders: Elder[] = seedElders();
  readonly medicationPlans: MedicationPlan[] = seedMedicationPlans();
  readonly checks: PillboxCheck[] = seedChecks();
  readonly observations: HealthObservation[] = seedObservations();
  readonly reminders: RefillReminder[] = seedReminders();

  private seq = 1000;

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  findElder(id: string): Elder | undefined {
    return this.elders.find((e) => e.id === id);
  }

  plansOfElder(elderId: string): MedicationPlan[] {
    return this.medicationPlans.filter(
      (p) => p.elderId === elderId && p.active,
    );
  }

  findPlan(id: string): MedicationPlan | undefined {
    return this.medicationPlans.find((p) => p.id === id);
  }

  checksOfElder(elderId: string): PillboxCheck[] {
    return this.checks
      .filter((c) => c.elderId === elderId)
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  }

  observationsOfElder(elderId: string): HealthObservation[] {
    return this.observations
      .filter((o) => o.elderId === elderId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
