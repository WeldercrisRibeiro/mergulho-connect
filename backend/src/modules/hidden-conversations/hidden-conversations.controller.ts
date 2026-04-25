import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HiddenConversationsService } from './hidden-conversations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Hidden Conversations')
@ApiBearerAuth()
@Controller('hidden-conversations')
export class HiddenConversationsController {
  constructor(private readonly service: HiddenConversationsService) {}
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.service.findAll(); }
}