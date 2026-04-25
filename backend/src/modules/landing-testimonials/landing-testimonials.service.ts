import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandingTestimonialDto } from './dto/create-landing-testimonial.dto';
import { UpdateLandingTestimonialDto } from './dto/update-landing-testimonial.dto';

@Injectable()
export class LandingTestimonialsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateLandingTestimonialDto) { return this.prisma.landingTestimonial.create({ data: dto }); }
  findAll() { return this.prisma.landingTestimonial.findMany({ orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.landingTestimonial.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateLandingTestimonialDto) { return this.prisma.landingTestimonial.update({ where: { id }, data: dto }); }
  remove(id: string) { return this.prisma.landingTestimonial.delete({ where: { id } }); }
}
