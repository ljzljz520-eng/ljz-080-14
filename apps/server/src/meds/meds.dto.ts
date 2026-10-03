import { BuyerChannel, MedCategory } from '../database/types.js';

export class CreateMedDto {
  elderId!: string;
  name!: string;
  category!: MedCategory;
  dosageText!: string;
  scheduleText!: string;
  dosesPerDay!: number;
  stockDoses!: number;
  thresholdDays!: number;
  nextVisitDate!: string;
  buyerChannel!: BuyerChannel;
  buyerName!: string;
  buyerLeadDays!: number;
  buyerNote?: string;
}

export class UpdateStockDto {
  stockDoses!: number;
}

export class UpdateMedDto extends CreateMedDto {}
