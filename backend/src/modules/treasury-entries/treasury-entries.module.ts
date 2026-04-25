import { Module } from '@nestjs/common';
import { TreasuryEntriesService } from './treasury-entries.service';
import { TreasuryEntriesController } from './treasury-entries.controller';
@Module({ controllers: [TreasuryEntriesController], providers: [TreasuryEntriesService] })
export class TreasuryEntriesModule {}
