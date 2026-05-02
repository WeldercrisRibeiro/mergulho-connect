import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateCheckinDto) {
    const checkin = await this.prisma.checkin.create({ data: dto as any, include: { guardian: true } });

    // Enviar token via WhatsApp ao responsável (se tiver guardianId)
    if (checkin.guardianId && checkin.validationToken) {
      const categoryLabel = checkin.category === 'volume' ? 'volume' : 'criança';
      const itemLabel = checkin.childName || 'item';
      const msg =
        `🔒 *Confirmação de Check-in*\n\n` +
        `Olá! O check-in d${categoryLabel === 'volume' ? 'o' : 'a'} *${itemLabel}* foi registrado com sucesso.\n\n` +
        `Seu *token de segurança* para retirada é:\n\n` +
        `🔑 *${checkin.validationToken}*\n\n` +
        `Guarde este código. Ele será solicitado na saída.\n` +
        `_Mergulho Connect - Segurança_`;

      try {
        await this.prisma.wzDispatch.create({
          data: {
            title: `Token de Check-in: ${itemLabel}`,
            content: msg,
            type: 'individual',
            targetUserId: checkin.guardianId,
            priority: 'high',
            status: 'pending',
            scheduledAt: new Date(),
          },
        });
      } catch (err) {
        // Não bloquear o check-in se o disparo falhar
        console.error('[Checkin] Falha ao agendar envio do token:', err);
      }
    }

    return checkin;
  }

  findAll(eventId?: string, status?: string, guardianId?: string) {
    return this.prisma.checkin.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(status ? { status } : {}),
        ...(guardianId ? { guardianId } : {}),
      },
      orderBy: { createdAt: 'desc' }, include: { guardian: true },
    });
  }
  findOne(id: string) { return this.prisma.checkin.findUnique({ where: { id }, include: { guardian: true } }); }
  findByToken(token: string) { return this.prisma.checkin.findFirst({ where: { validationToken: token } }); }
  update(id: string, dto: UpdateCheckinDto) { return this.prisma.checkin.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.checkin.delete({ where: { id } }); }
}
