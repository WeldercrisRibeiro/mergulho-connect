import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevotionalLikesService } from './devotional-likes.service';
import { CreateDevotionalLikeDto } from './dto/create-devotional-like.dto';

@ApiTags('Devotional Likes')
@ApiBearerAuth()
@Controller('devotional-likes')
export class DevotionalLikesController {
  constructor(private readonly service: DevotionalLikesService) {}

  // GET /devotional-likes?devotionalId=xxx&userId=yyy  (usado pelo frontend)
  @Get()
  @ApiQuery({ name: 'devotionalId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('devotionalId') devotionalId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.findAll(devotionalId, userId);
  }

  // POST /devotional-likes  (compatível com frontend: {devotionalId, userId})
  @Post()
  create(@Body() dto: CreateDevotionalLikeDto) { return this.service.toggle(dto); }

  // POST /devotional-likes/toggle  (rota legada mantida)
  @Post('toggle') toggle(@Body() dto: CreateDevotionalLikeDto) { return this.service.toggle(dto); }

  // DELETE /devotional-likes/:id  (remover like diretamente)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get('devotional/:devotionalId') findByDevotional(@Param('devotionalId') id: string) { return this.service.findByDevotional(id); }
  @Get('devotional/:devotionalId/count') countByDevotional(@Param('devotionalId') id: string) { return this.service.countByDevotional(id); }
}
