import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDevotionalLikeDto } from './dto/create-devotional-like.dto';

@Injectable()
export class DevotionalLikesService {
  constructor(private prisma: PrismaService) {}

  // Suporta filtros opcionais por devotionalId e/ou userId
  findAll(devotionalId?: string, userId?: string) {
    const where: any = {};
    if (devotionalId) where.devotionalId = devotionalId;
    if (userId) where.userId = userId;
    return this.prisma.devotionalLike.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async toggle(dto: CreateDevotionalLikeDto) {
    const existing = await this.prisma.devotionalLike.findUnique({
      where: { devotionalId_userId: { devotionalId: dto.devotionalId, userId: dto.userId } },
    });
    if (existing) {
      await this.prisma.devotionalLike.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.devotionalLike.create({ data: dto });
    return { liked: true };
  }

  remove(id: string) {
    return this.prisma.devotionalLike.delete({ where: { id } });
  }

  findByDevotional(devotionalId: string) {
    return this.prisma.devotionalLike.findMany({ where: { devotionalId }, orderBy: { createdAt: 'desc' } });
  }

  countByDevotional(devotionalId: string) {
    return this.prisma.devotionalLike.count({ where: { devotionalId } });
  }
}
