import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePixDto {
  @ApiProperty({ description: 'Chave Pix (Telefone, E-mail, CPF, CNPJ ou Chave Aleatória)' })
  @IsNotEmpty({ message: 'A chave Pix é obrigatória' })
  @IsString()
  pixKey: string;

  @ApiProperty({ description: 'Valor da transação' })
  @IsNotEmpty({ message: 'O valor é obrigatório' })
  @IsNumber({}, { message: 'O valor deve ser um número' })
  @Min(0.01, { message: 'O valor mínimo é R$ 0,01' })
  amount: number;

  @ApiProperty({ description: 'Nome do recebedor' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cidade do recebedor' })
  @IsNotEmpty({ message: 'A cidade é obrigatória' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'Descrição da transação' })
  @IsOptional()
  @IsString()
  description?: string;
}
