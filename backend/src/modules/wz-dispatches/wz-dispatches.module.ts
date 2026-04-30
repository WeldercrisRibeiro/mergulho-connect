import { Module } from '@nestjs/common';
import { WzDispatchesService } from './wz-dispatches.service';
import { WzDispatchesController } from './wz-dispatches.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [WzDispatchesController],
  providers: [WzDispatchesService],
  exports: [WzDispatchesService]
})
export class WzDispatchesModule {}
