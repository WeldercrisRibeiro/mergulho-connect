import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateKidsCheckinDto } from './dto/create-kids-checkin.dto';
import { UpdateKidsCheckinDto } from './dto/update-kids-checkin.dto';

@Injectable()
export class KidsCheckinsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateKidsCheckinDto) { return this.prisma.kidsCheckin.create({ data: dto as any }); }
  findAll(eventId?: string, status?: string, guardianId?: string) {
    return this.prisma.kidsCheckin.findMany({
      where: {
        ...(eventId ? { eventId } : {}),
        ...(status ? { status } : {}),
        ...(guardianId ? { guardianId } : {}),
      },
      orderBy: { createdAt: 'desc' }, include: { guardian: true },
    });
  }
  findOne(id: string) { return this.prisma.kidsCheckin.findUnique({ where: { id }, include: { guardian: true } }); }
  findByToken(token: string) { return this.prisma.kidsCheckin.findFirst({ where: { validationToken: token } }); }
  update(id: string, dto: UpdateKidsCheckinDto) { return this.prisma.kidsCheckin.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.kidsCheckin.delete({ where: { id } }); }
}
