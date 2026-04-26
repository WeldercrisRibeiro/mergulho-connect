import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangePasswordWithCredentialsDto {
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsString()
  @MinLength(3, { message: 'Senha atual deve ter no mínimo 3 caracteres.' })
  currentPassword: string;

  @IsString()
  @MinLength(3, { message: 'Nova senha deve ter no mínimo 3 caracteres.' })
  newPassword: string;
}
