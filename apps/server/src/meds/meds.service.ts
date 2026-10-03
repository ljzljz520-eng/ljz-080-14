import { BadRequestException, Injectable } from '@nestjs/common';
import { StoreService } from '../database/store.service.js';
import { BuyerChannel, MedCategory, Medication } from '../database/types.js';
import { nowISO, uid } from '../common/util.js';
import { CreateMedDto, UpdateMedDto } from './meds.dto.js';

const CATEGORIES: MedCategory[] = ['hypertension', 'diabetes', 'other_chronic'];
const CHANNELS: BuyerChannel[] = ['family', 'pharmacy', 'online'];

@Injectable()
export class MedsService {
  constructor(private store: StoreService) {}

  create(dto: CreateMedDto): Medication {
    if (!dto.elderId || !dto.name?.trim()) {
      throw new BadRequestException('老人与药品名称必填');
    }
    if (!CATEGORIES.includes(dto.category)) {
      throw new BadRequestException('慢病分类不合法');
    }
    if (!CHANNELS.includes(dto.buyerChannel)) {
      throw new BadRequestException('代买渠道不合法');
    }
    if (dto.dosesPerDay <= 0) {
      throw new BadRequestException('每日剂量需大于 0');
    }
    this.store.getElder(dto.elderId);

    const med: Medication = {
      id: uid('md'),
      elderId: dto.elderId,
      name: dto.name.trim(),
      category: dto.category,
      dosageText: dto.dosageText?.trim() ?? '',
      scheduleText: dto.scheduleText?.trim() ?? '',
      dosesPerDay: Number(dto.dosesPerDay),
      stockDoses: Math.max(0, Number(dto.stockDoses)),
      thresholdDays: Number(dto.thresholdDays) || 7,
      nextVisitDate: dto.nextVisitDate,
      buyerChannel: dto.buyerChannel,
      buyerName: dto.buyerName?.trim() ?? '',
      buyerLeadDays: Math.max(0, Number(dto.buyerLeadDays) || 0),
      buyerNote: dto.buyerNote?.trim() ?? '',
      status: 'active',
      createdAt: nowISO(),
    };
    return this.store.addMed(med);
  }

  /** 补药/清点后回写药盒余量 */
  updateStock(id: string, stockDoses: number): Medication {
    if (stockDoses < 0) throw new BadRequestException('余量不能为负');
    return this.store.updateMed(id, { stockDoses });
  }

  update(id: string, dto: UpdateMedDto): Medication {
    this.store.getMed(id);
    this.store.getElder(dto.elderId);
    return this.store.updateMed(id, {
      name: dto.name.trim(),
      category: dto.category,
      dosageText: dto.dosageText.trim(),
      scheduleText: dto.scheduleText.trim(),
      dosesPerDay: Number(dto.dosesPerDay),
      stockDoses: Math.max(0, Number(dto.stockDoses)),
      thresholdDays: Number(dto.thresholdDays) || 7,
      nextVisitDate: dto.nextVisitDate,
      buyerChannel: dto.buyerChannel,
      buyerName: dto.buyerName.trim(),
      buyerLeadDays: Math.max(0, Number(dto.buyerLeadDays) || 0),
      buyerNote: dto.buyerNote?.trim() ?? '',
    });
  }
}
