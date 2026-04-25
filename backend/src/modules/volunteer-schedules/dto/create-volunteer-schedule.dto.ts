import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVolunteerScheduleDto {
  @ApiProperty() scheduleDate: string | Date;
  @ApiProperty() @IsString() roleFunction: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() volunteerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() itemUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
