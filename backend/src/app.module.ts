import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';

// Módulos de domínio
import { AuthModule } from './modules/auth/auth.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ContactMessagesModule } from './modules/contact-messages/contact-messages.module';
import { CultoReportsModule } from './modules/culto-reports/culto-reports.module';
import { DevotionalsModule } from './modules/devotionals/devotionals.module';
import { DevotionalLikesModule } from './modules/devotional-likes/devotional-likes.module';
import { EventCheckinsModule } from './modules/event-checkins/event-checkins.module';
import { EventRegistrationsModule } from './modules/event-registrations/event-registrations.module';
import { EventReportsModule } from './modules/event-reports/event-reports.module';
import { EventRsvpsModule } from './modules/event-rsvps/event-rsvps.module';
import { EventsModule } from './modules/events/events.module';
import { GroupsModule } from './modules/groups/groups.module';
import { GroupRoutinesModule } from './modules/group-routines/group-routines.module';
import { HiddenConversationsModule } from './modules/hidden-conversations/hidden-conversations.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { LandingPhotosModule } from './modules/landing-photos/landing-photos.module';
import { LandingTestimonialsModule } from './modules/landing-testimonials/landing-testimonials.module';
import { MemberGroupsModule } from './modules/member-groups/member-groups.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { TreasuryEntriesModule } from './modules/treasury-entries/treasury-entries.module';
import { UserPushSubscriptionsModule } from './modules/user-push-subscriptions/user-push-subscriptions.module';
import { UserRolesModule } from './modules/user-roles/user-roles.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { VolunteerSchedulesModule } from './modules/volunteer-schedules/volunteer-schedules.module';
import { WzDispatchesModule } from './modules/wz-dispatches/wz-dispatches.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './modules/auth/roles.guard';
import { NotificationsModule } from './modules/notifications/notifications.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Rate limiting global — 200 req/60s por padrão para evitar bloqueios no painel React
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    PrismaModule,

    // Domínio
    AuthModule,
    AnnouncementsModule,
    ContactMessagesModule,
    CultoReportsModule,
    DevotionalsModule,
    DevotionalLikesModule,
    EventCheckinsModule,
    EventRegistrationsModule,
    EventReportsModule,
    EventRsvpsModule,
    EventsModule,
    GroupsModule,
    GroupRoutinesModule,
    HiddenConversationsModule,
    CheckinsModule,
    LandingPhotosModule,
    LandingTestimonialsModule,
    MemberGroupsModule,
    MessagesModule,
    ProfilesModule,
    SiteSettingsModule,
    TreasuryEntriesModule,
    UserPushSubscriptionsModule,
    UserRolesModule,
    VolunteersModule,
    VolunteerSchedulesModule,
    WzDispatchesModule,
    WhatsAppModule,
    HealthModule,
    UploadModule,
    MaintenanceModule,
    NotificationsModule,
  ],
  providers: [
    // Throttler deve vir PRIMEIRO para bloquear antes da autenticação
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
