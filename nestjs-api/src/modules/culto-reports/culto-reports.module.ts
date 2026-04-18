import { Module } from '@nestjs/common';
import { CultoReportsService } from './culto-reports.service';
import { CultoReportsController } from './culto-reports.controller';
@Module({ controllers: [CultoReportsController], providers: [CultoReportsService] })
export class CultoReportsModule {}
