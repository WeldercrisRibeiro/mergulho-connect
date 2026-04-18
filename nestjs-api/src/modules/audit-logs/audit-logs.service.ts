import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({ data: dto as any });
  }

  findAll(routine?: string, userId?: string) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(routine ? { routine } : {}),
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.auditLog.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.auditLog.delete({ where: { id } });
  }
}
