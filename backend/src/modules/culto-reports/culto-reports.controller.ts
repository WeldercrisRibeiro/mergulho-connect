import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CultoReportsService } from './culto-reports.service';
import { CreateCultoReportDto } from './dto/create-culto-report.dto';
import { UpdateCultoReportDto } from './dto/update-culto-report.dto';

@ApiTags('Culto Reports')
@ApiBearerAuth()
@Controller('culto-reports')
export class CultoReportsController {
  constructor(private readonly service: CultoReportsService) {}
  @Post() create(@Body() dto: CreateCultoReportDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'eventId', required: false }) findAll(@Query('eventId') eventId?: string) { return this.service.findAll(eventId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCultoReportDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
