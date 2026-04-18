import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { UpdateContactMessageDto } from './dto/update-contact-message.dto';

@Injectable()
export class ContactMessagesService {
  constructor(private prisma: PrismaService) {}
  create(dto: CreateContactMessageDto) { return this.prisma.contactMessage.create({ data: dto as any }); }
  findAll(status?: string) { return this.prisma.contactMessage.findMany({ where: status ? { status } : {}, orderBy: { createdAt: 'desc' } }); }
  findOne(id: string) { return this.prisma.contactMessage.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateContactMessageDto) { return this.prisma.contactMessage.update({ where: { id }, data: dto as any }); }
  remove(id: string) { return this.prisma.contactMessage.delete({ where: { id } }); }
}
