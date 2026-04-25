import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserPushSubscriptionsService } from './user-push-subscriptions.service';
import { CreateUserPushSubscriptionDto } from './dto/create-user-push-subscription.dto';

@ApiTags('User Push Subscriptions')
@ApiBearerAuth()
@Controller('user-push-subscriptions')
export class UserPushSubscriptionsController {
  constructor(private readonly service: UserPushSubscriptionsService) {}
  @Post() create(@Body() dto: CreateUserPushSubscriptionDto) { return this.service.create(dto); }
  @Get() findAll() { return this.service.findAll(); }
  @Get('user/:userId') findByUser(@Param('userId') userId: string) { return this.service.findByUser(userId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Delete('user/:userId') removeByUser(@Param('userId') userId: string) { return this.service.removeByUser(userId); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
