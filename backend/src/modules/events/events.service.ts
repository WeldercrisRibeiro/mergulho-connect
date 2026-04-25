import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateEventDto) { return this.prisma.event.create({ data: dto as any }); }

  findAll(groupId?: string, isPublic?: boolean, isGeneral?: boolean) {
    return this.prisma.event.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        ...(isPublic !== undefined ? { isPublic } : {}),
        ...(isGeneral !== undefined ? { isGeneral } : {}),
      },
      orderBy: { eventDate: 'desc' },
      include: { group: true, checkins: true, registrations: true, rsvps: true },
    });
  }

  findPublic() { return this.prisma.event.findMany({ where: { isPublic: true }, orderBy: { eventDate: 'asc' } }); }

  findOne(id: string) {
    return this.prisma.event.findUnique({
      where: { id },
      include: { group: true, checkins: true, registrations: true, rsvps: true, reports: true, cultoReports: true },
    });
  }

  update(id: string, dto: UpdateEventDto) { return this.prisma.event.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.event.delete({ where: { id } }); }
}
