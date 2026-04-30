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
import { SupabaseService } from '../upload/supabase.service';
import { processAudioOgg, needsConversion } from '../../utils/audioConvert';

@Injectable()
export class WhatsAppService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) { }

  async onModuleInit() {
    // Tenta reconectar automaticamente ao iniciar
    await tryAutoConnect(this.prisma).catch((err) => console.error('[WA] Falha no auto-connect:', err));
  }

  // ─── Controle de conexão ─────────────────────────────────────────────────

  connect() { return connectWhatsApp(this.prisma); }
  disconnect() { return disconnectWhatsApp(this.prisma); }
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
        const phones = await this.getRecipientPhones(dispatch);
        if (!phones.length) throw new Error('Nenhum destinatário com WhatsApp cadastrado encontrado.');

        // Prepara os buffers dos anexos uma única vez para todos os destinatários
        const attachmentsWithBuffers = await Promise.all((dispatch.attachments || []).map(async (att) => {
          let buffer = await this.supabaseService.getFileBuffer(att.filepath);
          
          // Se for áudio e precisar de conversão, faz em memória
          if (att.type === 'audio' && needsConversion(att.filename, att.mimetype)) {
            console.log(`[Scheduler] Convertendo áudio para OGG/Opus: ${att.filename}`);
            buffer = await processAudioOgg(buffer);
          }

          return { ...att, buffer };
        }));

        const logs: { recipient: string; status: string; error: string | null }[] = [];

        for (const phone of phones) {
          const errors = await this.sendToRecipient(phone, dispatch.content, attachmentsWithBuffers);
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
      profiles.forEach((p) => { try { phones.push(formatPhoneNumber(p.whatsappPhone!)); } catch { } });
    } else if (dispatch.type === 'group' && dispatch.targetGroupId) {
      const members = await this.prisma.memberGroup.findMany({ where: { groupId: dispatch.targetGroupId } });
      const userIds = members.map((m) => m.userId);
      if (userIds.length) {
        const profiles = await this.prisma.profile.findMany({ where: { userId: { in: userIds }, whatsappPhone: { not: null } } });
        profiles.forEach((p) => { try { phones.push(formatPhoneNumber(p.whatsappPhone!)); } catch { } });
      }
    } else if (dispatch.type === 'individual' && dispatch.targetUserId) {
      const profile = await this.prisma.profile.findFirst({ where: { userId: dispatch.targetUserId, whatsappPhone: { not: null } } });
      if (profile?.whatsappPhone) { try { phones.push(formatPhoneNumber(profile.whatsappPhone)); } catch { } }
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
          type: att.type, mimetype: att.mimetype, filename: att.filename, buffer: att.buffer
        });
        await this.sleep(1500);
      } catch (err: any) { errors.push(`Anexo "${att.filename}": ${err.message}`); }
    }
    return errors;
  }

  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
}
