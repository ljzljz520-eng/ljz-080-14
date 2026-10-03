import { ChronicCondition } from '../../../common/types';

/** 管家登记长期用药的入参 */
export class RegisterMedicationDto {
  elderId!: string;
  medicineName!: string;
  condition!: ChronicCondition;
  unit!: string;
  dosagePerIntake!: number;
  timesPerDay!: number;
  boxCapacity!: number;
  remainingQty!: number;
  nextVisitDate!: string; // 复诊日期 YYYY-MM-DD
  purchaseHabit!: {
    buyerName: string;
    channel: string;
    leadTimeDays: number;
    cycleDays: number;
    lastPurchaseAt: string;
  };
  registeredBy!: string; // 管家 id
}
