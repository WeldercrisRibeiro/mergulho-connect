import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventReportDto } from './dto/create-event-report.dto';
import { UpdateEventReportDto } from './dto/update-event-report.dto';

@Injectable()
export class EventReportsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateEventReportDto) { return this.prisma.eventReport.create({ data: dto as any }); }
  findAll(groupId?: string, eventId?: string) {
    return this.prisma.eventReport.findMany({
      where: { ...(groupId ? { groupId } : {}), ...(eventId ? { eventId } : {}) },
      orderBy: { reportDate: 'desc' }, include: { event: true, group: true },
    });
  }
  findOne(id: string) { return this.prisma.eventReport.findUnique({ where: { id }, include: { event: true, group: true } }); }
  update(id: string, dto: UpdateEventReportDto) { return this.prisma.eventReport.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.eventReport.delete({ where: { id } }); }
}
