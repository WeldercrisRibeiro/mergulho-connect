import { Controller, Get, Post, Res, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { WhatsAppService } from './whatsapp.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly service: WhatsAppService) {}

  @Get('status')
  getStatus() {
    return this.service.getStatus();
  }

  @Post('connect')
  @ApiBearerAuth()
  async connect() {
    await this.service.connect();
    return { success: true, message: 'Processo de conexão iniciado.' };
  }

  @Delete('disconnect')
  @ApiBearerAuth()
  async disconnect() {
    await this.service.disconnect();
    return { success: true, message: 'Desconectado com sucesso.' };
  }

  @Get('sse')
  sse(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Manda os headers imediatamente
    res.flushHeaders?.();

    const clientId = Math.random().toString(36).substring(7);
    this.service.addSseClient(clientId, res);

    res.on('close', () => {
      this.service.removeSseClient(clientId);
    });
  }
}
