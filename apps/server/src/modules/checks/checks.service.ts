import { BadRequestException, Injectable } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import {
  CheckIssueType,
  HealthObservation,
  PillboxCheck,
} from '../../common/types';
import { CreateCheckDto } from './dto/create-check.dto';

/** 异常类型对应的观察记录文案模板 */
const OBSERVATION_TEMPLATES: Record<
  Exclude<CheckIssueType, 'none'>,
  {
    severity: 'low' | 'medium' | 'high';
    clinicalNote: (note: string) => string;
    familySuggestion: string;
  }
> = {
  missed_dose: {
    severity: 'medium',
    clinicalNote: (note) =>
      `上门核查发现漏服：${note || '药盒内剩余药片与应服数量不符'}。长期漏服可能影响慢病控制效果，建议随访评估。`,
    familySuggestion:
      '发现老人有漏服药物的情况，建议家属每日固定时间电话提醒，并把药盒放在餐桌等显眼位置。',
  },
  mixed_meds: {
    severity: 'high',
    clinicalNote: (note) =>
      `上门核查发现混药：${note || '不同药品混放于同一药格'}。存在重复用药及相互作用风险，需药师复核用药方案。`,
    familySuggestion:
      '发现药盒中混放了不同药品，建议家属协助按“早/中/晚”分格存放，新增药品前先咨询医生或药师。',
  },
};

@Injectable()
export class ChecksService {
  constructor(private readonly store: DataStore) {}

  /**
   * 护工上门拍照核查药盒：
   *  1. 保存核查记录（照片 + 清点余量）
   *  2. 回写用药计划余量
   *  3. 发现漏服/混药时自动生成健康观察记录
   */
  create(dto: CreateCheckDto): {
    check: PillboxCheck;
    observation?: HealthObservation;
  } {
    const elder = this.store.findElder(dto.elderId);
    if (!elder) throw new BadRequestException('老人不存在');
    const caregiver = this.store.staff.find((s) => s.id === dto.caregiverId);
    if (!caregiver) throw new BadRequestException('护工不存在');
    if (!dto.photoUrl) throw new BadRequestException('请上传药盒照片');
    if (dto.remainingQty < 0) throw new BadRequestException('余量不能为负数');

    const check: PillboxCheck = {
      id: this.store.nextId('check'),
      elderId: dto.elderId,
      caregiverId: caregiver.id,
      caregiverName: caregiver.name,
      checkedAt: new Date().toISOString(),
      photoUrl: dto.photoUrl,
      remainingQty: dto.remainingQty,
      issueType: dto.issueType,
      issueNote: dto.issueNote?.trim() ?? '',
    };
    this.store.checks.push(check);

    // 回写药盒余量，供补药提醒重新计算
    if (dto.planId) {
      const plan = this.store.findPlan(dto.planId);
      if (plan) plan.remainingQty = dto.remainingQty;
    }

    // 漏服/混药 → 自动生成健康观察记录
    let observation: HealthObservation | undefined;
    if (dto.issueType !== 'none') {
      const template = OBSERVATION_TEMPLATES[dto.issueType];
      observation = {
        id: this.store.nextId('obs'),
        elderId: dto.elderId,
        checkId: check.id,
        type: dto.issueType,
        clinicalNote: template.clinicalNote(check.issueNote),
        familySuggestion: template.familySuggestion,
        severity: template.severity,
        status: 'open',
        createdBy: caregiver.id,
        createdAt: new Date().toISOString(),
      };
      this.store.observations.push(observation);
    }

    return { check, observation };
  }

  list(elderId?: string): PillboxCheck[] {
    const all = elderId ? this.store.checksOfElder(elderId) : this.store.checks;
    return [...all].sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
  }
}
