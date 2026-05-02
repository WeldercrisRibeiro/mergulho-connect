import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('checkins')
@ApiBearerAuth()
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly service: CheckinsService) { }

  /** Criar check-in — qualquer usuário autenticado pode fazer check-in do seu filho */
  @Post()
  create(@Body() dto: CreateCheckinDto) { return this.service.create(dto); }

  /** Listar check-ins — líderes/admin para gestão, membro vê só os seus via guardianId */
  @Get()
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'guardianId', required: false })
  findAll(
    @Query('eventId') eventId?: string,
    @Query('status') status?: string,
    @Query('guardianId') guardianId?: string,
    @Req() req?,
  ) {
    // Membros comuns só podem ver os próprios check-ins
    const isPrivileged = ['admin', 'admin_ccm', 'lider', 'pastor'].includes(req?.user?.role);
    const resolvedGuardianId = isPrivileged ? guardianId : req?.user?.id;
    return this.service.findAll(eventId, status, resolvedGuardianId);
  }

  /** Buscar por token — usado pelo display público de check-in */
  @Get('token/:token')
  findByToken(@Param('token') token: string) { return this.service.findByToken(token); }

  /** Buscar check-in por ID */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Atualizar check-in (status, callRequested) — líderes ou admin */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  update(@Param('id') id: string, @Body() dto: UpdateCheckinDto) { return this.service.update(id, dto); }

  /** Deletar check-in — apenas admin */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
