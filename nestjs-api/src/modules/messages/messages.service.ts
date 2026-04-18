import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateMessageDto) { return this.prisma.message.create({ data: dto as any }); }
  findBySender(senderId: string) { return this.prisma.message.findMany({ where: { senderId }, orderBy: { createdAt: 'desc' }, include: { recipient: true } }); }
  findByRecipient(recipientId: string) { return this.prisma.message.findMany({ where: { recipientId }, orderBy: { createdAt: 'desc' }, include: { sender: true } }); }
  findConversation(userId1: string, userId2: string) {
    return this.prisma.message.findMany({
      where: { OR: [{ senderId: userId1, recipientId: userId2 }, { senderId: userId2, recipientId: userId1 }] },
      orderBy: { createdAt: 'asc' },
    });
  }

  findForUser(userId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, groupId: null },
          { recipientId: userId, groupId: null }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { include: { profile: true } },
        recipient: { include: { profile: true } }
      }
    });
  }

  findGroupMessages(groupIds: string[], excludeUserId: string) {
    return this.prisma.message.findMany({
      where: {
        groupId: { in: groupIds },
        senderId: { not: excludeUserId }
      },
      orderBy: { createdAt: 'asc' } // or 'desc' depending on needs
    });
  }
  
  findMessagesForChat(chatId: string, isGroup: boolean, userId: string) {
    if (isGroup) {
      return this.prisma.message.findMany({
        where: { groupId: chatId },
        orderBy: { createdAt: 'asc' },
        include: { sender: { include: { profile: true } } }
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
        include: { sender: { include: { profile: true } } }
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
