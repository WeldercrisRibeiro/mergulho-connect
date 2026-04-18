import { PartialType } from '@nestjs/swagger';
import { CreateTreasuryEntryDto } from './create-treasury-entry.dto';
export class UpdateTreasuryEntryDto extends PartialType(CreateTreasuryEntryDto) {}
