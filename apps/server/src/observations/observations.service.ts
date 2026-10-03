import { Injectable } from '@nestjs/common';
import { StoreService } from '../database/store.service.js';
import {
  CheckCondition,
  HealthObservation,
  ObservationType,
} from '../database/types.js';
import { nowISO, uid } from '../common/util.js';
import { OBSERVATION_META } from './observations.types.js';

const CONDITION_TYPE: Partial<Record<CheckCondition, ObservationType>> = {
  suspected_missed: 'missed_dose',
  suspected_mixed: 'mixed_pills',
  low_stock: 'abnormal_stock',
};

@Injectable()
export class ObservationsService {
  constructor(private store: StoreService) {}

  /**
   * 根据护工核查结果生成健康观察记录。
   * 漏服 / 混药 / 余量异常 分别生成一条内部观察记录。
   */
  generateFromCheck(params: {
    elderId: string;
    checkId: string;
    medId: string;
    condition: CheckCondition;
    stockObserved: number;
    photoIds: string[];
  }): HealthObservation | null {
    const type = CONDITION_TYPE[params.condition];
    if (!type) return null;

    const med = this.store.getMed(params.medId);
    const meta = OBSERVATION_META[type];
    const observation: HealthObservation = {
      id: uid('ob'),
      elderId: params.elderId,
      checkId: params.checkId,
      type,
      severity: meta.severity,
      content: meta.contentTpl
        .replace('{med}', med.name)
        .replace('{actual}', String(params.stockObserved)),
      suggestion: meta.suggestion,
      photoIds: params.photoIds,
      createdAt: nowISO(),
      acknowledged: false,
    };
    return this.store.addObservation(observation);
  }

  acknowledge(id: string) {
    return this.store.acknowledgeObservation(id);
  }
}
