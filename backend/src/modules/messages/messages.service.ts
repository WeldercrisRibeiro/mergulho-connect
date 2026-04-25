import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, field = 'userId') {
  if (!value || !UUID_REGEX.test(value)) {
    throw new BadRequestException(`${field} inválido: "${value}" não é um UUID.`);
  }
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateMessageDto) { return this.prisma.message.create({ data: dto as any }); }

  findBySender(senderId: string) {
    assertUuid(senderId, 'senderId');
    return this.prisma.message.findMany({ where: { senderId }, orderBy: { createdAt: 'desc' }, include: { recipient: true } });
  }

  findByRecipient(recipientId: string) {
    assertUuid(recipientId, 'recipientId');
    return this.prisma.message.findMany({ where: { recipientId }, orderBy: { createdAt: 'desc' }, include: { sender: true } });
  }

  findConversation(userId1: string, userId2: string) {
    assertUuid(userId1, 'userId1');
    assertUuid(userId2, 'userId2');
    return this.prisma.message.findMany({
      where: { OR: [{ senderId: userId1, recipientId: userId2 }, { senderId: userId2, recipientId: userId1 }] },
      orderBy: { createdAt: 'asc' },
    });
  }

  findForUser(userId: string) {
    assertUuid(userId, 'userId');
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, groupId: null },
          { recipientId: userId, groupId: null }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        recipient: true
      }
    });
  }

  findGroupMessages(groupIds: string[], excludeUserId: string) {
    const validGroupIds = groupIds.filter(id => UUID_REGEX.test(id));
    if (validGroupIds.length === 0) return Promise.resolve([]);
    return this.prisma.message.findMany({
      where: {
        groupId: { in: validGroupIds },
        senderId: { not: excludeUserId }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  findMessagesForChat(chatId: string, isGroup: boolean, userId: string) {
    if (!UUID_REGEX.test(chatId) || !UUID_REGEX.test(userId)) return Promise.resolve([]);
    if (isGroup) {
      return this.prisma.message.findMany({
        where: { groupId: chatId },
        orderBy: { createdAt: 'asc' },
        include: { sender: true }
      });
    } else {
      return this.prisma.message.findMany({
        where: {
          groupId: null,
          OR: [
            { senderId: userId, recipientId: chatId },
            { senderId: chatId, recipientId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' },
        include: { sender: true }
      });
    }
  }

  deleteGroupMessages(groupId: string) {
    return this.prisma.message.deleteMany({ where: { groupId } });
  }

  deleteDirectMessages(userId1: string, userId2: string) {
    return this.prisma.message.deleteMany({
      where: {
        groupId: null,
        OR: [
          { senderId: userId1, recipientId: userId2 },
          { senderId: userId2, recipientId: userId1 }
        ]
      }
    });
  }

  remove(id: string) { return this.prisma.message.delete({ where: { id } }); }
}
