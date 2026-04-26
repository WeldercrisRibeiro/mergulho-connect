import { Module } from '@nestjs/common';
import { GroupRoutinesService } from './group-routines.service';
import { GroupRoutinesController } from './group-routines.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GroupRoutinesController],
  providers: [GroupRoutinesService],
})
export class GroupRoutinesModule {}
