import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseInterceptors, UploadedFiles, BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { WzDispatchesService } from './wz-dispatches.service';
import { CreateWzDispatchDto } from './dto/create-wz-dispatch.dto';
import { UpdateWzDispatchDto } from './dto/update-wz-dispatch.dto';

const uploadsDir = process.env.UPLOADS_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

@ApiTags('WZ Dispatches')
@ApiBearerAuth()
@Controller('dispatches')
export class WzDispatchesController {
  constructor(private readonly service: WzDispatchesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
  }))
  async create(@Body() dto: CreateWzDispatchDto, @UploadedFiles() files: Express.Multer.File[]) {
    const dispatch = await this.service.create(dto);
    if (files?.length) {
      for (const file of files) {
        await this.service.createAttachment({
          dispatchId: dispatch.id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: file.path,
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({
      destination: uploadsDir,
      filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
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
        await this.service.createAttachment({
          dispatchId: id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
        });
      }
    }
    await this.service.update(id, dto);
    return this.service.findOne(id);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string) { return this.service.retry(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}

function getAttachmentType(mimetype: string): string {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'document';
}
