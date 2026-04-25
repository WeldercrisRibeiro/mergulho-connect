import { PartialType } from '@nestjs/swagger';
import { CreateLandingPhotoDto } from './create-landing-photo.dto';
export class UpdateLandingPhotoDto extends PartialType(CreateLandingPhotoDto) {}
