import { PartialType } from '@nestjs/swagger';
import { CreateGroupRoutineDto } from './create-group-routine.dto';
export class UpdateGroupRoutineDto extends PartialType(CreateGroupRoutineDto) {}
