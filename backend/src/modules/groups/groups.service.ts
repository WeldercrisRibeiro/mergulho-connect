import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateGroupDto) { return this.prisma.group.create({ data: dto }); }
  findAll() { return this.prisma.group.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { memberGroups: true, events: true } } } }); }
  findOne(id: string) { return this.prisma.group.findUnique({ where: { id }, include: { memberGroups: true, events: true, groupRoutines: true } }); }
  update(id: string, dto: UpdateGroupDto) { return this.prisma.group.update({ where: { id }, data: dto }); }
  remove(id: string) { return this.prisma.group.delete({ where: { id } }); }
}
