import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DevotionalLikesService } from './devotional-likes.service';
import { CreateDevotionalLikeDto } from './dto/create-devotional-like.dto';

@ApiTags('Devotional Likes')
@ApiBearerAuth()
@Controller('devotional-likes')
export class DevotionalLikesController {
  constructor(private readonly service: DevotionalLikesService) {}
  @Post('toggle') toggle(@Body() dto: CreateDevotionalLikeDto) { return this.service.toggle(dto); }
  @Get('devotional/:devotionalId') findByDevotional(@Param('devotionalId') id: string) { return this.service.findByDevotional(id); }
  @Get('devotional/:devotionalId/count') countByDevotional(@Param('devotionalId') id: string) { return this.service.countByDevotional(id); }
}
