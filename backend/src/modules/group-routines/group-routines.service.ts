import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupRoutineDto } from './dto/create-group-routine.dto';
import { UpdateGroupRoutineDto } from './dto/update-group-routine.dto';

@Injectable()
export class GroupRoutinesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateGroupRoutineDto) {
    const { groupId, routineKey } = dto;
    const existing = await this.prisma.groupRoutine.findFirst({
      where: {
        groupId: groupId || null,
        routineKey: routineKey,
      },
    });

    if (existing) {
      return this.prisma.groupRoutine.update({
        where: { id: existing.id },
        data: dto as any,
      });
    }

    try {
      return await this.prisma.groupRoutine.create({ data: dto as any });
    } catch (error) {
      if (error.code === 'P2002') {
        const raceExisting = await this.prisma.groupRoutine.findFirst({
          where: {
            groupId: groupId || null,
            routineKey: routineKey,
          },
        });
        if (raceExisting) {
          return this.prisma.groupRoutine.update({
            where: { id: raceExisting.id },
            data: dto as any,
          });
        }
      }
      throw error;
    }
  }
  findAll(groupId?: string) {
    return this.prisma.groupRoutine.findMany({
      where: groupId ? { groupId } : {},
      include: {
        group: true
      }
    });
  }
  findByGroups(groupIds: string) {
    if (!groupIds) return [];
    const ids = groupIds.split(',');
    return this.prisma.groupRoutine.findMany({ where: { groupId: { in: ids } } });
  }
  findOne(id: string) { return this.prisma.groupRoutine.findUnique({ where: { id }, include: { group: true } }); }
  async update(id: string, dto: UpdateGroupRoutineDto) {
    try {
      return await this.prisma.groupRoutine.update({ where: { id }, data: dto as any });
    } catch (e) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }
  async remove(id: string) {
    try {
      return await this.prisma.groupRoutine.delete({ where: { id } });
    } catch (e) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }
}
