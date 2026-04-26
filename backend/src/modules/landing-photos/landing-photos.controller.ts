import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { LandingPhotosService } from './landing-photos.service';
import { CreateLandingPhotoDto } from './dto/create-landing-photo.dto';
import { UpdateLandingPhotoDto } from './dto/update-landing-photo.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Landing Photos')
@Controller('landing-photos')
export class LandingPhotosController {
  constructor(private readonly service: LandingPhotosService) {}
  @Post() create(@Body() dto: CreateLandingPhotoDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'isBanner', required: false })
  @Public()
  findAll(@Query('isBanner') isBanner?: string) { return this.service.findAll(isBanner !== undefined ? isBanner === 'true' : undefined); }
  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateLandingPhotoDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
