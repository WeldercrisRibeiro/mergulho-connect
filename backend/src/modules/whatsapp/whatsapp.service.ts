import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getStatus,
  addSseClient,
  removeSseClient,
  isConnected,
  sendTextMessage,
  sendMediaMessage,
  tryAutoConnect,
  formatPhoneNumber,
} from './whatsapp.client';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WhatsAppService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Tenta reconectar automaticamente ao iniciar
    await tryAutoConnect().catch((err) => console.error('[WA] Falha no auto-connect:', err));
  }

  // ─── Controle de conexão ─────────────────────────────────────────────────

  connect() { return connectWhatsApp(); }
  disconnect() { return disconnectWhatsApp(); }
  getStatus() { return getStatus(); }
  isConnected() { return isConnected(); }
  addSseClient(id: string, res: any) { addSseClient(id, res); }
  removeSseClient(id: string) { removeSseClient(id); }

  // ─── Scheduler de disparos ────────────────────────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingDispatches() {
    if (!isConnected()) return;
    const now = new Date();
    const pending = await this.prisma.wzDispatch.findMany({
      where: { status: 'pending', scheduledAt: { lte: now } },
      include: { attachments: true },
    });
    if (!pending.length) return;

    console.log(`[Scheduler] ${pending.length} disparo(s) prontos para processar.`);

    for (const dispatch of pending) {
      await this.prisma.wzDispatch.update({ where: { id: dispatch.id }, data: { status: 'sending' } });

      try {
        // Se houver uma URL de anexo (ex: do devocional) e nenhum anexo real ainda, baixa o arquivo
        if ((dispatch as any).attachmentUrl && (!dispatch.attachments || dispatch.attachments.length === 0)) {
          console.log(`[Scheduler] Baixando mídia para disparo: ${(dispatch as any).attachmentUrl}`);
          try {
            const url = (dispatch as any).attachmentUrl;
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const filename = `downloaded_${uuidv4()}${ext}`;
            const uploadsDir = process.env.UPLOADS_DIR || './uploads';
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            const filepath = path.join(uploadsDir, filename);

            await this.downloadFile(url, filepath);

            // Cria o registro de anexo para que o bot envie
            const att = await this.prisma.wzDispatchAttachment.create({
              data: {
                dispatchId: dispatch.id,
                type: this.getMimeType(ext),
                filename: `Midia_${dispatch.id.slice(0,5)}${ext}`,
                filepath: filepath,
                mimetype: this.getMimeType(ext, true),
              }
            });
            // Atualiza o objeto local para incluir o novo anexo
            (dispatch as any).attachments = [att];
          } catch (dlErr: any) {
            console.error(`[Scheduler] Falha ao baixar mídia do disparo ${dispatch.id}:`, dlErr.message);
            // Continua mesmo sem a mídia? Ou falha? Por enquanto continua para enviar ao menos o texto
          }
        }

        const phones = await this.getRecipientPhones(dispatch);
        if (!phones.length) throw new Error('Nenhum destinatário com WhatsApp cadastrado encontrado.');

        const logs: { recipient: string; status: string; error: string | null }[] = [];

        for (const phone of phones) {
          const errors = await this.sendToRecipient(phone, dispatch.content, dispatch.attachments);
          logs.push({ recipient: phone, status: errors.length === 0 ? 'success' : 'error', error: errors.join(' | ') || null });
          await this.sleep(2000);
        }

        await this.prisma.wzDispatchLog.createMany({
          data: logs.map((l) => ({ dispatchId: dispatch.id, recipient: l.recipient, status: l.status, error: l.error })),
        });

        const allFailed = logs.every((l) => l.status === 'error');
        if (allFailed) throw new Error('Falha total: nenhum destinatário recebeu as mensagens.');

        await this.prisma.wzDispatch.update({
          where: { id: dispatch.id },
          data: { status: 'sent', sentAt: new Date(), errorMessage: null },
        });
        console.log(`[Scheduler] ✓ Disparo "${dispatch.title}" concluído.`);
      } catch (err: any) {
        await this.prisma.wzDispatch.update({
          where: { id: dispatch.id },
          data: { status: 'error', errorMessage: err.message },
        });
        console.error(`[Scheduler] ✗ Falha no disparo "${dispatch.title}":`, err.message);
      }
    }
  }

  // ─── Helpers privados ────────────────────────────────────────────────────

  private async getRecipientPhones(dispatch: any): Promise<string[]> {
    const phones: string[] = [];

    if (dispatch.type === 'general' || dispatch.type === 'devotional') {
      const profiles = await this.prisma.profile.findMany({ where: { whatsappPhone: { not: null } } });
      profiles.forEach((p) => { try { phones.push(formatPhoneNumber(p.whatsappPhone!)); } catch {} });
    } else if (dispatch.type === 'group' && dispatch.targetGroupId) {
      const members = await this.prisma.memberGroup.findMany({ where: { groupId: dispatch.targetGroupId } });
      const userIds = members.map((m) => m.userId);
      if (userIds.length) {
        const profiles = await this.prisma.profile.findMany({ where: { userId: { in: userIds }, whatsappPhone: { not: null } } });
        profiles.forEach((p) => { try { phones.push(formatPhoneNumber(p.whatsappPhone!)); } catch {} });
      }
    } else if (dispatch.type === 'individual' && dispatch.targetUserId) {
      const profile = await this.prisma.profile.findFirst({ where: { userId: dispatch.targetUserId, whatsappPhone: { not: null } } });
      if (profile?.whatsappPhone) { try { phones.push(formatPhoneNumber(profile.whatsappPhone)); } catch {} }
    }

    return [...new Set(phones)];
  }

  private async sendToRecipient(phone: string, content: string | null, attachments: any[]): Promise<string[]> {
    const errors: string[] = [];
    if (content?.trim()) {
      try { await sendTextMessage(phone, content.trim()); await this.sleep(1200); }
      catch (err: any) { errors.push(`Texto: ${err.message}`); }
    }
    for (const att of attachments) {
      try {
        await sendMediaMessage(phone, undefined, {
          type: att.type, filepath: att.filepath, mimetype: att.mimetype, filename: att.filename,
        });
        await this.sleep(1500);
      } catch (err: any) { errors.push(`Anexo "${att.filename}": ${err.message}`); }
    }
    return errors;
  }

  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

  private async downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(dest);
      protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Status ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    });
  }

  private getMimeType(ext: string, full = false): string {
    const e = ext.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(e)) return full ? `image/${e.replace('.','')}` : 'image';
    if (['.mp4', '.mov', '.avi'].includes(e)) return full ? `video/${e.replace('.','')}` : 'video';
    if (['.mp3', '.ogg', '.wav', '.webm'].includes(e)) return full ? `audio/${e.replace('.','')}` : 'audio';
    return full ? 'application/octet-stream' : 'document';
  }
}
