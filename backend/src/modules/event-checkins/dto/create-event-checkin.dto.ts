import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventCheckinDto {
  @ApiProperty() @IsUUID() eventId: string;
  @ApiProperty() @IsUUID() userId: string;
}
