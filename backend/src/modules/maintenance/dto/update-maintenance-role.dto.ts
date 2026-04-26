import { AppRole } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class UpdateMaintenanceRoleDto {
  @IsUUID('4', { message: 'userId inválido.' })
  userId: string;

  @IsEnum(AppRole, { message: 'Role inválida.' })
  role: AppRole;
}
