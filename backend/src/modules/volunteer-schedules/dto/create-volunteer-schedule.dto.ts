import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVolunteerScheduleDto {
  @ApiProperty() @IsNotEmpty() @IsString() scheduleDate: string;
  @ApiProperty() @IsString() roleFunction: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() volunteerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() itemUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() createdBy?: string;
}
