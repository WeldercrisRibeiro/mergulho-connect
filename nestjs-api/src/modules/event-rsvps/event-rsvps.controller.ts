import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventRsvpDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
