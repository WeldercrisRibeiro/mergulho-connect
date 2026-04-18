import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventCheckinsService } from './event-checkins.service';
import { CreateEventCheckinDto } from './dto/create-event-checkin.dto';

@ApiTags('Event Checkins')
@ApiBearerAuth()
@Controller('event-checkins')
export class EventCheckinsController {
  constructor(private readonly service: EventCheckinsService) {}
  @Post() create(@Body() dto: CreateEventCheckinDto) { return this.service.create(dto); }
  @Get('event/:eventId') findByEvent(@Param('eventId') eventId: string) { return this.service.findByEvent(eventId); }
  @Get('user/:userId') findByUser(@Param('userId') userId: string) { return this.service.findByUser(userId); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
