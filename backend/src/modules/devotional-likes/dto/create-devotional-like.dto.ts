import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDevotionalLikeDto {
  @ApiProperty() @IsUUID() devotionalId: string;
  @ApiProperty() @IsUUID() userId: string;
}
