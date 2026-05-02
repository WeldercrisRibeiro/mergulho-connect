import { Controller, Get, Post, Body, Param, Delete, Query, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesGateway } from './messages.gateway';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_ROLES = ['admin', 'admin_ccm'];

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly service: MessagesService,
    private readonly gateway: MessagesGateway
  ) {}

  /** Envia mensagem: senderId deve ser o próprio usuário autenticado */
  @Post()
  async create(@Body() dto: CreateMessageDto, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    if (!isAdmin && dto.senderId !== req.user.id) {
      throw new ForbiddenException('Você não pode enviar mensagens em nome de outro usuário.');
    }
    const msg = await this.service.create(dto);
    this.gateway.broadcastNewMessage(msg);
    return msg;
  }

  /** Mensagens enviadas — apenas do próprio usuário ou admin */
  @Get('sender/:senderId')
  findBySender(@Param('senderId') id: string, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    if (!isAdmin && req.user.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.service.findBySender(id);
  }

  /** Mensagens recebidas — apenas do próprio usuário ou admin */
  @Get('recipient/:recipientId')
  findByRecipient(@Param('recipientId') id: string, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    if (!isAdmin && req.user.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.service.findByRecipient(id);
  }

  /** Conversa entre dois usuários — apenas participantes ou admin */
  @Get('conversation/:userId1/:userId2')
  findConversation(@Param('userId1') u1: string, @Param('userId2') u2: string, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const isParticipant = req.user.id === u1 || req.user.id === u2;
    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.service.findConversation(u1, u2);
  }

  /** Todas as mensagens do usuário autenticado */
  @Get('user/:userId')
  findForUser(@Param('userId') id: string, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    if (!isAdmin && req.user.id !== id) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.service.findForUser(id);
  }

  /** Mensagens de grupos — apenas grupos que o usuário participa */
  @Get('group-messages')
  @ApiQuery({ name: 'groupIds', required: true })
  @ApiQuery({ name: 'excludeUserId', required: false })
  async findGroupMessages(@Query('groupIds') groupIds: string, @Query('excludeUserId') excludeUserId: string) {
    if (!groupIds) return [];
    return this.service.findGroupMessages(groupIds.split(','), excludeUserId);
  }

  /** Mensagens de um chat específico */
  @Get('chat/:chatId')
  findMessagesForChat(@Param('chatId') chatId: string, @Query('isGroup') isGroup: string, @Req() req) {
    return this.service.findMessagesForChat(chatId, isGroup === 'true', req.user.id);
  }

  /** Deleção de mensagens de grupo — apenas admin */
  @Delete('group/:groupId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  deleteGroupMessages(@Param('groupId') id: string) { return this.service.deleteGroupMessages(id); }

  /** Deleção de conversa direta — participante ou admin */
  @Delete('direct/:userId1/:userId2')
  deleteDirectMessages(@Param('userId1') u1: string, @Param('userId2') u2: string, @Req() req) {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const isParticipant = req.user.id === u1 || req.user.id === u2;
    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Acesso negado.');
    }
    return this.service.deleteDirectMessages(u1, u2);
  }

  /** Deleção de mensagem individual — apenas admin */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'admin_ccm')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
