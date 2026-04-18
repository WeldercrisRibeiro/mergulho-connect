import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventRsvpDto } from './dto/create-event-rsvp.dto';
import { UpdateEventRsvpDto } from './dto/update-event-rsvp.dto';

@Injectable()
export class EventRsvpsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateEventRsvpDto) { return this.prisma.eventRsvp.create({ data: dto }); }
  findByEvent(eventId: string) { return this.prisma.eventRsvp.findMany({ where: { eventId } }); }
  findByUser(userId: string) { return this.prisma.eventRsvp.findMany({ where: { userId }, include: { event: true } }); }
  update(id: string, dto: UpdateEventRsvpDto) { return this.prisma.eventRsvp.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.eventRsvp.delete({ where: { id } }); }
}
