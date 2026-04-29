-- CreateEnum
CREATE TYPE "app_role" AS ENUM (
    'admin',
    'admin_ccm',
    'lider',
    'pastor',
    'membro'
);
-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'cancelled');
-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "contact_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT DEFAULT 'pending',
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "devotional_likes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "devotional_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "devotional_likes_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "devotionals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "publish_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "author_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration_date" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "video_url" TEXT,
    "is_video_upload" BOOLEAN DEFAULT false,
    CONSTRAINT "devotionals_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'users',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "group_routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_key" TEXT NOT NULL,
    "is_enabled" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "group_id" UUID,
    CONSTRAINT "group_routines_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "landing_photos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),
    "priority" INTEGER DEFAULT 0,
    "is_banner" BOOLEAN DEFAULT false,
    CONSTRAINT "landing_photos_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "landing_testimonials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "role" TEXT,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "landing_testimonials_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" UUID NOT NULL,
    "recipient_id" UUID,
    "group_id" UUID,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT,
    "whatsapp_phone" TEXT,
    "username" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "user_push_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "subscription" JSONB NOT NULL,
    "device_info" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_push_subscriptions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role" "app_role" NOT NULL DEFAULT 'membro',
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "volunteers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "availability" TEXT,
    "interest_area" TEXT,
    "interest_areas" TEXT [] DEFAULT ARRAY []::TEXT [],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "wz_dispatches" (
    "title" TEXT NOT NULL,
    "content" TEXT,
    "type" TEXT NOT NULL,
    "target_group_id" TEXT,
    "target_user_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(6) NOT NULL,
    "sent_at" TIMESTAMP(6),
    "error_message" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT "wz_dispatches_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "wz_dispatch_attachments" (
    "type" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispatch_id" UUID NOT NULL,
    CONSTRAINT "wz_dispatch_attachments_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "wz_dispatch_logs" (
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispatch_id" UUID NOT NULL,
    CONSTRAINT "wz_dispatch_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "group_id" UUID,
    "target_user_id" UUID,
    "target_group_id" UUID,
    "created_by" UUID,
    "priority" TEXT DEFAULT 'normal',
    "send_whatsapp" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "event_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID,
    "group_id" UUID,
    "report_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "report_type" TEXT NOT NULL DEFAULT 'culto',
    "total_attendees" INTEGER DEFAULT 0,
    "children_count" INTEGER DEFAULT 0,
    "monitors_count" INTEGER DEFAULT 0,
    "youth_count" INTEGER DEFAULT 0,
    "public_count" INTEGER DEFAULT 0,
    "total_offerings" DECIMAL DEFAULT 0,
    "tithes_amount" DECIMAL DEFAULT 0,
    "tithers" JSONB DEFAULT '[]',
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visitors_count" INTEGER NOT NULL DEFAULT 0,
    "preacher" TEXT,
    "sermon_ref" TEXT,
    "pastors" TEXT [],
    "worship_team" TEXT [],
    "welcome_team" TEXT [],
    "media_team" TEXT [],
    CONSTRAINT "event_reports_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMPTZ(6) NOT NULL,
    "location" TEXT,
    "is_general" BOOLEAN NOT NULL DEFAULT true,
    "group_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" TEXT NOT NULL DEFAULT 'simple',
    "banner_url" TEXT,
    "speakers" TEXT,
    "price" DECIMAL DEFAULT 0,
    "pix_key" TEXT,
    "pix_qrcode_url" TEXT,
    "map_url" TEXT,
    "send_whatsapp" BOOLEAN DEFAULT false,
    "require_checkin" BOOLEAN DEFAULT false,
    "checkin_qr_secret" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "kids_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "child_name" TEXT NOT NULL,
    "guardian_id" UUID,
    "items_description" TEXT,
    "validation_token" TEXT NOT NULL,
    "status" TEXT DEFAULT 'active',
    "call_requested" BOOLEAN DEFAULT false,
    "category" TEXT DEFAULT 'checkin',
    "event_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kids_checkins_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "member_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "role" TEXT DEFAULT 'member',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "member_groups_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "volunteer_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schedule_date" DATE NOT NULL,
    "role_function" TEXT NOT NULL,
    "volunteer_id" UUID,
    "item_user_id" UUID,
    "group_id" UUID,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_schedules_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "event_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "checked_in_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_checkins_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "culto_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_date" DATE NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'culto',
    "total_attendees" INTEGER NOT NULL DEFAULT 0,
    "children_count" INTEGER NOT NULL DEFAULT 0,
    "youth_count" INTEGER NOT NULL DEFAULT 0,
    "monitors_count" INTEGER NOT NULL DEFAULT 0,
    "public_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "event_id" UUID,
    "escala_data" JSONB DEFAULT '[]',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "culto_reports_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "treasury_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_name" TEXT NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "payment_type" TEXT NOT NULL,
    "payment_date" DATE NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "treasury_entries_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
-- CreateIndex
CREATE UNIQUE INDEX "devotional_likes_devotional_id_user_id_key" ON "devotional_likes"("devotional_id", "user_id");
-- CreateIndex
CREATE UNIQUE INDEX "group_routines_group_id_routine_key_key" ON "group_routines"("group_id", "routine_key");
-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");
-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_key" ON "user_roles"("user_id");
-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");
-- CreateIndex
CREATE INDEX "idx_events_is_public" ON "events"("is_public");
-- CreateIndex
CREATE UNIQUE INDEX "member_groups_user_id_group_id_key" ON "member_groups"("user_id", "group_id");
-- CreateIndex
CREATE INDEX "idx_v_schedules_user_id" ON "volunteer_schedules"("item_user_id");
-- CreateIndex
CREATE INDEX "idx_event_checkins_event" ON "event_checkins"("event_id");
-- CreateIndex
CREATE UNIQUE INDEX "event_checkins_event_id_user_id_key" ON "event_checkins"("event_id", "user_id");
-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "event_registrations"("event_id", "user_id");
-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_event_id_user_id_key" ON "event_rsvps"("event_id", "user_id");
-- CreateIndex
CREATE INDEX "idx_culto_reports_event_id" ON "culto_reports"("event_id");
-- CreateIndex
CREATE INDEX "idx_culto_reports_report_date" ON "culto_reports"("report_date" DESC);
-- CreateIndex
CREATE INDEX "idx_treasury_entries_created_by" ON "treasury_entries"("created_by");
-- CreateIndex
CREATE INDEX "idx_treasury_entries_payment_date" ON "treasury_entries"("payment_date" DESC);
-- AddForeignKey
ALTER TABLE "devotional_likes"
ADD CONSTRAINT "devotional_likes_devotional_id_fkey" FOREIGN KEY ("devotional_id") REFERENCES "devotionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "group_routines"
ADD CONSTRAINT "group_routines_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "messages"
ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "profiles"("user_id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "messages"
ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "user_roles"
ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "wz_dispatch_attachments"
ADD CONSTRAINT "wz_dispatch_attachments_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "wz_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "wz_dispatch_logs"
ADD CONSTRAINT "wz_dispatch_logs_dispatch_id_fkey" FOREIGN KEY ("dispatch_id") REFERENCES "wz_dispatches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "announcements"
ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "announcements"
ADD CONSTRAINT "announcements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_reports"
ADD CONSTRAINT "event_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("user_id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_reports"
ADD CONSTRAINT "event_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_reports"
ADD CONSTRAINT "event_reports_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "events"
ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "kids_checkins"
ADD CONSTRAINT "kids_checkins_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "member_groups"
ADD CONSTRAINT "member_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "volunteer_schedules"
ADD CONSTRAINT "volunteer_schedules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "volunteer_schedules"
ADD CONSTRAINT "volunteer_schedules_item_user_id_fkey" FOREIGN KEY ("item_user_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_checkins"
ADD CONSTRAINT "event_checkins_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_registrations"
ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "event_rsvps"
ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "culto_reports"
ADD CONSTRAINT "culto_reports_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE
SET NULL ON UPDATE CASCADE;