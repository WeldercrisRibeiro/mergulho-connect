import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UserRolesService {
  constructor(private prisma: PrismaService) {}
  upsert(dto: CreateUserRoleDto) {
    return this.prisma.userRole.upsert({
      where: { userId: dto.userId },
      create: dto as any,
      update: { role: dto.role as any },
    });
  }
  findAll() { return this.prisma.userRole.findMany(); }
  findByUser(userId: string) { return this.prisma.userRole.findUnique({ where: { userId } }); }
  update(id: string, dto: UpdateUserRoleDto) { return this.prisma.userRole.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.userRole.delete({ where: { id } }); }
}
