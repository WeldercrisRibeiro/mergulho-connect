import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSiteSettingDto } from './dto/create-site-setting.dto';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';

@Injectable()
export class SiteSettingsService {
  constructor(private prisma: PrismaService) {}
  upsert(dto: CreateSiteSettingDto) { return this.prisma.siteSetting.upsert({ where: { id: dto.id }, create: dto, update: { value: dto.value } }); }
  findAll() { return this.prisma.siteSetting.findMany(); }
  findOne(id: string) { return this.prisma.siteSetting.findUnique({ where: { id } }); }
  update(id: string, dto: UpdateSiteSettingDto) { return this.prisma.siteSetting.update({ where: { id }, data: dto }); }
  remove(id: string) { return this.prisma.siteSetting.delete({ where: { id } }); }
}
