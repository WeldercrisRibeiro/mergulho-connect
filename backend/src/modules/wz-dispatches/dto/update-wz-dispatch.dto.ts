import { PartialType } from '@nestjs/swagger';
import { CreateWzDispatchDto } from './create-wz-dispatch.dto';
export class UpdateWzDispatchDto extends PartialType(CreateWzDispatchDto) {}
