import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevotionalsService } from './devotionals.service';
import { CreateDevotionalDto } from './dto/create-devotional.dto';
import { UpdateDevotionalDto } from './dto/update-devotional.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Devotionals')
@ApiBearerAuth()
@Controller('devotionals')
export class DevotionalsController {
  constructor(private readonly service: DevotionalsService) {}

  /** Criar devocional — apenas admin, admin_ccm, lider ou pastor */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  create(@Body() dto: CreateDevotionalDto) { return this.service.create(dto); }

  /** Listar devocionais — qualquer usuário autenticado */
  @Get()
  @ApiQuery({ name: 'isActive', required: false })
  findAll(@Query('isActive') isActive?: string) {
    return this.service.findAll(isActive !== undefined ? isActive === 'true' : undefined);
  }

  /** Devocional ativo do dia — qualquer usuário autenticado */
  @Get('active')
  findActive() { return this.service.findActive(); }

  /** Buscar devocional por ID — qualquer usuário autenticado */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Editar devocional — apenas admin, admin_ccm, lider ou pastor */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  update(@Param('id') id: string, @Body() dto: UpdateDevotionalDto) { return this.service.update(id, dto); }

  /** Deletar devocional — apenas admin ou admin_ccm */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
