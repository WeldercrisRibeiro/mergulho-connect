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
}
