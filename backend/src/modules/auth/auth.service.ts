import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordWithCredentialsDto } from './dto/change-password-with-credentials.dto';
import { TelegramService } from '../notifications/telegram.service';
import { DashboardService } from '../maintenance/dashboard.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private telegramService: TelegramService,
    private dashboardService: DashboardService,
  ) {}

  async getFullAuthContext(userId: string) {
    return this.dashboardService.getFullAuthContext(userId);
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
