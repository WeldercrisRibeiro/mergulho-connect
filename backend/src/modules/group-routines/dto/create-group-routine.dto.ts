import { IsString, IsOptional, IsBoolean, IsUUID, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupRoutineDto {
  @ApiPropertyOptional()
  @ValidateIf((dto) => !dto.roleId)
  @IsUUID('4', { message: 'groupId inválido.' })
  groupId?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto) => !dto.groupId)
  @IsUUID('4', { message: 'roleId inválido.' })
  roleId?: string; // Para roles globais

  @ApiProperty() @IsString() routineKey: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isEnabled?: boolean;
}
