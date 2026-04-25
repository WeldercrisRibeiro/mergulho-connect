import { PartialType } from '@nestjs/swagger';
import { CreateKidsCheckinDto } from './create-kids-checkin.dto';
export class UpdateKidsCheckinDto extends PartialType(CreateKidsCheckinDto) {}
