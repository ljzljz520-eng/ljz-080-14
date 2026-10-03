import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { uid } from '../common/util.js';
import { StoreService } from '../database/store.service.js';

class UploadDto {
  dataUrl!: string;
  label?: string;
}

@Controller('media')
export class MediaController {
  constructor(private store: StoreService) {}

  /**
   * 护工上门拍照上传（演示环境保存 base64 dataURL；
   * 生产环境应上传至 Supabase Storage 并回写公开 URL）。
   */
  @Post('photos')
  @Roles('caregiver')
  @UseGuards(RolesGuard)
  upload(@Body() dto: UploadDto) {
    if (!dto.dataUrl || !dto.dataUrl.startsWith('data:image/')) {
      throw new BadRequestException('请上传图片（dataUrl）');
    }
    const photo = this.store.addPhoto({
      id: uid('ph'),
      dataUrl: dto.dataUrl,
      label: dto.label ?? '药盒照片',
      createdAt: new Date().toISOString(),
    });
    return { id: photo.id, label: photo.label, createdAt: photo.createdAt };
  }
}
