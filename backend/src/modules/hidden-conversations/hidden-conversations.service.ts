import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HiddenConversationsService {
  constructor(private prisma: PrismaService) {}
  findAll() {
    // TODO: Implementar lógica para conversas ocultas
    // Por exemplo, filtrar mensagens ou chats marcados como hidden
    return this.prisma.message.findMany({
      where: { isHidden: true }, // Assumindo que há um campo isHidden
      orderBy: { createdAt: 'desc' },
      include: { sender: true, recipient: true },
    });
  }
}