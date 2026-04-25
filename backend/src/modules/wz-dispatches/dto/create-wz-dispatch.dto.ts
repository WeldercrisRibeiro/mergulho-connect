import { IsString, IsOptional, IsDate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateWzDispatchDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiProperty() @IsString() type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiProperty() @Type(() => Date) @IsDate() scheduledAt: string | Date;
  @ApiPropertyOptional() @IsOptional() @IsString() createdBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() attachmentUrl?: string;
}
