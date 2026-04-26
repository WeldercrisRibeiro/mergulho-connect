import { IsString, IsUUID, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsUUID('4', { message: 'userId inválido.' })
  userId: string;

  @IsString()
  @MinLength(6, { message: 'Nova senha deve ter no mínimo 6 caracteres.' })
  newPassword: string;
}
