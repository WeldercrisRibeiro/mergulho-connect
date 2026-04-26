import { Controller, Post, Body, Delete, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_ccm')
export class AdminUsersController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createUser(@Body() dto: CreateAdminUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password || '123456', 10);
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
        }
      });
      await tx.profile.create({
        data: {
          userId: u.id,
          fullName: dto.fullName,
          username: dto.username,
          whatsappPhone: dto.whatsappPhone
        }
      });
      await tx.userRole.create({
        data: { userId: u.id, role: dto.role || 'membro' }
      });
      if (dto.groups && dto.groups.length > 0) {
        for (const g of dto.groups) {
          await tx.memberGroup.create({
            data: { userId: u.id, groupId: g.id, role: g.role || 'member' }
          });
        }
      }
      return { userId: u.id };
    });
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateAdminUserDto) {
    return this.prisma.$transaction(async (tx) => {
      // Update email if provided
      if (dto.email) {
        await tx.user.update({
          where: { id },
          data: { email: dto.email }
        });
      }
      
      // Update profile
      await tx.profile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          fullName: dto.fullName,
          username: dto.username,
          whatsappPhone: dto.whatsappPhone
        },
        update: {
          fullName: dto.fullName,
          username: dto.username,
          whatsappPhone: dto.whatsappPhone
        }
      });

      // Update role
      if (dto.role) {
        await tx.userRole.upsert({
          where: { userId: id },
          create: { userId: id, role: dto.role },
          update: { role: dto.role }
        });
      }

      // Update groups
      if (dto.groups !== undefined) {
        await tx.memberGroup.deleteMany({ where: { userId: id } });
        for (const g of dto.groups) {
          await tx.memberGroup.create({
            data: { userId: id, groupId: g.id, role: g.role || 'member' }
          });
        }
      }
      return { success: true };
    });
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetAdminPasswordDto) {
    const password = dto.password || '123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    return { success: true };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    // Delete user automatically cascades to profile, user_roles etc if DB constraints set
    // Or we manually delete:
    await this.prisma.memberGroup.deleteMany({ where: { userId: id } });
    await this.prisma.userRole.deleteMany({ where: { userId: id } });
    await this.prisma.profile.deleteMany({ where: { userId: id } });
    await this.prisma.eventRsvp.deleteMany({ where: { userId: id } });
    await this.prisma.eventCheckin.deleteMany({ where: { userId: id } });
    await this.prisma.eventRegistration.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
