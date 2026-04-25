import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCultoReportDto } from './dto/create-culto-report.dto';
import { UpdateCultoReportDto } from './dto/update-culto-report.dto';

@Injectable()
export class CultoReportsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateCultoReportDto) { return this.prisma.cultoReport.create({ data: dto as any }); }
  findAll(eventId?: string) { return this.prisma.cultoReport.findMany({ where: eventId ? { eventId } : {}, orderBy: { reportDate: 'desc' }, include: { event: true } }); }
  findOne(id: string) { return this.prisma.cultoReport.findUnique({ where: { id }, include: { event: true } }); }
  update(id: string, dto: UpdateCultoReportDto) { return this.prisma.cultoReport.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.cultoReport.delete({ where: { id } }); }
}
