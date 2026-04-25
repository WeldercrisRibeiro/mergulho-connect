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
  
  @Get()
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  find(@Query('eventId') eventId?: string, @Query('userId') userId?: string) {
    if (eventId) return this.service.findByEvent(eventId);
    if (userId) return this.service.findByUser(userId);
    return [];
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Delete()
  @ApiQuery({ name: 'eventId', required: true })
  @ApiQuery({ name: 'userId', required: true })
  removeByEventAndUser(@Query('eventId') eventId: string, @Query('userId') userId: string) {
    return this.service.removeByEventAndUser(eventId, userId);
  }
}
