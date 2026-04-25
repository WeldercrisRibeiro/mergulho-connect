import { PartialType } from '@nestjs/swagger';
import { CreateLandingTestimonialDto } from './create-landing-testimonial.dto';
export class UpdateLandingTestimonialDto extends PartialType(CreateLandingTestimonialDto) {}
