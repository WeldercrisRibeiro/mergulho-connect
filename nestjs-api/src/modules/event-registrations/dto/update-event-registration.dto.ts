import { PartialType } from '@nestjs/swagger';
import { CreateEventRegistrationDto } from './create-event-registration.dto';
export class UpdateEventRegistrationDto extends PartialType(CreateEventRegistrationDto) {}
