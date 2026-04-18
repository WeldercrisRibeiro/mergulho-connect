import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDevotionalLikeDto } from './dto/create-devotional-like.dto';

@Injectable()
export class DevotionalLikesService {
  constructor(private prisma: PrismaService) {}

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

  findByDevotional(devotionalId: string) {
    return this.prisma.devotionalLike.findMany({ where: { devotionalId }, orderBy: { createdAt: 'desc' } });
  }

  countByDevotional(devotionalId: string) {
    return this.prisma.devotionalLike.count({ where: { devotionalId } });
  }
}
