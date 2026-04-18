import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}
  @Post() create(@Body() dto: CreateProfileDto) { return this.service.create(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get('user/:userId') findByUserId(@Param('userId') userId: string) { return this.service.findByUserId(userId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch('user/:userId') updateByUserId(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) { return this.service.updateByUserId(userId, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProfileDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
