import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventRsvpDto {
  @ApiProperty() @IsUUID() eventId: string;
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsString() status: string;
}
