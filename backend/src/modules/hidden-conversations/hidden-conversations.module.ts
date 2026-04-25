import { Module } from '@nestjs/common';
import { HiddenConversationsService } from './hidden-conversations.service';
import { HiddenConversationsController } from './hidden-conversations.controller';
@Module({ controllers: [HiddenConversationsController], providers: [HiddenConversationsService] })
export class HiddenConversationsModule {}