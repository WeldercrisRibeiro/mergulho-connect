import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VolunteerSchedulesService } from './volunteer-schedules.service';
import { CreateVolunteerScheduleDto } from './dto/create-volunteer-schedule.dto';
import { UpdateVolunteerScheduleDto } from './dto/update-volunteer-schedule.dto';

@ApiTags('Volunteer Schedules')
@ApiBearerAuth()
@Controller('volunteer-schedules')
export class VolunteerSchedulesController {
  constructor(private readonly service: VolunteerSchedulesService) {}
  @Post() create(@Body() dto: CreateVolunteerScheduleDto) { return this.service.create(dto); }
  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(@Query('groupId') groupId?: string, @Query('userId') userId?: string) { return this.service.findAll(groupId, userId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateVolunteerScheduleDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
