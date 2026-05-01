import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_MAPPING } from '../../utils/constants';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregates all necessary data for the user's initial application state.
   * Optimized with Promise.all to reduce latency.
   */
  async getFullAuthContext(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        userRole: true,
      },
    });

    if (!user) return null;

    const currentRole = user.userRole?.role || 'membro';
    const roleId = ROLE_MAPPING[currentRole] || ROLE_MAPPING.membro;

    // Execute multiple independent queries in parallel
    const [
      memberGroups,
      activeCheckin,
      rawSettings,
      counts,
      latestDevotional
    ] = await Promise.all([
      this.prisma.memberGroup.findMany({
        where: { userId },
        include: { group: true }
      }),
      this.prisma.checkin.findFirst({
        where: { guardianId: userId, status: 'active' },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.siteSetting.findMany(),
      this.getSummaryCounts(),
      this.getLatestDevotional()
    ]);

    const groupIds = memberGroups.map(mg => mg.groupId);

    // Routines and Next Events depend on groupIds, but can run in parallel with each other
    const [routines, nextEvents] = await Promise.all([
      this.prisma.groupRoutine.findMany({
        where: {
          OR: [
            { groupId: { in: groupIds }, roleId: null },
            { roleId: roleId, groupId: null }
          ]
        }
      }),
      this.prisma.event.findMany({
        where: {
          OR: [
            { isGeneral: true },
            { groupId: { in: groupIds } }
          ],
          eventDate: { gte: new Date() }
        },
        orderBy: { eventDate: 'asc' },
        take: 3
      })
    ]);

    // Format site settings as a key-value object
    const siteSettings = rawSettings.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.value }), {});

    const needsPasswordChange = await bcrypt.compare('123456', user.password);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: currentRole,
        profile: user.profile,
        needsPasswordChange,
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

  private async getSummaryCounts() {
    const [members, groups, events, devotionals] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.group.count(),
      this.prisma.event.count({ where: { eventDate: { gte: new Date() } } }),
      this.prisma.devotional.count({ where: { status: 'publicado' } }),
    ]);

    return { members, groups, events, devotionals };
  }

  private async getLatestDevotional() {
    return this.prisma.devotional.findFirst({
      where: { 
        status: 'publicado',
        publishDate: { lte: new Date() }
      },
      orderBy: { publishDate: 'desc' }
    });
  }
}
