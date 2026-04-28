import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'E-mail ou Login inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
