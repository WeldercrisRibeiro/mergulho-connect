import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberGroupDto {
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsUUID() groupId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() role?: string;
}
