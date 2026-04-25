import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberGroupDto } from './dto/create-member-group.dto';
import { UpdateMemberGroupDto } from './dto/update-member-group.dto';

@Injectable()
export class MemberGroupsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateMemberGroupDto) { return this.prisma.memberGroup.create({ data: dto as any }); }
  
  createBulk(groupId: string, userIds: string[]) {
    const data = userIds.map(userId => ({ groupId, userId }));
    return this.prisma.memberGroup.createMany({ data, skipDuplicates: true });
  }

  findAll() { return this.prisma.memberGroup.findMany({ include: { group: true } }); }
  findByGroup(groupId: string) { return this.prisma.memberGroup.findMany({ where: { groupId }, orderBy: { joinedAt: 'desc' } }); }
  findByUser(userId: string) { return this.prisma.memberGroup.findMany({ where: { userId }, include: { group: true } }); }
  update(id: string, dto: UpdateMemberGroupDto) { return this.prisma.memberGroup.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.memberGroup.delete({ where: { id } }); }
  removeByGroup(groupId: string) { return this.prisma.memberGroup.deleteMany({ where: { groupId } }); }
  removeByUserAndGroup(userId: string, groupId: string) { return this.prisma.memberGroup.deleteMany({ where: { userId, groupId } }); }
}
