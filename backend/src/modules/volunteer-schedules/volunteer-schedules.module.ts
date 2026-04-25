import { Module } from '@nestjs/common';
import { VolunteerSchedulesService } from './volunteer-schedules.service';
import { VolunteerSchedulesController } from './volunteer-schedules.controller';
@Module({ controllers: [VolunteerSchedulesController], providers: [VolunteerSchedulesService] })
export class VolunteerSchedulesModule {}
