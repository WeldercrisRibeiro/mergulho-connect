import { PartialType } from '@nestjs/swagger';
import { CreateDevotionalDto } from './create-devotional.dto';
export class UpdateDevotionalDto extends PartialType(CreateDevotionalDto) {}
