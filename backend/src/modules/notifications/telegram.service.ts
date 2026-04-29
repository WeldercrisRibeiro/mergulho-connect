import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');
  }

  async sendLoginNotification(email: string, role: string, name?: string) {
    if (!this.botToken || !this.chatId) {
      // Opcional: Logar que as credenciais não estão configuradas, mas apenas em dev
      return;
    }

    const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const message = `🔔 Auditoria de Login\n\nUsuário: ${name || 'Não informado'}\nE-mail: ${email}\nNível: ${role}\nData: ${date}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error(`Erro na API do Telegram: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      this.logger.error('Falha ao enviar notificação para o Telegram', error);
    }
  }
}
