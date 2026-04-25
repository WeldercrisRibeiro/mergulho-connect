import { Module } from '@nestjs/common';
import { KidsCheckinsService } from './kids-checkins.service';
import { KidsCheckinsController } from './kids-checkins.controller';
@Module({ controllers: [KidsCheckinsController], providers: [KidsCheckinsService] })
export class KidsCheckinsModule {}
