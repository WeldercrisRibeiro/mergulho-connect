import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) { }
  create(dto: CreateCheckinDto) { return this.prisma.checkin.create({ data: dto as any }); }
  findAll(eventId?: string, status?: string, guardianId?: string) {
    return this.prisma.checkin.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(status ? { status } : {}),
        ...(guardianId ? { guardianId } : {}),
      },
      orderBy: { createdAt: 'desc' }, include: { guardian: true },
    });
  }
  findOne(id: string) { return this.prisma.checkin.findUnique({ where: { id }, include: { guardian: true } }); }
  findByToken(token: string) { return this.prisma.checkin.findFirst({ where: { validationToken: token } }); }
  update(id: string, dto: UpdateCheckinDto) { return this.prisma.checkin.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.checkin.delete({ where: { id } }); }
}
