import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Verifica se a API está online (UptimeRobot)' })
  @ApiResponse({ status: 200, description: 'API está operando normalmente.' })
  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
