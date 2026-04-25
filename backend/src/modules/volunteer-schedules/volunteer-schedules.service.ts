import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVolunteerScheduleDto } from './dto/create-volunteer-schedule.dto';
import { UpdateVolunteerScheduleDto } from './dto/update-volunteer-schedule.dto';

@Injectable()
export class VolunteerSchedulesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateVolunteerScheduleDto) { return this.prisma.volunteerSchedule.create({ data: dto as any }); }
  findAll(groupId?: string, userId?: string) {
    return this.prisma.volunteerSchedule.findMany({
      where: { ...(groupId ? { groupId } : {}), ...(userId ? { itemUserId: userId } : {}) },
      orderBy: { scheduleDate: 'desc' }, include: { group: true, itemUser: true },
    });
  }
  findOne(id: string) { return this.prisma.volunteerSchedule.findUnique({ where: { id }, include: { group: true, itemUser: true } }); }
  update(id: string, dto: UpdateVolunteerScheduleDto) { return this.prisma.volunteerSchedule.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.volunteerSchedule.delete({ where: { id } }); }
}
