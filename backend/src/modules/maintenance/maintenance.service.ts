import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AppRole } from '@prisma/client';
import { CreateMaintenanceUserDto } from './dto/create-maintenance-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateMaintenanceProfileDto } from './dto/update-maintenance-profile.dto';
import { UpdateMaintenanceRoleDto } from './dto/update-maintenance-role.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private async logAction(scriptId: string, executorId: string, details: string, status: string = 'success') {
    await this.prisma.maintenanceLog.create({
      data: {
        scriptId,
        executorId,
        details,
        status,
      },
    });
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { email: 'asc' },
    });
  }

  async createUser(dto: CreateMaintenanceUserDto, executorId: string) {
    try {
      // Garante que o email tenha o domínio se for apenas um login
      if (dto.email && !dto.email.includes('@')) {
        dto.email = dto.email.trim().toLowerCase() + "@ccmergulho.com";
      }

      const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingUser) {
        throw new BadRequestException('Usuário com este e-mail já existe.');
      }

      const hashedPassword = await bcrypt.hash(dto.password || '123456', 10);

      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            password: hashedPassword,
          },
        });

        await tx.profile.create({
          data: {
            userId: user.id,
            fullName: dto.fullName || 'Novo Usuário',
            username: dto.username || dto.email.split('@')[0],
            whatsappPhone: dto.whatsappPhone,
          },
        });

        await tx.userRole.create({
          data: {
            userId: user.id,
            role: (dto.role || 'membro') as AppRole,
          },
        });

        return user;
      });

      await this.logAction('create-user', executorId, `Usuário criado: ${dto.email} com role ${dto.role || 'membro'}`);
      return result;
    } catch (error) {
      await this.logAction('create-user', executorId, `Falha ao criar usuário ${dto.email}: ${error.message}`, 'error');
      throw error;
    }
  }

  async changePassword(dto: ChangePasswordDto, executorId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) {
        throw new BadRequestException('Usuário não encontrado.');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      await this.logAction('change-password', executorId, `Senha alterada para o usuário: ${user.email}`);
      return { message: 'Senha alterada com sucesso.' };
    } catch (error) {
      await this.logAction('change-password', executorId, `Falha ao alterar senha: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateProfile(dto: UpdateMaintenanceProfileDto, executorId: string) {
    try {
      const user = await this.prisma.user.findUnique({ 
        where: { id: dto.userId },
        include: { profile: true }
      });
      
      if (!user) {
        throw new BadRequestException('Usuário não encontrado.');
      }

      const dataToUpdate: Record<string, string> = {};
      if (dto.fullName !== undefined) dataToUpdate.fullName = dto.fullName;
      if (dto.username !== undefined) dataToUpdate.username = dto.username;
      if (dto.whatsappPhone !== undefined) dataToUpdate.whatsappPhone = dto.whatsappPhone;
      if (dto.avatarUrl !== undefined) dataToUpdate.avatarUrl = dto.avatarUrl;

      if (Object.keys(dataToUpdate).length === 0) {
        throw new BadRequestException('Nenhum campo de perfil foi enviado para atualização.');
      }

      await this.prisma.profile.update({
        where: { userId: user.id },
        data: dataToUpdate,
      });

      await this.logAction('update-profile', executorId, `Perfil atualizado para: ${user.email}`);
      return { message: 'Perfil atualizado com sucesso.' };
    } catch (error) {
      await this.logAction('update-profile', executorId, `Falha ao atualizar perfil: ${error.message}`, 'error');
      throw error;
    }
  }

  async updateUserRole(dto: UpdateMaintenanceRoleDto, executorId: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
      if (!user) {
        throw new BadRequestException('Usuário não encontrado.');
      }

      await this.prisma.userRole.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          role: dto.role as AppRole,
        },
        update: {
          role: dto.role as AppRole,
        },
      });

      await this.logAction('update-role', executorId, `Role alterada para ${dto.role} no usuário: ${user.email}`);
      return { message: 'Função do usuário atualizada com sucesso.' };
    } catch (error) {
      await this.logAction('update-role', executorId, `Falha ao alterar role: ${error.message}`, 'error');
      throw error;
    }
  }

  async exportLogs() {
    const logs = await this.prisma.maintenanceLog.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Buscar nomes dos executores para o relatório
    const executorIds = [...new Set(logs.map(l => l.executorId))];
    const executors = await this.prisma.profile.findMany({
      where: { userId: { in: executorIds } },
      select: { userId: true, fullName: true }
    });

    const executorMap = new Map(executors.map(e => [e.userId, e.fullName]));

    const now = new Date().toLocaleString('pt-BR');
    let output = "================================================================================\n";
    output += "          MERGULHO CONNECT - RELATÓRIO DE AUDITORIA DE MANUTENÇÃO\n";
    output += `          Gerado em: ${now}\n`;
    output += "================================================================================\n\n";

    output += String("DATA/HORA").padEnd(25) + "| " + 
              String("EXECUTOR").padEnd(25) + "| " + 
              String("SCRIPT").padEnd(20) + "| " + 
              String("STATUS").padEnd(10) + "\n";
    output += "--------------------------------------------------------------------------------\n";

    for (const log of logs) {
      const date = log.createdAt.toLocaleString('pt-BR');
      const executorName = executorMap.get(log.executorId) || log.executorId.substring(0, 8);
      const script = log.scriptId;
      const status = log.status.toUpperCase();

      output += `${date.padEnd(25)}| ${executorName.substring(0, 24).padEnd(25)}| ${script.padEnd(20)}| ${status.padEnd(10)}\n`;
      output += `   DETALHES: ${log.details}\n`;
      output += "--------------------------------------------------------------------------------\n";
    }

    output += "\nFim do Relatório.\n";

    return output;
  }

  async listScripts() {
    return [
      {
        id: 'create-user',
        name: 'Criar Novo Usuário/Admin',
        description: 'Cria um novo usuário com perfil e cargo definidos.',
        fields: [
          { name: 'email', label: 'Login', type: 'text', required: true },
          { name: 'password', label: 'Senha', type: 'password', required: true },
          { name: 'fullName', label: 'Nome Completo', type: 'text', required: true },
          { name: 'username', label: 'Nome de Usuário', type: 'text', required: true },
          { name: 'whatsappPhone', label: 'WhatsApp', type: 'text', required: false },
          { name: 'role', label: 'Cargo (Role)', type: 'select', options: ['admin', 'admin_ccm', 'gerente', 'lider', 'pastor', 'membro'], required: true },
        ],
      },
      {
        id: 'change-password',
        name: 'Alterar Senha de Usuário',
        description: 'Altera a senha de qualquer usuário selecionado.',
        fields: [
          { name: 'userId', label: 'Selecionar Membro', type: 'user_select', required: true },
          { name: 'newPassword', label: 'Nova Senha', type: 'password', required: true },
        ],
      },
      {
        id: 'update-profile',
        name: 'Atualizar Dados de Perfil',
        description: 'Atualiza nome, username, telefone ou foto de um usuário.',
        fields: [
          { name: 'userId', label: 'Selecionar Membro', type: 'user_select', required: true },
          { name: 'fullName', label: 'Novo Nome Completo', type: 'text', required: false },
          { name: 'username', label: 'Novo Nome de Usuário', type: 'text', required: false },
          { name: 'whatsappPhone', label: 'Novo WhatsApp', type: 'text', required: false },
          { name: 'avatarUrl', label: 'Nova Foto de Perfil', type: 'file', required: false },
        ],
      },
      {
        id: 'update-role',
        name: 'Alterar Permissões (Role)',
        description: 'Muda o cargo/nível de acesso de um usuário.',
        fields: [
          { name: 'userId', label: 'Selecionar Membro', type: 'user_select', required: true },
          { name: 'role', label: 'Novo Cargo', type: 'select', options: ['admin', 'admin_ccm', 'lider', 'pastor', 'membro'], required: true },
        ],
      },
    ];
  }
}
