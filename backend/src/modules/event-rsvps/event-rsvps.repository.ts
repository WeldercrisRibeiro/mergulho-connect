import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventRsvpDto } from './dto/create-event-rsvp.dto';
import { UpdateEventRsvpDto } from './dto/update-event-rsvp.dto';

/**
 * Repository responsável por encapsular todas as operações de banco de dados
 * relacionadas a EventRsvp. Isso isola o Prisma do serviço de domínio.
 */
@Injectable()
export class EventRsvpsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createOrUpdate(dto: CreateEventRsvpDto) {
    return this.prisma.eventRsvp.upsert({
      where: {
        eventId_userId: {
          eventId: dto.eventId,
          userId: dto.userId,
        },
      },
      update: {
        status: dto.status,
      },
      create: {
        eventId: dto.eventId,
        userId: dto.userId,
        status: dto.status,
      },
    });
  }

  findByEvent(eventId: string) {
    return this.prisma.eventRsvp.findMany({ where: { eventId } });
  }

  findByUser(userId: string) {
    return this.prisma.eventRsvp.findMany({ where: { userId }, include: { event: true } });
  }

  update(id: string, dto: UpdateEventRsvpDto) {
    return this.prisma.eventRsvp.update({ where: { id }, data: dto as any });
  }

  remove(id: string) {
    return this.prisma.eventRsvp.delete({ where: { id } });
  }
}
