import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChecksService } from './checks.service';
import { CreateCheckDto } from './dto/create-check.dto';

@Controller('checks')
export class ChecksController {
  constructor(private readonly checks: ChecksService) {}

  /** 护工提交上门药盒核查（拍照） */
  @Post()
  create(@Body() dto: CreateCheckDto) {
    return this.checks.create(dto);
  }

  /** 核查记录列表，支持 ?elderId= 过滤 */
  @Get()
  list(@Query('elderId') elderId?: string) {
    return this.checks.list(elderId);
  }
}
