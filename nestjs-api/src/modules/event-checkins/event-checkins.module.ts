import { Module } from '@nestjs/common';
import { EventCheckinsService } from './event-checkins.service';
import { EventCheckinsController } from './event-checkins.controller';
@Module({ controllers: [EventCheckinsController], providers: [EventCheckinsService] })
export class EventCheckinsModule {}
