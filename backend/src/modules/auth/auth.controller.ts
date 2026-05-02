import { Controller, Post, Body, Get, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './public.decorator';
import { ChangePasswordWithCredentialsDto } from './dto/change-password-with-credentials.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Login: máximo 5 tentativas por minuto por IP */
  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login do usuário' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** Registro: máximo 3 por minuto por IP */
  @Post('register')
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Registro de novo usuário' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** Perfil autenticado — sem throttle adicional */
  @Get('me')
  @SkipThrottle()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@Request() req) {
    return this.authService.getFullAuthContext(req.user.id);
  }

  /** Atualizar senha logado — limite padrão */
  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar senha do usuário logado' })
  updatePassword(@Request() req, @Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(req.user.id, dto.password);
  }

  /** Reset por credenciais: máximo 5 por minuto */
  @Patch('password/by-credentials')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Atualizar senha com email e senha atual' })
  updatePasswordWithCredentials(@Body() dto: ChangePasswordWithCredentialsDto) {
    return this.authService.updatePasswordWithCredentials(dto);
  }
}
