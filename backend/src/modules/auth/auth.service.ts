import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordWithCredentialsDto } from './dto/change-password-with-credentials.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    if (dto.email && !dto.email.includes('@')) {
      dto.email = dto.email.trim().toLowerCase() + "@ccmergulho.com";
    }
    console.log(`🔑 Tentativa de login para: ${dto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true, userRole: true },
    });

    if (!user) {
      console.log(`❌ Usuário não encontrado: ${dto.email}`);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      console.log(`❌ Senha incorreta para: ${dto.email}`);
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    const payload = { sub: user.id, email: user.email, role: user.userRole?.role || 'membro' };
    //console.log(`✅ Login bem-sucedido: ${user.email} (Role: ${payload.role})`);
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.userRole?.role || 'membro',
        profile: user.profile,
      },
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
