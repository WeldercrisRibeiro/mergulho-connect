import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWzDispatchDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() content?: string;
  @ApiProperty() @IsString() type: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiProperty() scheduledAt: string | Date;
  @ApiPropertyOptional() @IsOptional() @IsString() createdBy?: string;
}
