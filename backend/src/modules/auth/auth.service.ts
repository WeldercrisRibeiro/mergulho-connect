import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordWithCredentialsDto } from './dto/change-password-with-credentials.dto';
import { TelegramService } from '../notifications/telegram.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private telegramService: TelegramService,
  ) {}

  async getFullAuthContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRole: true,
        // Buscamos os grupos que o usuário faz parte
      },
    });

    if (!user) return null;

    // Buscamos os grupos separadamente para garantir a estrutura
    const memberGroups = await this.prisma.memberGroup.findMany({
      where: { userId },
      include: { group: true }
    });

    const currentRole = user.userRole?.role || 'membro';
    
    // Mapeamento de IDs de roles para busca de rotinas (baseado no frontend)
    const roleMapping: Record<string, string> = {
      "admin": "c1f324b3-45ed-453a-941c-d030e22d7721",
      "admin_ccm": "c1f324b3-45ed-453a-941c-d030e22d7721",
      "pastor": "c1f324b3-45ed-453a-941c-d030e22d7721",
      "lider": "3e4bce2a-7856-4801-b466-7b8e3d12a74b",
      "membro": "071c2037-fa67-43ab-9d1b-4480fe15fd92"
    };

    const roleId = roleMapping[currentRole] || roleMapping.membro;
    const groupIds = memberGroups.map(mg => mg.groupId);

    // Busca as rotinas habilitadas para os grupos do usuário OU para a role dele
    const routines = await this.prisma.groupRoutine.findMany({
      where: {
        OR: [
          { groupId: { in: groupIds }, roleId: null },
          { roleId: roleId, groupId: null }
        ]
      }
    });

    // 1. Check-in Ativo
    const activeCheckin = await this.prisma.checkin.findFirst({
      where: { guardianId: userId, status: 'active' },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Configurações do Site (SiteSettings)
    const rawSettings = await this.prisma.siteSetting.findMany();
    const siteSettings = rawSettings.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});

    // 3. Contadores Sumários
    const counts = {
      members: await this.prisma.user.count(),
      groups: await this.prisma.group.count(),
      events: await this.prisma.event.count({ where: { eventDate: { gte: new Date() } } }),
      devotionals: await this.prisma.devotional.count({ where: { status: 'publicado' } }),
    };

    // 4. Próximos 3 Eventos
    const nextEvents = await this.prisma.event.findMany({
      where: {
        OR: [
          { isGeneral: true },
          { groupId: { in: groupIds } }
        ],
        eventDate: { gte: new Date() }
      },
      orderBy: { eventDate: 'asc' },
      take: 3
    });

    // 5. Devocional mais recente
    const latestDevotional = await this.prisma.devotional.findFirst({
      where: { 
        status: 'publicado',
        publishDate: { lte: new Date() }
      },
      orderBy: { publishDate: 'desc' }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: currentRole,
        profile: user.profile,
      },
      memberGroups,
      routines,
      activeCheckin,
      siteSettings,
      counts,
      nextEvents,
      latestDevotional
    };
  }

  async login(dto: LoginDto) {
    if (dto.email && !dto.email.includes('@')) {
      dto.email = dto.email.trim().toLowerCase() + "@ccmergulho.com";
    }
    
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true, userRole: true },
    });

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { sub: user.id, email: user.email, role: user.userRole?.role || 'membro' };
    
    // Envia notificação de auditoria (sem travar o login)
    this.telegramService.sendLoginNotification(
      user.email,
      user.userRole?.role || 'membro',
      user.profile?.fullName
    ).catch(err => console.error('Erro ao enviar notificação de login:', err));

    const fullContext = await this.getFullAuthContext(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      ...fullContext
    };
  }

  async register(dto: RegisterDto) {
    if (dto.email && !dto.email.includes('@')) {
      dto.email = dto.email.trim().toLowerCase() + "@ccmergulho.com";
    }
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new BadRequestException('E-mail já está em uso.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
        },
      });

      await tx.profile.create({
        data: {
          userId: newUser.id,
          fullName: dto.name,
        },
      });

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          role: 'membro',
        },
      });

      return newUser;
    });

    const payload = { sub: user.id, email: user.email, role: 'membro' };

    return {
      access_token: this.jwtService.sign(payload),
      message: 'Conta criada com sucesso!',
    };
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { success: true, message: 'Senha atualizada com sucesso.' };
  }

  async updatePasswordWithCredentials(dto: ChangePasswordWithCredentialsDto) {
    if (dto.email && !dto.email.includes('@')) {
      dto.email = dto.email.trim().toLowerCase() + "@ccmergulho.com";
    }
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha atual inválidos.');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Usuário ou senha atual inválidos.');
    }

    return this.updatePassword(user.id, dto.newPassword);
  }
}
