import { Module } from '@nestjs/common';
import { WzDispatchesService } from './wz-dispatches.service';
import { WzDispatchesController } from './wz-dispatches.controller';
@Module({ controllers: [WzDispatchesController], providers: [WzDispatchesService], exports: [WzDispatchesService] })
export class WzDispatchesModule {}
