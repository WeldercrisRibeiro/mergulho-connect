import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GroupRoutinesService } from './group-routines.service';
import { CreateGroupRoutineDto } from './dto/create-group-routine.dto';
import { UpdateGroupRoutineDto } from './dto/update-group-routine.dto';

@ApiTags('Group Routines')
@ApiBearerAuth()
@Controller('group-routines')
export class GroupRoutinesController {
  constructor(private readonly service: GroupRoutinesService) {}
  @Post() create(@Body() dto: CreateGroupRoutineDto) { return this.service.create(dto); }
  @Get() @ApiQuery({ name: 'groupId', required: false }) @ApiQuery({ name: 'includeRoles', required: false }) findAll(@Query('groupId') groupId?: string, @Query('includeRoles') includeRoles?: string) { return this.service.findAll(groupId, includeRoles === 'true'); }
  @Get('groups') 
  @ApiQuery({ name: 'groupIds', required: true }) 
  @ApiQuery({ name: 'roleId', required: false }) 
  findByGroups(@Query('groupIds') groupIds: string, @Query('roleId') roleId?: string) { 
    return this.service.findByGroups(groupIds, roleId); 
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateGroupRoutineDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
