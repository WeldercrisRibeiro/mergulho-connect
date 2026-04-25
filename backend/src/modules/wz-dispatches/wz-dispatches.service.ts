import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWzDispatchDto } from './dto/create-wz-dispatch.dto';
import { UpdateWzDispatchDto } from './dto/update-wz-dispatch.dto';

@Injectable()
export class WzDispatchesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateWzDispatchDto) {
    return this.prisma.wzDispatch.create({
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        title: dto.title || 'Aviso', // Garantir título
      },
    });
  }

  findAll(status?: string) {
    return this.prisma.wzDispatch.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      include: { attachments: true, logs: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findOne(id: string) {
    return this.prisma.wzDispatch.findUnique({
      where: { id },
      include: { attachments: true, logs: { orderBy: { createdAt: 'desc' } } },
    });
  }

  findPending() {
    const now = new Date();
    return this.prisma.wzDispatch.findMany({
      where: { status: 'pending', scheduledAt: { lte: now } },
      include: { attachments: true },
    });
  }

  update(id: string, dto: UpdateWzDispatchDto) {
    return this.prisma.wzDispatch.update({ where: { id }, data: dto as any });
  }

  updateStatus(id: string, status: string, extra?: { sentAt?: Date; errorMessage?: string }) {
    return this.prisma.wzDispatch.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  async retry(id: string) {
    const dispatch = await this.prisma.wzDispatch.findUnique({ where: { id } });
    if (!dispatch || dispatch.status !== 'error') {
      throw new Error('Somente disparos com erro podem ser recolocados na fila.');
    }
    return this.prisma.wzDispatch.update({
      where: { id },
      data: { status: 'pending', errorMessage: null, scheduledAt: new Date() },
    });
  }

  async remove(id: string) {
    const dispatch = await this.prisma.wzDispatch.findUnique({ where: { id } });
    if (dispatch?.status === 'sending') throw new Error('Não é possível excluir um disparo em andamento.');
    return this.prisma.wzDispatch.delete({ where: { id } });
  }

  // Logs
  createLog(data: { dispatchId: string; recipient: string; status: string; error?: string }) {
    return this.prisma.wzDispatchLog.create({ data });
  }

  findLogs(dispatchId: string) {
    return this.prisma.wzDispatchLog.findMany({ where: { dispatchId }, orderBy: { createdAt: 'desc' } });
  }

  // Attachments
  createAttachment(data: { dispatchId: string; type: string; filename: string; filepath: string; mimetype: string }) {
    return this.prisma.wzDispatchAttachment.create({ data });
  }

  findAttachments(dispatchId: string) {
    return this.prisma.wzDispatchAttachment.findMany({ where: { dispatchId } });
  }

  removeAttachment(id: string) {
    return this.prisma.wzDispatchAttachment.delete({ where: { id } });
  }

  removeAttachmentsByDispatch(dispatchId: string, keepIds: string[] = []) {
    return this.prisma.wzDispatchAttachment.deleteMany({
      where: { dispatchId, ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}) },
    });
  }
}
