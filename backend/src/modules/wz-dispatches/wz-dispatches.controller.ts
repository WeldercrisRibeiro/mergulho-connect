import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseInterceptors, UploadedFiles, BadRequestException, UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { WzDispatchesService } from './wz-dispatches.service';
import { CreateWzDispatchDto } from './dto/create-wz-dispatch.dto';
import { UpdateWzDispatchDto } from './dto/update-wz-dispatch.dto';
import { SupabaseService } from '../upload/supabase.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('WZ Dispatches')
@ApiBearerAuth()
@Controller('dispatches')
export class WzDispatchesController {
  constructor(
    private readonly service: WzDispatchesService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB (limite WhatsApp)
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/ogg', 'application/pdf'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Tipo de arquivo não permitido.'), false);
      }
      cb(null, true);
    },
  }))
  async create(@Body() dto: CreateWzDispatchDto, @UploadedFiles() files: Express.Multer.File[]) {
    const dispatch = await this.service.create(dto);
    if (files?.length) {
      for (const file of files) {
        const publicUrl = await this.supabaseService.uploadFile(file);
        await this.service.createAttachment({
          dispatchId: dispatch.id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: publicUrl,
          mimetype: file.mimetype,
        });
      }
    }
    return this.service.findOne(dispatch.id);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('status') status?: string) { return this.service.findAll(status); }

  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Get(':id/logs') findLogs(@Param('id') id: string) { return this.service.findLogs(id); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB (limite WhatsApp)
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/ogg', 'application/pdf'];
      if (!allowed.includes(file.mimetype)) {
        return cb(new BadRequestException('Tipo de arquivo não permitido.'), false);
      }
      cb(null, true);
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWzDispatchDto & { kept_attachments?: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dispatch = await this.service.findOne(id);
    if (!dispatch) throw new BadRequestException('Disparo não encontrado.');
    if (dispatch.status === 'sending') throw new BadRequestException('Não é possível editar um disparo em andamento.');

    let keepIds: string[] = [];
    if (dto.kept_attachments) {
      try { keepIds = JSON.parse(dto.kept_attachments); } catch { keepIds = [dto.kept_attachments]; }
    }
    await this.service.removeAttachmentsByDispatch(id, keepIds);

    if (files?.length) {
      for (const file of files) {
        const publicUrl = await this.supabaseService.uploadFile(file);
        await this.service.createAttachment({
          dispatchId: id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: publicUrl,
          mimetype: file.mimetype,
        });
      }
    }
    await this.service.update(id, dto);
    return this.service.findOne(id);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm', 'lider')
  retry(@Param('id') id: string) { return this.service.retry(id); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

function getAttachmentType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}
