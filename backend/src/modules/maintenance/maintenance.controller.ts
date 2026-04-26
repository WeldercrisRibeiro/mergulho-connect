import { Controller, Post, Body, Get, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateMaintenanceUserDto } from './dto/create-maintenance-user.dto';
import { UpdateMaintenanceProfileDto } from './dto/update-maintenance-profile.dto';
import { UpdateMaintenanceRoleDto } from './dto/update-maintenance-role.dto';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_ccm', 'admin')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('scripts')
  async listScripts() {
    return this.maintenanceService.listScripts();
  }

  @Get('users')
  async listUsers() {
    return this.maintenanceService.listUsers();
  }

  @Get('logs/export')
  async exportLogs(@Res() res: Response) {
    const logs = await this.maintenanceService.exportLogs();
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=maintenance_audit_log.txt');
    return res.send(logs);
  }

  @Post('run/create-user')
  async createUser(@Body() dto: CreateMaintenanceUserDto, @Request() req: any) {
    return this.maintenanceService.createUser(dto, req.user.id);
  }

  @Post('run/change-password')
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
    return this.maintenanceService.changePassword(dto, req.user.id);
  }

  @Post('run/update-profile')
  async updateProfile(@Body() dto: UpdateMaintenanceProfileDto, @Request() req: any) {
    return this.maintenanceService.updateProfile(dto, req.user.id);
  }

  @Post('run/update-role')
  async updateRole(@Body() dto: UpdateMaintenanceRoleDto, @Request() req: any) {
    return this.maintenanceService.updateUserRole(dto, req.user.id);
  }
}
