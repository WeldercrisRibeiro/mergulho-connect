import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRolesService } from './user-roles.service';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Roles } from '../auth/roles.decorator';

@ApiTags('User Roles')
@ApiBearerAuth()
@Controller('user-roles')
export class UserRolesController {
  constructor(private readonly service: UserRolesService) {}
  @Post() @Roles('admin_ccm') upsert(@Body() dto: CreateUserRoleDto) { return this.service.upsert(dto); }
  @Get() @Roles('admin_ccm') findAll() { return this.service.findAll(); }
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Request() req: any) {
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'admin_ccm';
    if (!isAdmin && req.user?.id !== userId) {
      throw new ForbiddenException('Você não pode consultar a role de outro usuário.');
    }
    return this.service.findByUser(userId);
  }
  @Patch(':id') @Roles('admin_ccm') update(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('admin_ccm') remove(@Param('id') id: string) { return this.service.remove(id); }
}
