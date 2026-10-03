import { Injectable, NotFoundException } from '@nestjs/common';
import {
  caregivers,
  elders,
  managers,
  medChecks,
  medications,
  observations,
} from './seed.js';
import {
  Caregiver,
  Elder,
  HealthObservation,
  MedCheck,
  Medication,
  Photo,
} from './types.js';

/**
 * 内存数据仓储：真实环境替换为 Supabase 表访问
 * (elders / medications / med_checks / health_observations / photos)。
 * 保持接口形状不变即可切换。
 */
@Injectable()
export class StoreService {
  private elders: Elder[] = elders;
  private medications: Medication[] = medications;
  private checks: MedCheck[] = medChecks;
  private observations: HealthObservation[] = observations;
  private photos: Photo[] = [];
  private manager = managers;
  private caregiverList = caregivers;

  // ---- elders / staff ----
  listElders(): Elder[] {
    return this.elders;
  }

  getElder(id: string): Elder {
    const elder = this.elders.find((e) => e.id === id);
    if (!elder) throw new NotFoundException('未找到老人档案');
    return elder;
  }

  getCaregiver(id: string): Caregiver {
    const c = this.caregiverList.find((x) => x.id === id);
    if (!c) throw new NotFoundException('未找到护工');
    return c;
  }

  listCaregivers(): Caregiver[] {
    return this.caregiverList;
  }

  getManagerName(id: string): string {
    return this.manager.find((m) => m.id === id)?.name ?? '管家';
  }

  // ---- medications ----
  listMeds(elderId?: string): Medication[] {
    return elderId
      ? this.medications.filter((m) => m.elderId === elderId)
      : [...this.medications];
  }

  getMed(id: string): Medication {
    const med = this.medications.find((m) => m.id === id);
    if (!med) throw new NotFoundException('未找到用药记录');
    return med;
  }

  addMed(med: Medication): Medication {
    this.medications.push(med);
    return med;
  }

  updateMed(id: string, patch: Partial<Medication>): Medication {
    const med = this.getMed(id);
    Object.assign(med, patch);
    return med;
  }

  // ---- checks ----
  listChecks(elderId?: string): MedCheck[] {
    const sorted = [...this.checks].sort((a, b) =>
      b.visitAt.localeCompare(a.visitAt),
    );
    return elderId ? sorted.filter((c) => c.elderId === elderId) : sorted;
  }

  addCheck(check: MedCheck): MedCheck {
    this.checks.push(check);
    return check;
  }

  // ---- observations ----
  listObservations(elderId?: string): HealthObservation[] {
    const sorted = [...this.observations].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    return elderId ? sorted.filter((o) => o.elderId === elderId) : sorted;
  }

  addObservation(o: HealthObservation): HealthObservation {
    this.observations.push(o);
    return o;
  }

  acknowledgeObservation(id: string): HealthObservation {
    const o = this.observations.find((x) => x.id === id);
    if (!o) throw new NotFoundException('未找到观察记录');
    o.acknowledged = true;
    return o;
  }

  // ---- photos ----
  addPhoto(photo: Photo): Photo {
    this.photos.push(photo);
    return photo;
  }

  getPhotos(ids: string[]): Photo[] {
    return ids
      .map((id) => this.photos.find((p) => p.id === id))
      .filter((p): p is Photo => !!p);
  }
}
