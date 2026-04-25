import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreasuryEntriesService } from './treasury-entries.service';
import { CreateTreasuryEntryDto } from './dto/create-treasury-entry.dto';
import { UpdateTreasuryEntryDto } from './dto/update-treasury-entry.dto';

@ApiTags('Treasury Entries')
@ApiBearerAuth()
@Controller('treasury-entries')
export class TreasuryEntriesController {
  constructor(private readonly service: TreasuryEntriesService) {}
  @Post() create(@Body() dto: CreateTreasuryEntryDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'paymentType', required: false }) findAll(@Query('paymentType') paymentType?: string) { return this.service.findAll(paymentType); }
  @Get('summary') summary() { return this.service.summary(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateTreasuryEntryDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
