import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventReportsService } from './event-reports.service';
import { CreateEventReportDto } from './dto/create-event-report.dto';
import { UpdateEventReportDto } from './dto/update-event-report.dto';

@ApiTags('Event Reports')
@ApiBearerAuth()
@Controller('event-reports')
export class EventReportsController {
  constructor(private readonly service: EventReportsService) {}
  @Post() create(@Body() dto: CreateEventReportDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'groupId', required: false }) @ApiQuery({ name: 'eventId', required: false })
  findAll(@Query('groupId') groupId?: string, @Query('eventId') eventId?: string) { return this.service.findAll(groupId, eventId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventReportDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
