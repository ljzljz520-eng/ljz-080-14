import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { RegisterMedicationDto } from './dto/register-medication.dto';
import { MedicationsService } from './medications.service';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  /** 管家登记长期用药 */
  @Post()
  register(@Body() dto: RegisterMedicationDto) {
    return this.medications.register(dto);
  }

  /** 停用用药计划 */
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.medications.deactivate(id);
  }
}
