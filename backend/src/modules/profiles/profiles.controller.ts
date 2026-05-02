import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_ROLES = ['admin', 'admin_ccm'];

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  // ─── CREATE ─────────────────────────────────────────────────────────────────
  /** Criar perfil — apenas admin (criação de perfis é feita no registro) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  @ApiOperation({ summary: 'Criar perfil de usuário (admin)' })
  @ApiResponse({ status: 201, description: 'Perfil criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Perfil já existe para este usuário.' })
  create(@Body() dto: CreateProfileDto) {
    return this.service.create(dto);
  }

  // ─── READ ALL ───────────────────────────────────────────────────────────────
  /** Listar todos os perfis — qualquer usuário autenticado */
  @Get()
  @ApiOperation({ summary: 'Listar todos os perfis' })
  @ApiResponse({ status: 200, description: 'Lista de perfis retornada.' })
  findAll() {
    return this.service.findAll();
  }

  // ─── READ BY USER ID ────────────────────────────────────────────────────────
  @Get('user/:userId')
  @ApiOperation({ summary: 'Buscar perfil pelo ID do usuário' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário', example: 'uuid-aqui' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  // ─── READ ONE ───────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  @ApiParam({ name: 'id', description: 'UUID do perfil', example: 'uuid-aqui' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ─── UPDATE BY USER ID ──────────────────────────────────────────────────────
  /** Atualizar por userId — apenas o próprio usuário ou admin */
  @Patch('user/:userId')
  @ApiOperation({ summary: 'Atualizar perfil pelo ID do usuário' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  updateByUserId(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
    @Req() req,
  ) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    if (!isAdmin && req.user.id !== userId) {
      throw new ForbiddenException('Você só pode editar o seu próprio perfil.');
    }
    return this.service.updateByUserId(userId, dto);
  }

  // ─── UPDATE ─────────────────────────────────────────────────────────────────
  /** Atualizar por ID do perfil — apenas admin */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  @ApiOperation({ summary: 'Atualizar perfil por ID (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do perfil' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(id, dto);
  }

  // ─── DELETE ─────────────────────────────────────────────────────────────────
  /** Deletar perfil — apenas admin */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  @ApiOperation({ summary: 'Remover perfil por ID (admin)' })
  @ApiParam({ name: 'id', description: 'UUID do perfil' })
  @ApiResponse({ status: 204, description: 'Perfil removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
