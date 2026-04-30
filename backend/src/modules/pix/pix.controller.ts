import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { PixService } from './pix.service';
import { CreatePixDto } from './dto/create-pix.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('Pix')
@ApiBearerAuth()
@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Get('gerar')
  @Public()
  @ApiOperation({ summary: 'Gera o payload (BR Code) para um QR Code Pix estático' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  gerar(@Query() query: CreatePixDto) {
    return this.pixService.gerarPayload(query);
  }
}
