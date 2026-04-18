import { Module } from '@nestjs/common';
import { UserPushSubscriptionsService } from './user-push-subscriptions.service';
import { UserPushSubscriptionsController } from './user-push-subscriptions.controller';
@Module({ controllers: [UserPushSubscriptionsController], providers: [UserPushSubscriptionsService] })
export class UserPushSubscriptionsModule {}
