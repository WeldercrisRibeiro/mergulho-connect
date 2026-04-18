import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserPushSubscriptionDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiProperty() subscription: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() deviceInfo?: Record<string, any>;
}
