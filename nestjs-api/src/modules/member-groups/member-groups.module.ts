import { Module } from '@nestjs/common';
import { MemberGroupsService } from './member-groups.service';
import { MemberGroupsController } from './member-groups.controller';
@Module({ controllers: [MemberGroupsController], providers: [MemberGroupsService] })
export class MemberGroupsModule {}
