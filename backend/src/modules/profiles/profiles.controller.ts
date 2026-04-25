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

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar perfil de usuário' })
  @ApiResponse({ status: 201, description: 'Perfil criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Perfil já existe para este usuário.' })
  create(@Body() dto: CreateProfileDto) {
    return this.service.create(dto);
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Listar todos os perfis' })
  @ApiResponse({ status: 200, description: 'Lista de perfis retornada.' })
  findAll() {
    return this.service.findAll();
  }

  // ─── READ BY USER ID ──────────────────────────────────────────────────────
  @Get('user/:userId')
  @ApiOperation({ summary: 'Buscar perfil pelo ID do usuário' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário', example: 'uuid-aqui' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findByUserId(@Param('userId') userId: string) {
    return this.service.findByUserId(userId);
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  @ApiParam({ name: 'id', description: 'UUID do perfil', example: 'uuid-aqui' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ─── UPDATE BY USER ID ────────────────────────────────────────────────────
  @Patch('user/:userId')
  @ApiOperation({ summary: 'Atualizar perfil pelo ID do usuário' })
  @ApiParam({ name: 'userId', description: 'UUID do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  updateByUserId(
    @Param('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.service.updateByUserId(userId, dto);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar perfil por ID' })
  @ApiParam({ name: 'id', description: 'UUID do perfil' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    return this.service.update(id, dto);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover perfil por ID' })
  @ApiParam({ name: 'id', description: 'UUID do perfil' })
  @ApiResponse({ status: 204, description: 'Perfil removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
