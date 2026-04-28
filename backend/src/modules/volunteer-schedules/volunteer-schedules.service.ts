import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVolunteerScheduleDto } from './dto/create-volunteer-schedule.dto';
import { UpdateVolunteerScheduleDto } from './dto/update-volunteer-schedule.dto';

@Injectable()
export class VolunteerSchedulesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateVolunteerScheduleDto) {
    const data = {
      ...dto,
      scheduleDate: new Date(dto.scheduleDate),
    };
    return this.prisma.volunteerSchedule.create({ data: data as any });
  }
  findAll(groupIds?: string, userId?: string) {
    const where: any = {};
    if (groupIds) {
      const ids = groupIds.split(',');
      where.groupId = { in: ids };
    }
    if (userId) {
      where.itemUserId = userId;
    }
    return this.prisma.volunteerSchedule.findMany({
      where,
      orderBy: { scheduleDate: 'desc' },
      include: { group: true, itemUser: true },
    });
  }
  findOne(id: string) { return this.prisma.volunteerSchedule.findUnique({ where: { id }, include: { group: true, itemUser: true } }); }
  update(id: string, dto: UpdateVolunteerScheduleDto) {
    const data = { ...dto };
    if (dto.scheduleDate) {
      data.scheduleDate = new Date(dto.scheduleDate) as any;
    }
    return this.prisma.volunteerSchedule.update({ where: { id }, data: data as any });
  }
  remove(id: string) { return this.prisma.volunteerSchedule.delete({ where: { id } }); }
}
