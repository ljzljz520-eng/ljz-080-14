import { CheckCondition } from '../database/types.js';

export class CheckItemDto {
  medId!: string;
  condition!: CheckCondition;
  stockObserved!: number;
  note?: string;
}

export class CreateCheckDto {
  elderId!: string;
  photoIds!: string[];
  summary!: string;
  items!: CheckItemDto[];
}
