import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../../common/data.store';
import { RemindersService } from '../reminders/reminders.service';

/**
 * 家属端聚合视图。
 * 隐私边界：不输出任何医疗诊断结论（慢病标签、内部医学描述、
 * 异常类型明细等），仅展示提醒、照片与下一步建议。
 */
@Injectable()
export class FamilyService {
  constructor(
    private readonly store: DataStore,
    private readonly reminders: RemindersService,
  ) {}

  overview(elderId: string) {
    const elder = this.store.findElder(elderId);
    if (!elder) throw new NotFoundException('老人不存在');

    // 用药概览：只保留生活化信息，不含诊断结论
    const medications = this.store.plansOfElder(elderId).map((plan) => {
      const stock = this.reminders.summarizePlan(plan);
      return {
        planId: plan.id,
        medicineName: plan.medicineName,
        unit: plan.unit,
        daysLeft: stock.daysLeft === Infinity ? null : stock.daysLeft,
        nextVisitDate: plan.nextVisitDate,
      };
    });

    // 补药提醒（message/suggestion 均为非诊断文案）
    const reminders = this.reminders.listForElder(elderId).map((r) => ({
      id: r.id,
      type: r.type,
      level: r.level,
      title: r.title,
      message: r.message,
      suggestion: r.suggestion,
      suggestDate: r.suggestDate,
      status: r.status,
    }));

    // 上门动态：照片 + 温和结果 + 下一步建议（不暴露观察记录的医学描述）
    const visits = this.store.checksOfElder(elderId).map((check) => {
      const obs = this.store.observations.find((o) => o.checkId === check.id);
      return {
        id: check.id,
        checkedAt: check.checkedAt,
        caregiverName: check.caregiverName,
        photoUrl: check.photoUrl,
        result: check.issueType === 'none' ? 'normal' : 'attention',
        resultText:
          check.issueType === 'none'
            ? '本次药盒核查一切正常'
            : '本次核查有需要家人配合关注的地方',
        suggestion: obs ? obs.familySuggestion : null,
      };
    });

    return {
      elder: {
        id: elder.id,
        name: elder.name,
        age: elder.age,
        address: elder.address,
      },
      medications,
      reminders,
      visits,
    };
  }

  /** 家属确认“已购买” → 提醒完成并回写药盒余量 */
  markReminderDone(reminderId: string) {
    const reminder = this.reminders.setStatus(reminderId, 'done');
    if (!reminder) throw new NotFoundException('提醒不存在');
    return reminder;
  }
}
