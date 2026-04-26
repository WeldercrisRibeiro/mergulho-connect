import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LandingTestimonialsService } from './landing-testimonials.service';
import { CreateLandingTestimonialDto } from './dto/create-landing-testimonial.dto';
import { UpdateLandingTestimonialDto } from './dto/update-landing-testimonial.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Landing Testimonials')
@Controller('landing-testimonials')
export class LandingTestimonialsController {
  constructor(private readonly service: LandingTestimonialsService) {}
  @Post() create(@Body() dto: CreateLandingTestimonialDto) { return this.service.create(dto); }
  @Get()
  @Public()
  findAll() { return this.service.findAll(); }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateLandingTestimonialDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
