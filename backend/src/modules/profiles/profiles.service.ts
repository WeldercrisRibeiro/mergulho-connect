import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  // ─── CREATE ───────────────────────────────────────────────────────────────
  async create(dto: CreateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException(
        `Já existe um perfil para o usuário ${dto.userId}.`,
      );
    }
    return this.prisma.profile.create({ data: dto as any });
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────
  findAll() {
    return this.prisma.profile.findMany({ orderBy: { fullName: 'asc' } });
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────
  async findOne(id: string) {
    const profile = await this.prisma.profile.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException(`Perfil com id "${id}" não encontrado.`);
    }
    return profile;
  }

  // ─── READ BY USER ID ──────────────────────────────────────────────────────
  async findByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException(
        `Perfil para o usuário "${userId}" não encontrado.`,
      );
    }
    return profile;
  }

  // ─── READ BY PHONE ────────────────────────────────────────────────────────
  findByPhone(whatsappPhone: string) {
    return this.prisma.profile.findFirst({ where: { whatsappPhone } });
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateProfileDto) {
    await this.findOne(id); // lança 404 se não existir
    return this.prisma.profile.update({ where: { id }, data: dto as any });
  }

  // ─── UPDATE BY USER ID ────────────────────────────────────────────────────
  async updateByUserId(userId: string, dto: UpdateProfileDto) {
    await this.findByUserId(userId); // lança 404 se não existir
    return this.prisma.profile.update({ where: { userId }, data: dto as any });
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async remove(id: string) {
    await this.findOne(id); // lança 404 se não existir
    return this.prisma.profile.delete({ where: { id } });
  }
}
