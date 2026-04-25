import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventRsvpsService } from './event-rsvps.service';
import { CreateEventRsvpDto } from './dto/create-event-rsvp.dto';
import { UpdateEventRsvpDto } from './dto/update-event-rsvp.dto';

@ApiTags('Event RSVPs')
@ApiBearerAuth()
@Controller('event-rsvps')
export class EventRsvpsController {
  constructor(private readonly service: EventRsvpsService) {}
  @Post() create(@Body() dto: CreateEventRsvpDto) { return this.service.create(dto); }
  @Get('event/:eventId') findByEvent(@Param('eventId') id: string) { return this.service.findByEvent(id); }
  @Get('user/:userId') findByUser(@Param('userId') id: string) { return this.service.findByUser(id); }
  
  @Get()
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  find(@Query('eventId') eventId?: string, @Query('userId') userId?: string) {
    if (eventId) return this.service.findByEvent(eventId);
    if (userId) return this.service.findByUser(userId);
    return [];
  }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventRsvpDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
