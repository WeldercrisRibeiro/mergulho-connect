import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() userName?: string;
  @ApiProperty() @IsString() action: string;
  @ApiProperty() @IsString() routine: string;
  @ApiPropertyOptional() @IsOptional() details?: Record<string, any>;
  @ApiPropertyOptional() @IsOptional() @IsString() ipAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deviceInfo?: string;
}
