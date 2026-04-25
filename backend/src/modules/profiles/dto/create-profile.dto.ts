import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ description: 'UUID do usuário dono do perfil', example: 'uuid-aqui' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Nome completo', example: 'João Silva' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'URL do avatar', example: 'https://...' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Telefone WhatsApp (apenas números)', example: '5511999999999' })
  @IsOptional()
  @IsString()
  whatsappPhone?: string;

  @ApiPropertyOptional({ description: 'Nome de usuário único', example: 'joao.silva' })
  @IsOptional()
  @IsString()
  username?: string;
}
