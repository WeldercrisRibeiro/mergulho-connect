import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupRoutineDto } from './dto/create-group-routine.dto';
import { UpdateGroupRoutineDto } from './dto/update-group-routine.dto';

@Injectable()
export class GroupRoutinesService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateGroupRoutineDto) {
    const { groupId, roleId, routineKey } = dto;
    if (!groupId && !roleId) {
      throw new BadRequestException('Informe groupId ou roleId para configurar a rotina.');
    }

    // Se roleId for fornecido, usar ele como identificador único (groupId será null)
    const effectiveGroupId = roleId ? null : groupId;
    const effectiveRoleId = roleId || null;

    // Validar se o groupId existe, se fornecido e não for um role
    if (groupId && !roleId) {
      const groupExists = await this.prisma.group.findUnique({
        where: { id: groupId }
      });
      if (!groupExists) {
        throw new NotFoundException(`Grupo com ID ${groupId} não encontrado`);
      }
    }

    const existing = await this.prisma.groupRoutine.findFirst({
      where: {
        groupId: effectiveGroupId,
        roleId: effectiveRoleId,
        routineKey: routineKey,
      },
    });

    if (existing) {
      return this.prisma.groupRoutine.update({
        where: { id: existing.id },
        data: { ...dto, groupId: effectiveGroupId, roleId: effectiveRoleId },
      });
    }

    try {
      return await this.prisma.groupRoutine.create({ 
        data: { ...dto, groupId: effectiveGroupId, roleId: effectiveRoleId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const raceExisting = await this.prisma.groupRoutine.findFirst({
          where: {
            groupId: effectiveGroupId,
            roleId: effectiveRoleId,
            routineKey: routineKey,
          },
        });
        if (raceExisting) {
          return this.prisma.groupRoutine.update({
            where: { id: raceExisting.id },
            data: { ...dto, groupId: effectiveGroupId, roleId: effectiveRoleId },
          });
        }
      }
      throw error;
    }
  }
  findAll(groupId?: string, includeRoles?: boolean) {
    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    } else if (includeRoles) {
      // Quando includeRoles=true e não há groupId específico, buscar todos incluindo roles (groupId=null)
      // Não aplicar filtro
    } else {
      // Por padrão, buscar apenas registros com groupId não nulo (grupos)
      where.groupId = { not: null };
    }
    return this.prisma.groupRoutine.findMany({
      where,
      include: {
        group: true
      }
    });
  }
  async findByGroups(groupIds: string, roleId?: string) {
    if (!groupIds && !roleId) return [];
    
    const ids = groupIds ? groupIds.split(',') : [];
    
    return this.prisma.groupRoutine.findMany({
      where: {
        OR: [
          { groupId: { in: ids }, roleId: null },
          { roleId: roleId || undefined, groupId: null }
        ]
      },
    });
  }
  findOne(id: string) { return this.prisma.groupRoutine.findUnique({ where: { id }, include: { group: true } }); }
  async update(id: string, dto: UpdateGroupRoutineDto) {
    try {
      return await this.prisma.groupRoutine.update({ where: { id }, data: dto });
    } catch (e: any) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }
  async remove(id: string) {
    try {
      return await this.prisma.groupRoutine.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2025') return null;
      throw e;
    }
  }
}
