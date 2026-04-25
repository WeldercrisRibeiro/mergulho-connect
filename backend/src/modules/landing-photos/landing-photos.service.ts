import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLandingPhotoDto } from './dto/create-landing-photo.dto';
import { UpdateLandingPhotoDto } from './dto/update-landing-photo.dto';

@Injectable()
export class LandingPhotosService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateLandingPhotoDto) { return this.prisma.landingPhoto.create({ data: dto as any }); }
  findAll(isBanner?: boolean) { return this.prisma.landingPhoto.findMany({ where: isBanner !== undefined ? { isBanner } : {}, orderBy: { priority: 'asc' } }); }
  findOne(id: string) { return this.prisma.landingPhoto.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateLandingPhotoDto) { return this.prisma.landingPhoto.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.landingPhoto.delete({ where: { id } }); }
}
