import { CheckIssueType } from '../../../common/types';

/** 护工上门药盒核查入参 */
export class CreateCheckDto {
  elderId!: string;
  caregiverId!: string;
  photoUrl!: string; // 药盒照片（base64 data URL）
  remainingQty!: number; // 清点后的药盒余量
  issueType!: CheckIssueType; // none / missed_dose / mixed_meds
  issueNote?: string;
  planId?: string; // 核查对应的主用药计划（用于回写余量）
}
