import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventRegistrationsService } from './event-registrations.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';

@ApiTags('Event Registrations')
@ApiBearerAuth()
@Controller('event-registrations')
export class EventRegistrationsController {
  constructor(private readonly service: EventRegistrationsService) {}
  
  @Post() create(@Body() dto: CreateEventRegistrationDto) { return this.service.create(dto); }
  
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

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventRegistrationDto) { return this.service.update(id, dto); }
  
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Delete()
  @ApiQuery({ name: 'eventId', required: true })
  @ApiQuery({ name: 'userId', required: true })
  removeByEventAndUser(@Query('eventId') eventId: string, @Query('userId') userId: string) {
    return this.service.removeByEventAndUser(eventId, userId);
  }
}
