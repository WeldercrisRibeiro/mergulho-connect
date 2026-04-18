import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventRegistrationDto {
  @ApiProperty() @IsUUID() eventId: string;
  @ApiProperty() @IsUUID() userId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentStatus?: string;
}
