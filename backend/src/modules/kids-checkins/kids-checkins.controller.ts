import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KidsCheckinsService } from './kids-checkins.service';
import { CreateKidsCheckinDto } from './dto/create-kids-checkin.dto';
import { UpdateKidsCheckinDto } from './dto/update-kids-checkin.dto';

@ApiTags('Kids Checkins')
@ApiBearerAuth()
@Controller('checkins')
export class KidsCheckinsController {
  constructor(private readonly service: KidsCheckinsService) { }
  @Post() create(@Body() dto: CreateKidsCheckinDto) { return this.service.create(dto); }
  @Get()
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('eventId') eventId?: string, @Query('status') status?: string) { return this.service.findAll(eventId, status); }
  @Get('token/:token') findByToken(@Param('token') token: string) { return this.service.findByToken(token); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateKidsCheckinDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
