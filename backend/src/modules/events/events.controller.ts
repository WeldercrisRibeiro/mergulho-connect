import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}
  @Post() create(@Body() dto: CreateEventDto) { return this.service.create(dto); }
  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'isPublic', required: false })
  @ApiQuery({ name: 'isGeneral', required: false })
  findAll(@Query('groupId') groupId?: string, @Query('isPublic') isPublic?: string, @Query('isGeneral') isGeneral?: string) {
    return this.service.findAll(
      groupId,
      isPublic !== undefined ? isPublic === 'true' : undefined,
      isGeneral !== undefined ? isGeneral === 'true' : undefined,
    );
  }
  @Get('public') findPublic() { return this.service.findPublic(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
