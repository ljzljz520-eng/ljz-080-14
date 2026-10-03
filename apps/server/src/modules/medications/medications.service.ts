import { BadRequestException, Injectable } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import { MedicationPlan } from '../../common/types';
import { RegisterMedicationDto } from './dto/register-medication.dto';

@Injectable()
export class MedicationsService {
  constructor(private readonly store: DataStore) {}

  /** 管家为老人登记长期用药 */
  register(dto: RegisterMedicationDto): MedicationPlan {
    const elder = this.store.findElder(dto.elderId);
    if (!elder) throw new BadRequestException('老人不存在');
    if (!dto.medicineName?.trim()) {
      throw new BadRequestException('药品名称不能为空');
    }
    if (dto.dosagePerIntake <= 0 || dto.timesPerDay <= 0) {
      throw new BadRequestException('用量必须大于 0');
    }
    if (dto.remainingQty > dto.boxCapacity) {
      throw new BadRequestException('药盒余量不能超过药盒容量');
    }
    const plan: MedicationPlan = {
      id: this.store.nextId('plan'),
      elderId: dto.elderId,
      medicineName: dto.medicineName.trim(),
      condition: dto.condition,
      unit: dto.unit || '片',
      dosagePerIntake: dto.dosagePerIntake,
      timesPerDay: dto.timesPerDay,
      boxCapacity: dto.boxCapacity,
      remainingQty: dto.remainingQty,
      nextVisitDate: dto.nextVisitDate,
      purchaseHabit: dto.purchaseHabit,
      registeredBy: dto.registeredBy,
      createdAt: new Date().toISOString(),
      active: true,
    };
    this.store.medicationPlans.push(plan);
    return plan;
  }

  /** 停用用药计划（停药/方案调整） */
  deactivate(id: string): MedicationPlan | undefined {
    const plan = this.store.findPlan(id);
    if (plan) plan.active = false;
    return plan;
  }
}
