import { ObservationType, Severity } from '../database/types.js';

export const OBSERVATION_META: Record<
  ObservationType,
  {
    severity: Severity;
    internalTitle: string;
    contentTpl: string;
    suggestion: string;
  }
> = {
  missed_dose: {
    severity: 'warning',
    internalTitle: '疑似漏服',
    contentTpl: '现场清点「{med}」发现药盒剩余剂数与服药计划不符，存在漏服迹象',
    suggestion:
      '建议今天起按药盒标注时间服药，可在手机上设置早晚两次闹钟提醒；家属可在方便时电话确认服药情况。如老人有头晕、心慌等不舒服，请联系社区医生。',
  },
  mixed_pills: {
    severity: 'critical',
    internalTitle: '疑似混药',
    contentTpl:
      '药盒「{med}」格内发现外观不一致的药片，存在与其他药品混放的可能',
    suggestion:
      '建议暂停从该格取药，把药盒原样保留并拍照；护工已联系管家协助整理分格，家属暂不要自行挪动药片，整理完成后会同步照片。',
  },
  abnormal_stock: {
    severity: 'info',
    internalTitle: '余量异常',
    contentTpl: '「{med}」实际余量与系统记录不一致（现场数 {actual} 剂）',
    suggestion:
      '已按现场清点数量更新药盒余量，系统会重新计算补药提醒时间，家属留意后续补药通知即可。',
  },
};

/** 家属端中性标题（避免诊断性表述） */
export const FAMILY_OBSERVATION_TITLE: Record<ObservationType, string> = {
  missed_dose: '服药提醒关注',
  mixed_pills: '药盒需要整理',
  abnormal_stock: '药盒数量已核对',
};
