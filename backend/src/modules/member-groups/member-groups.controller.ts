import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MemberGroupsService } from './member-groups.service';
import { CreateMemberGroupDto } from './dto/create-member-group.dto';
import { UpdateMemberGroupDto } from './dto/update-member-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Member Groups')
@ApiBearerAuth()
@Controller('member-groups')
export class MemberGroupsController {
  constructor(private readonly service: MemberGroupsService) {}
  @Post() @Roles('admin_ccm') create(@Body() dto: CreateMemberGroupDto) { return this.service.create(dto); }
  
  @Post('bulk')
  @Roles('admin_ccm')
  async createBulk(@Body() data: { groupId: string, userIds: string[] }) {
    return this.service.createBulk(data.groupId, data.userIds);
  }

  @Get() @Roles('admin_ccm') findAll() { return this.service.findAll(); }
  @Get('group/:groupId') @Roles('admin_ccm') findByGroup(@Param('groupId') id: string) { return this.service.findByGroup(id); }
  @Get('user/:userId')
  findByUser(@Param('userId') id: string, @Request() req: any) {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'admin_ccm';
    if (!isAdmin && req.user?.id !== id) {
      throw new ForbiddenException('Você não pode consultar grupos de outro usuário.');
    }
    return this.service.findByUser(id);
  }
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req) { return this.service.findByUser(req.user.id); }
  @Patch(':id') @Roles('admin_ccm') update(@Param('id') id: string, @Body() dto: UpdateMemberGroupDto) { return this.service.update(id, dto); }

  @Delete()
  @ApiQuery({ name: 'groupId', required: false })
  @Roles('admin_ccm')
  async removeBulk(@Query('groupId') groupId?: string) {
    if (groupId) {
      return this.service.removeByGroup(groupId);
    }
    return { success: false, message: 'groupId is required' };
  }

  @Delete(':id') @Roles('admin_ccm') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Delete('leave/:userId/:groupId')
  leave(@Param('userId') userId: string, @Param('groupId') groupId: string, @Request() req: any) {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'admin_ccm';
    if (!isAdmin && req.user?.id !== userId) {
      throw new ForbiddenException('Você não pode remover outro usuário de um grupo.');
    }
    return this.service.removeByUserAndGroup(userId, groupId);
  }
}
