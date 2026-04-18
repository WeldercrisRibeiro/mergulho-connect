import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventRegistrationDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
