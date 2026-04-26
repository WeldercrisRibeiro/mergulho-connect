import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Nome é obrigatório.' })
  name: string;

  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
