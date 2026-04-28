import { AppRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';

class AdminUserGroupDto {
  @IsUUID('4')
  id: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsString()
  fullName: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @IsOptional()
  @IsEnum(AppRole)
  role?: AppRole;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminUserGroupDto)
  groups?: AdminUserGroupDto[];

  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  codCep?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
