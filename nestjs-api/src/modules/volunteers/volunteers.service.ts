import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';

@Injectable()
export class VolunteersService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateVolunteerDto) { return this.prisma.volunteer.create({ data: dto as any }); }
  findAll(status?: string) { return this.prisma.volunteer.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.volunteer.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateVolunteerDto) { return this.prisma.volunteer.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.volunteer.delete({ where: { id } }); }
}
