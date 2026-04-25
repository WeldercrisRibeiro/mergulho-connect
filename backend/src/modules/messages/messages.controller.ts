import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesGateway } from './messages.gateway';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly service: MessagesService,
    private readonly gateway: MessagesGateway
  ) {}
  @Post() async create(@Body() dto: CreateMessageDto) { 
    const msg = await this.service.create(dto); 
    this.gateway.broadcastNewMessage(msg);
    return msg;
  }
  @Get('sender/:senderId') findBySender(@Param('senderId') id: string) { return this.service.findBySender(id); }
  @Get('recipient/:recipientId') findByRecipient(@Param('recipientId') id: string) { return this.service.findByRecipient(id); }
  @Get('conversation/:userId1/:userId2') findConversation(@Param('userId1') u1: string, @Param('userId2') u2: string) { return this.service.findConversation(u1, u2); }
  @Get('user/:userId') findForUser(@Param('userId') id: string) { return this.service.findForUser(id); }
  @Get('group-messages') async findGroupMessages(@Query('groupIds') groupIds: string, @Query('excludeUserId') excludeUserId: string) {
    if (!groupIds) return [];
    return this.service.findGroupMessages(groupIds.split(','), excludeUserId);
  }
  @Get('chat/:chatId') findMessagesForChat(@Param('chatId') chatId: string, @Query('isGroup') isGroup: string, @Query('userId') userId: string) {
    return this.service.findMessagesForChat(chatId, isGroup === 'true', userId);
  }
  @Delete('group/:groupId') deleteGroupMessages(@Param('groupId') id: string) { return this.service.deleteGroupMessages(id); }
  @Delete('direct/:userId1/:userId2') deleteDirectMessages(@Param('userId1') u1: string, @Param('userId2') u2: string) { return this.service.deleteDirectMessages(u1, u2); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
