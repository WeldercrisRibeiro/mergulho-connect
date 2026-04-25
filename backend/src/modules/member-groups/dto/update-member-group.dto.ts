import { PartialType } from '@nestjs/swagger';
import { CreateMemberGroupDto } from './create-member-group.dto';
export class UpdateMemberGroupDto extends PartialType(CreateMemberGroupDto) {}
