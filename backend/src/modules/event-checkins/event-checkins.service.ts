import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventCheckinDto } from './dto/create-event-checkin.dto';

@Injectable()
export class EventCheckinsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventCheckinDto) { return this.prisma.eventCheckin.create({ data: dto }); }

  findByEvent(eventId: string) {
    return this.prisma.eventCheckin.findMany({ where: { eventId }, orderBy: { checkedInAt: 'desc' } });
  }

  findByUser(userId: string) {
    return this.prisma.eventCheckin.findMany({ where: { userId } });
  }

  remove(id: string) { return this.prisma.eventCheckin.delete({ where: { id } }); }

  async removeByEventAndUser(eventId: string, userId: string) {
    const record = await this.prisma.eventCheckin.findFirst({ where: { eventId, userId } });
    if (record) return this.prisma.eventCheckin.delete({ where: { id: record.id } });
    return null;
  }
}
