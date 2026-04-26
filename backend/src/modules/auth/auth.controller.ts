import { Controller, Post, Body, Get, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login do usuário' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Registro de novo usuário' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário logado' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar senha do usuário logado' })
  updatePassword(@Request() req, @Body() dto: UpdatePasswordDto) {
    return this.authService.updatePassword(req.user.id, dto.password);
  }

  @Patch('password/by-credentials')
  @Public()
  @ApiOperation({ summary: 'Atualizar senha com email e senha atual' })
  updatePasswordWithCredentials(@Body() dto: ChangePasswordWithCredentialsDto) {
    return this.authService.updatePasswordWithCredentials(dto);
  }
}
