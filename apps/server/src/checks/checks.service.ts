import { BadRequestException, Injectable } from '@nestjs/common';
import { StoreService } from '../database/store.service.js';
import { CheckCondition, MedCheck, MedCheckItem } from '../database/types.js';
import { nowISO, uid } from '../common/util.js';
import { ObservationsService } from '../observations/observations.service.js';
import { CreateCheckDto } from './checks.dto.js';

const VALID: CheckCondition[] = [
  'normal',
  'suspected_missed',
  'suspected_mixed',
  'low_stock',
];

@Injectable()
export class ChecksService {
  constructor(
    private store: StoreService,
    private observations: ObservationsService,
  ) {}

  create(
    dto: CreateCheckDto,
    caregiverId: string,
  ): { check: MedCheck; observationIds: string[] } {
    if (!dto.elderId || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('请至少核查一种药');
    }
    for (const item of dto.items) {
      if (!VALID.includes(item.condition)) {
        throw new BadRequestException('药盒状态不合法');
      }
      if (item.stockObserved < 0) {
        throw new BadRequestException('清点余量不能为负');
      }
    }

    const elder = this.store.getElder(dto.elderId);
    const caregiver = caregiverId
      ? this.store.getCaregiver(caregiverId)
      : { id: 'c1', name: '李护工' };
    void elder;

    const checkId = uid('ck');
    const items: MedCheckItem[] = dto.items.map((i) => ({
      medId: i.medId,
      condition: i.condition,
      stockObserved: Number(i.stockObserved),
      note: i.note?.trim() ?? '',
    }));

    const check: MedCheck = {
      id: checkId,
      elderId: dto.elderId,
      caregiverId: caregiver.id,
      caregiverName: caregiver.name,
      visitAt: nowISO(),
      photoIds: dto.photoIds ?? [],
      items,
      summary: dto.summary?.trim() ?? '',
      generatedObservationIds: [],
    };

    // 发现漏服 / 混药 / 余量异常 -> 生成健康观察记录，并按现场清点回写实收余量
    const observationIds: string[] = [];
    for (const item of items) {
      const created = this.observations.generateFromCheck({
        elderId: dto.elderId,
        checkId,
        medId: item.medId,
        condition: item.condition,
        stockObserved: item.stockObserved,
        photoIds: check.photoIds,
      });
      if (created) observationIds.push(created.id);

      // 以护工现场清点数量为准回写药盒余量
      this.store.updateMed(item.medId, {
        stockDoses: item.stockObserved,
      });
    }
    check.generatedObservationIds = observationIds;
    this.store.addCheck(check);

    return { check, observationIds };
  }
}
