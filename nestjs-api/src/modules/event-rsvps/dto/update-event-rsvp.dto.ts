import { PartialType } from '@nestjs/swagger';
import { CreateEventRsvpDto } from './create-event-rsvp.dto';
export class UpdateEventRsvpDto extends PartialType(CreateEventRsvpDto) {}
