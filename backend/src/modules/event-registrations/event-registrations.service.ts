import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';

@Injectable()
export class EventRegistrationsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateEventRegistrationDto) { return this.prisma.eventRegistration.create({ data: dto as any }); }
  findByEvent(eventId: string) { return this.prisma.eventRegistration.findMany({ where: { eventId }, orderBy: { createdAt: 'desc' } }); }
  findByUser(userId: string) { return this.prisma.eventRegistration.findMany({ where: { userId }, include: { event: true } }); }
  update(id: string, dto: UpdateEventRegistrationDto) { return this.prisma.eventRegistration.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.eventRegistration.delete({ where: { id } }); }

  async removeByEventAndUser(eventId: string, userId: string) {
    const record = await this.prisma.eventRegistration.findFirst({ where: { eventId, userId } });
    if (record) return this.prisma.eventRegistration.delete({ where: { id: record.id } });
    return null;
  }
}
