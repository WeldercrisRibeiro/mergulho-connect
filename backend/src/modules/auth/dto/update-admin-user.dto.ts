import { AppRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class AdminUserGroupDto {
  @IsUUID('4')
  id: string;

  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  username?: string;

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
}
