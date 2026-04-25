import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'chat',
})
export class MessagesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  // Frontend could emit a 'join' event to join group rooms, etc., but we can just broadcast for now like supabase channel did.
  
  // This could be called from the messages.service.ts whenever a new message is saved
  broadcastNewMessage(message: any) {
    this.server.emit('new_message', { new: message });
  }
}
