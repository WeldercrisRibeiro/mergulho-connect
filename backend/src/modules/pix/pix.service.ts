import { Injectable, BadRequestException } from '@nestjs/common';
import { createStaticPix, hasError } from 'pix-utils';
import { CreatePixDto } from './dto/create-pix.dto';

@Injectable()
export class PixService {
  gerarPayload(dto: CreatePixDto) {
    // Normalização para evitar erros em bancos (remover acentos, caracteres especiais e limitar tamanho)
    const cleanName = this.normalizeString(dto.name).substring(0, 25);
    const cleanCity = this.normalizeString(dto.city).substring(0, 15);
    
    // Limpar chave Pix se for CPF, CNPJ ou Telefone (remover pontuação)
    let cleanPixKey = dto.pixKey.trim();
    if (this.isCpfCnpjOrPhone(cleanPixKey)) {
      cleanPixKey = cleanPixKey.replace(/\D/g, '');
      // Se for telefone e não tiver o prefixo do país, adiciona 55
      if (cleanPixKey.length === 11 && !dto.pixKey.includes('@')) {
        cleanPixKey = '55' + cleanPixKey;
      }
    }

    const pix = createStaticPix({
      merchantName: cleanName,
      merchantCity: cleanCity,
      pixKey: cleanPixKey,
      infoAdicional: dto.description?.substring(0, 50),
      transactionAmount: dto.amount,
    });

    if (hasError(pix)) {
      throw new BadRequestException('Erro ao gerar payload do Pix. Verifique os dados informados.');
    }

    return {
      brCode: pix.toBRCode(),
    };
  }

  private normalizeString(str: string): string {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Mantém apenas letras, números e espaços
      .trim();
  }

  private isCpfCnpjOrPhone(key: string): boolean {
    // Se contém @, é email. Se não, e tem números, provavelmente é CPF, CNPJ ou Telefone
    return !key.includes('@') && /[0-9]/.test(key);
  }
}
