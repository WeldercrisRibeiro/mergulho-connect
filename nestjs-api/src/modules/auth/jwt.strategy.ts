import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'mergulho-connect-secret-jwt-key',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, userRole: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou token inválido');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.userRole?.role || 'membro',
      profile: user.profile,
    };
  }
}
