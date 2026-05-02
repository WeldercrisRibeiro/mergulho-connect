import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  /** Criar grupo/departamento — apenas admin ou admin_ccm */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  create(@Body() dto: CreateGroupDto) { return this.service.create(dto); }

  /** Listar grupos — qualquer usuário autenticado pode ver */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** Buscar grupo por ID — qualquer usuário autenticado */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Editar grupo — apenas admin ou admin_ccm */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) { return this.service.update(id, dto); }

  /** Deletar grupo — apenas admin ou admin_ccm */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
