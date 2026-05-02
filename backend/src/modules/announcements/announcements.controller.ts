import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  /** Criar comunicado — líderes, pastores e admins */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  create(@Body() dto: CreateAnnouncementDto) { return this.service.create(dto); }

  /** Listar comunicados — qualquer usuário autenticado */
  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  findAll(@Query('groupId') groupId?: string) { return this.service.findAll(groupId); }

  /** Contagem de não lidos — qualquer usuário autenticado */
  @Get('unread-count')
  @ApiQuery({ name: 'lastChecked', required: true })
  getUnreadCount(@Query('lastChecked') lastChecked: string) { return this.service.getUnreadCount(lastChecked); }

  /** Buscar comunicado por ID — qualquer usuário autenticado */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Editar comunicado — líderes, pastores e admins */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) { return this.service.update(id, dto); }

  /** Deletar comunicado — apenas admin */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
