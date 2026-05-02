import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TreasuryEntriesService } from './treasury-entries.service';
import { CreateTreasuryEntryDto } from './dto/create-treasury-entry.dto';
import { UpdateTreasuryEntryDto } from './dto/update-treasury-entry.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Tesouraria: apenas roles financeiras podem ver e manipular dados
const TREASURY_ROLES = ['admin', 'admin_ccm', 'gerente', 'pastor'] as const;

@ApiTags('Treasury Entries')
@ApiBearerAuth()
@Controller('treasury-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'admin_ccm', 'gerente', 'pastor')
export class TreasuryEntriesController {
  constructor(private readonly service: TreasuryEntriesService) {}

  /** Registrar entrada — roles financeiras */
  @Post()
  create(@Body() dto: CreateTreasuryEntryDto) { return this.service.create(dto); }

  /** Listar entradas — roles financeiras */
  @Get()
  @ApiQuery({ name: 'paymentType', required: false })
  findAll(@Query('paymentType') paymentType?: string) { return this.service.findAll(paymentType); }

  /** Resumo financeiro — roles financeiras */
  @Get('summary')
  summary() { return this.service.summary(); }

  /** Buscar entrada por ID — roles financeiras */
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  /** Editar entrada — roles financeiras */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTreasuryEntryDto) { return this.service.update(id, dto); }

  /** Deletar entrada — apenas admin ou admin_ccm */
  @Delete(':id')
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
