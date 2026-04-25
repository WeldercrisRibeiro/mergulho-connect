import { PartialType } from '@nestjs/swagger';
import { CreateVolunteerScheduleDto } from './create-volunteer-schedule.dto';
export class UpdateVolunteerScheduleDto extends PartialType(CreateVolunteerScheduleDto) {}
