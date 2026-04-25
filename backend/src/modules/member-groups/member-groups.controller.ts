import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MemberGroupsService } from './member-groups.service';
import { CreateMemberGroupDto } from './dto/create-member-group.dto';
import { UpdateMemberGroupDto } from './dto/update-member-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Member Groups')
@ApiBearerAuth()
@Controller('member-groups')
export class MemberGroupsController {
  constructor(private readonly service: MemberGroupsService) {}
  @Post() create(@Body() dto: CreateMemberGroupDto) { return this.service.create(dto); }
  
  @Post('bulk')
  async createBulk(@Body() data: { groupId: string, userIds: string[] }) {
    return this.service.createBulk(data.groupId, data.userIds);
  }

  @Get() findAll() { return this.service.findAll(); }
  @Get('group/:groupId') findByGroup(@Param('groupId') id: string) { return this.service.findByGroup(id); }
  @Get('user/:userId') findByUser(@Param('userId') id: string) { return this.service.findByUser(id); }
  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Request() req) { return this.service.findByUser(req.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMemberGroupDto) { return this.service.update(id, dto); }

  @Delete()
  @ApiQuery({ name: 'groupId', required: false })
  async removeBulk(@Query('groupId') groupId?: string) {
    if (groupId) {
      return this.service.removeByGroup(groupId);
    }
    return { success: false, message: 'groupId is required' };
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Delete('leave/:userId/:groupId') leave(@Param('userId') userId: string, @Param('groupId') groupId: string) {
    return this.service.removeByUserAndGroup(userId, groupId);
  }
}
