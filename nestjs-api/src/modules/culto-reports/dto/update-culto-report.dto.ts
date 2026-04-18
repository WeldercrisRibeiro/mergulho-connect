import { PartialType } from '@nestjs/swagger';
import { CreateCultoReportDto } from './create-culto-report.dto';
export class UpdateCultoReportDto extends PartialType(CreateCultoReportDto) {}
