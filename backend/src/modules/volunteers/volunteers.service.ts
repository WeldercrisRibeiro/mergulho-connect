import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVolunteerDto } from './dto/create-volunteer.dto';
import { UpdateVolunteerDto } from './dto/update-volunteer.dto';

@Injectable()
export class VolunteersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateVolunteerDto) {
    return this.prisma.volunteer.create({ data: dto as any });
  }

  findAll(status?: string) {
    return this.prisma.volunteer.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.volunteer.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateVolunteerDto) {
    const updated = await this.prisma.volunteer.update({
      where: { id },
      data: dto as any,
    });

    // Quando o status muda para "completed" ou "in_progress", vincula o usuário
    // aos grupos correspondentes às suas áreas de interesse
    if (dto.status === 'completed' || dto.status === 'in_progress') {
      const interestAreas: string[] = updated.interestAreas || [];

      if (interestAreas.length > 0) {
        // Busca os grupos cujos nomes correspondem às áreas de interesse
        const matchingGroups = await this.prisma.group.findMany({
          where: {
            name: { in: interestAreas, mode: 'insensitive' },
          },
        });

        for (const group of matchingGroups) {
          // Usa upsert para evitar duplicatas
          await this.prisma.memberGroup.upsert({
            where: {
              userId_groupId: {
                userId: updated.userId,
                groupId: group.id,
              },
            },
            create: {
              userId: updated.userId,
              groupId: group.id,
              role: 'member',
            },
            update: {}, // mantém o registro existente sem alterar
          });
        }
      }
    }

    return updated;
  }

  remove(id: string) {
    return this.prisma.volunteer.delete({ where: { id } });
  }
}
