import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateProfileDto) { return this.prisma.profile.create({ data: dto as any }); }
  findAll() { return this.prisma.profile.findMany({ orderBy: { fullName: 'asc' } }); }
  findOne(id: string) { return this.prisma.profile.findUnique({ where: { id } }); }
  findByUserId(userId: string) { return this.prisma.profile.findUnique({ where: { userId } }); }
  findByPhone(whatsappPhone: string) { return this.prisma.profile.findFirst({ where: { whatsappPhone } }); }
  update(id: string, dto: UpdateProfileDto) { return this.prisma.profile.update({ where: { id }, data: dto as any }); }
  updateByUserId(userId: string, dto: UpdateProfileDto) { return this.prisma.profile.update({ where: { userId }, data: dto as any }); }
  remove(id: string) { return this.prisma.profile.delete({ where: { id } }); }
}
