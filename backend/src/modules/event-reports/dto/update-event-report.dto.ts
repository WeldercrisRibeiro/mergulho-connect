import { PartialType } from '@nestjs/swagger';
import { CreateEventReportDto } from './create-event-report.dto';
export class UpdateEventReportDto extends PartialType(CreateEventReportDto) {}
