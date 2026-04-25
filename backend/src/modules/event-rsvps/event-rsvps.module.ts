import { Module } from '@nestjs/common';
import { EventRsvpsService } from './event-rsvps.service';
import { EventRsvpsController } from './event-rsvps.controller';
import { EventRsvpsRepository } from './event-rsvps.repository';

@Module({
  controllers: [EventRsvpsController],
  providers: [EventRsvpsService, EventRsvpsRepository],
})
export class EventRsvpsModule {}
