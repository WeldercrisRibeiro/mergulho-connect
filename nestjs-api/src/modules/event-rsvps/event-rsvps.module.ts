import { Module } from '@nestjs/common';
import { EventRsvpsService } from './event-rsvps.service';
import { EventRsvpsController } from './event-rsvps.controller';
@Module({ controllers: [EventRsvpsController], providers: [EventRsvpsService] })
export class EventRsvpsModule {}
