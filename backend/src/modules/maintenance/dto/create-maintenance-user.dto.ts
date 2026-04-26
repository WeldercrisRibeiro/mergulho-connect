import { AppRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMaintenanceUserDto {
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password?: string;

  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @IsOptional()
  @IsEnum(AppRole, { message: 'Role inválida.' })
  role?: AppRole;
}
