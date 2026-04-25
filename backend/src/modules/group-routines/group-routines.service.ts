import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupRoutineDto } from './dto/create-group-routine.dto';
import { UpdateGroupRoutineDto } from './dto/update-group-routine.dto';

@Injectable()
export class GroupRoutinesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateGroupRoutineDto) { return this.prisma.groupRoutine.create({ data: dto as any }); }
  findAll(groupId?: string) { return this.prisma.groupRoutine.findMany({ where: groupId ? { groupId } : {}, include: { group: true } }); }
  findByGroups(groupIds: string) { 
    if (!groupIds) return [];
    const ids = groupIds.split(',');
    return this.prisma.groupRoutine.findMany({ where: { groupId: { in: ids } } });
  }
  findOne(id: string) { return this.prisma.groupRoutine.findUnique({ where: { id }, include: { group: true } }); }
  update(id: string, dto: UpdateGroupRoutineDto) { return this.prisma.groupRoutine.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.groupRoutine.delete({ where: { id } }); }
}
