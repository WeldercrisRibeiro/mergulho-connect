import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres.' })
  password: string;
}
