import { Module } from '@nestjs/common';
import { GroupRoutinesService } from './group-routines.service';
import { GroupRoutinesController } from './group-routines.controller';
@Module({ controllers: [GroupRoutinesController], providers: [GroupRoutinesService] })
export class GroupRoutinesModule {}
