import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateMaintenanceProfileDto {
  @IsUUID('4', { message: 'userId inválido.' })
  userId: string;

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
  @IsString()
  avatarUrl?: string;
}
