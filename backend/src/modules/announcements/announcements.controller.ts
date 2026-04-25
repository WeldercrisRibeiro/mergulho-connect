import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}
  @Post() create(@Body() dto: CreateAnnouncementDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'groupId', required: false }) findAll(@Query('groupId') groupId?: string) { return this.service.findAll(groupId); }
  @Get('unread-count') @ApiQuery({ name: 'lastChecked', required: true }) getUnreadCount(@Query('lastChecked') lastChecked: string) { return this.service.getUnreadCount(lastChecked); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
