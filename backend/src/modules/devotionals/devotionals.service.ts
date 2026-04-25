import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDevotionalDto } from './dto/create-devotional.dto';
import { UpdateDevotionalDto } from './dto/update-devotional.dto';

@Injectable()
export class DevotionalsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateDevotionalDto) { return this.prisma.devotional.create({ data: dto as any }); }
  findAll(isActive?: boolean) {
    return this.prisma.devotional.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { publishDate: 'desc' },
      include: { likes: true },
    });
  }
  findActive() { return this.prisma.devotional.findMany({ where: { isActive: true, status: 'publicado' }, orderBy: { publishDate: 'desc' } }); }
  findOne(id: string) { return this.prisma.devotional.findUnique({ where: { id }, include: { likes: true } }); }
  update(id: string, dto: UpdateDevotionalDto) { return this.prisma.devotional.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.devotional.delete({ where: { id } }); }
}
