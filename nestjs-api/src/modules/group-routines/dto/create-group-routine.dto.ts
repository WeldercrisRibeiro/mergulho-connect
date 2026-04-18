import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupRoutineDto {
  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiProperty() @IsString() routineKey: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnabled?: boolean;
}
