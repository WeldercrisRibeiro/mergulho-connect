import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  /** Criar evento — apenas admin, admin_ccm ou lider */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  create(@Body() dto: CreateEventDto) { return this.service.create(dto); }

  /** Listar eventos — qualquer usuário autenticado */
  @Get()
  @ApiQuery({ name: 'groupId', required: false })
  @ApiQuery({ name: 'isPublic', required: false })
  @ApiQuery({ name: 'isGeneral', required: false })
  findAll(
    @Query('groupId') groupId?: string,
    @Query('isPublic') isPublic?: string,
    @Query('isGeneral') isGeneral?: string,
  ) {
    return this.service.findAll(
      groupId,
      isPublic !== undefined ? isPublic === 'true' : undefined,
      isGeneral !== undefined ? isGeneral === 'true' : undefined,
    );
  }

  /** Eventos públicos — sem autenticação (landing page) */
  @Get('public')
  @Public()
  findPublic() { return this.service.findPublic(); }

  /** Buscar evento por ID — qualquer usuário autenticado */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Editar evento — apenas admin, admin_ccm, lider ou pastor */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider', 'pastor')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) { return this.service.update(id, dto); }

  /** Deletar evento — apenas admin ou admin_ccm */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
