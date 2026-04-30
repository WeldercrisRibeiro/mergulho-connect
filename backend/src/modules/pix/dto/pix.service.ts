import { Injectable } from '@nestjs/common';
import { createStaticPix, hasError } from 'pix-utils';

@Injectable()
export class PixService {
  gerarPayload(amount: number, key: string, name: string, city: string, description: string) {
    const pix = createStaticPix({
      merchantName: name,
      merchantCity: city,
      pixKey: key,
      infoAdicional: description,
      transactionAmount: amount,
    });

    if (hasError(pix)) {
      throw new Error('Erro ao gerar payload do Pix.');
    }

    return {
      brCode: pix.toBRCode(),
    };
  }
}