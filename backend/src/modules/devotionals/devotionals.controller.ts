import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevotionalsService } from './devotionals.service';
import { CreateDevotionalDto } from './dto/create-devotional.dto';
import { UpdateDevotionalDto } from './dto/update-devotional.dto';

@ApiTags('Devotionals')
@ApiBearerAuth()
@Controller('devotionals')
export class DevotionalsController {
  constructor(private readonly service: DevotionalsService) {}
  @Post() create(@Body() dto: CreateDevotionalDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'isActive', required: false }) findAll(@Query('isActive') isActive?: string) {
    return this.service.findAll(isActive !== undefined ? isActive === 'true' : undefined);
  }
  @Get('active') findActive() { return this.service.findActive(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDevotionalDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
