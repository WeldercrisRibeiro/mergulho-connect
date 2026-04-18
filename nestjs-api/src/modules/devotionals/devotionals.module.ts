import { Module } from '@nestjs/common';
import { DevotionalsService } from './devotionals.service';
import { DevotionalsController } from './devotionals.controller';
@Module({ controllers: [DevotionalsController], providers: [DevotionalsService] })
export class DevotionalsModule {}
