import { IsString, IsUUID, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsUUID('4', { message: 'ID de usuário inválido.' })
  userId: string;

  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' })
  newPassword: string;
}
