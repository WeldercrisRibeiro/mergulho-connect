import { Module } from '@nestjs/common';
import { LandingTestimonialsService } from './landing-testimonials.service';
import { LandingTestimonialsController } from './landing-testimonials.controller';
@Module({ controllers: [LandingTestimonialsController], providers: [LandingTestimonialsService] })
export class LandingTestimonialsModule {}
