import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateAnnouncementDto) { return this.prisma.announcement.create({ data: dto as any }); }
  findAll(groupId?: string) {
    return this.prisma.announcement.findMany({
      where: groupId ? { groupId } : {},
      orderBy: { createdAt: 'desc' },
      include: { group: true, creator: true },
    });
  }
  async getUnreadCount(lastChecked: string) {
    if (!lastChecked) return { count: 0 };
    const date = new Date(lastChecked);
    const count = await this.prisma.announcement.count({
      where: { createdAt: { gt: date } }
    });
    return { count };
  }
  findOne(id: string) { return this.prisma.announcement.findUnique({ where: { id }, include: { group: true, creator: true } }); }
  update(id: string, dto: UpdateAnnouncementDto) { return this.prisma.announcement.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.announcement.delete({ where: { id } }); }
}
