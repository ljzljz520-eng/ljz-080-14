import { BuyerChannel } from '../database/types.js';

export const CHANNEL_LABEL: Record<BuyerChannel, string> = {
  family: '家属代买',
  pharmacy: '附近药房自购',
  online: '线上下单配送到家',
};

export function formatDate(iso: string): string {
  return iso.slice(5).replace('-', '月') + '日';
}

/** 补药数量文案 */
export function refillText(doses: number): string {
  return doses > 0 ? `约 ${doses} 剂（片/粒）` : '当前用量充足，暂不需要补药';
}
