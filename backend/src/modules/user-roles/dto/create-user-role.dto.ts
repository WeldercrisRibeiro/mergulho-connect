import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AppRole {
  admin = 'admin',
  admin_ccm = 'admin_ccm',
  gerente = 'gerente',
  pastor = 'pastor',
  membro = 'membro',
}

export class CreateUserRoleDto {
  @ApiProperty() @IsUUID() userId: string;
  @ApiPropertyOptional({ enum: AppRole }) @IsOptional() @IsEnum(AppRole) role?: AppRole;
}
