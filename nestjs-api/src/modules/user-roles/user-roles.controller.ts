import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('User Roles')
@ApiBearerAuth()
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}
  @Post() upsert(@Body() dto: CreateUserRoleDto) { return this.service.upsert(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get('user/:userId') findByUser(@Param('userId') userId: string) { return this.service.findByUser(userId); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
