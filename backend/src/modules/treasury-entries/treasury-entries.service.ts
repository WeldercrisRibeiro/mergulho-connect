import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTreasuryEntryDto } from './dto/create-treasury-entry.dto';
import { UpdateTreasuryEntryDto } from './dto/update-treasury-entry.dto';

@Injectable()
export class TreasuryEntriesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateTreasuryEntryDto) { return this.prisma.treasuryEntry.create({ data: dto as any }); }
  findAll(paymentType?: string) {
    return this.prisma.treasuryEntry.findMany({
      where: paymentType ? { paymentType } : {},
      orderBy: { paymentDate: 'desc' },
    });
  }
  findOne(id: string) { return this.prisma.treasuryEntry.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateTreasuryEntryDto) { return this.prisma.treasuryEntry.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.treasuryEntry.delete({ where: { id } }); }
  async summary() {
    const data = await this.prisma.treasuryEntry.groupBy({ by: ['paymentType'], _sum: { amount: true }, _count: true });
    return data;
  }
}
