import { Injectable } from '@nestjs/common';
import { EventRsvpsRepository } from './event-rsvps.repository';
import { CreateEventRsvpDto } from './dto/create-event-rsvp.dto';
import { UpdateEventRsvpDto } from './dto/update-event-rsvp.dto';

/**
 * Service de domínio para RSVP de eventos. Ele contém a lógica de aplicação
 * e orquestra operações usando o repositório.
 */
@Injectable()
export class EventRsvpsService {
  constructor(private readonly repository: EventRsvpsRepository) {}

  create(dto: CreateEventRsvpDto) {
    return this.repository.createOrUpdate(dto);
  }

  findByEvent(eventId: string) {
    return this.repository.findByEvent(eventId);
  }

  findByUser(userId: string) {
    return this.repository.findByUser(userId);
  }

  update(id: string, dto: UpdateEventRsvpDto) {
    return this.repository.update(id, dto);
  }

  remove(id: string) {
    return this.repository.remove(id);
  }
}
