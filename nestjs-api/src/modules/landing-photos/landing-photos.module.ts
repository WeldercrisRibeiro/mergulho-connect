import { Module } from '@nestjs/common';
import { LandingPhotosService } from './landing-photos.service';
import { LandingPhotosController } from './landing-photos.controller';
@Module({ controllers: [LandingPhotosController], providers: [LandingPhotosService] })
export class LandingPhotosModule {}
