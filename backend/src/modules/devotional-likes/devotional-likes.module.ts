import { Module } from '@nestjs/common';
import { DevotionalLikesService } from './devotional-likes.service';
import { DevotionalLikesController } from './devotional-likes.controller';
@Module({ controllers: [DevotionalLikesController], providers: [DevotionalLikesService] })
export class DevotionalLikesModule {}
