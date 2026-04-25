import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserPushSubscriptionDto } from './dto/create-user-push-subscription.dto';

@Injectable()
export class UserPushSubscriptionsService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateUserPushSubscriptionDto) { return this.prisma.userPushSubscription.create({ data: dto as any }); }
  findAll() { return this.prisma.userPushSubscription.findMany({ orderBy: { createdAt: 'desc' } }); }
  findByUser(userId: string) { return this.prisma.userPushSubscription.findMany({ where: { userId } }); }
  findOne(id: string) { return this.prisma.userPushSubscription.findUnique({ where: { id } }); }
  remove(id: string) { return this.prisma.userPushSubscription.delete({ where: { id } }); }
  removeByUser(userId: string) { return this.prisma.userPushSubscription.deleteMany({ where: { userId } }); }
}
