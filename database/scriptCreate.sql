-- public._prisma_migrations definição

-- Drop table

-- DROP TABLE public._prisma_migrations;

CREATE TABLE public._prisma_migrations ( id varchar(36) NOT NULL, checksum varchar(64) NOT NULL, finished_at timestamptz NULL, migration_name varchar(255) NOT NULL, logs text NULL, rolled_back_at timestamptz NULL, started_at timestamptz DEFAULT now() NOT NULL, applied_steps_count int4 DEFAULT 0 NOT NULL, CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id));


-- public.baileys_auth definição

-- Drop table

-- DROP TABLE public.baileys_auth;

CREATE TABLE public.baileys_auth ( id uuid DEFAULT gen_random_uuid() NOT NULL, session_id text NOT NULL, "key" text NOT NULL, value text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT baileys_auth_pkey PRIMARY KEY (id));
CREATE UNIQUE INDEX baileys_auth_session_id_key_key ON public.baileys_auth USING btree (session_id, key);


-- public.contact_messages definição

-- Drop table

-- DROP TABLE public.contact_messages;

CREATE TABLE public.contact_messages ( id uuid DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, phone text NULL, subject text NULL, message text NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, status text DEFAULT 'pending'::text NULL, CONSTRAINT contact_messages_pkey PRIMARY KEY (id));


-- public.devotionals definição

-- Drop table

-- DROP TABLE public.devotionals;

CREATE TABLE public.devotionals ( id uuid DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, "content" text NOT NULL, media_url text NULL, publish_date timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, status text DEFAULT 'draft'::text NOT NULL, author_id uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, expiration_date timestamptz(6) NULL, is_active bool DEFAULT true NOT NULL, video_url text NULL, is_video_upload bool DEFAULT false NULL, CONSTRAINT devotionals_pkey PRIMARY KEY (id));


-- public."groups" definição

-- Drop table

-- DROP TABLE public."groups";

CREATE TABLE public."groups" ( id uuid DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, description text NULL, icon text DEFAULT 'users'::text NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT groups_pkey PRIMARY KEY (id));


-- public.landing_photos definição

-- Drop table

-- DROP TABLE public.landing_photos;

CREATE TABLE public.landing_photos ( id uuid DEFAULT gen_random_uuid() NOT NULL, url text NOT NULL, caption text NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, expires_at timestamptz(6) NULL, priority int4 DEFAULT 0 NULL, is_banner bool DEFAULT false NULL, CONSTRAINT landing_photos_pkey PRIMARY KEY (id));


-- public.landing_testimonials definição

-- Drop table

-- DROP TABLE public.landing_testimonials;

CREATE TABLE public.landing_testimonials ( id uuid DEFAULT gen_random_uuid() NOT NULL, "name" text NOT NULL, "role" text NULL, "text" text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT landing_testimonials_pkey PRIMARY KEY (id));


-- public.maintenance_logs definição

-- Drop table

-- DROP TABLE public.maintenance_logs;

CREATE TABLE public.maintenance_logs ( id uuid DEFAULT gen_random_uuid() NOT NULL, script_id text NOT NULL, executor_id uuid NOT NULL, details text NULL, status text DEFAULT 'success'::text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id));


-- public.site_settings definição

-- Drop table

-- DROP TABLE public.site_settings;

CREATE TABLE public.site_settings ( id text NOT NULL, value text NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT site_settings_pkey PRIMARY KEY (id));


-- public.treasury_entries definição

-- Drop table

-- DROP TABLE public.treasury_entries;

CREATE TABLE public.treasury_entries ( id uuid DEFAULT gen_random_uuid() NOT NULL, member_name text NOT NULL, amount numeric(10, 2) NOT NULL, payment_type text NOT NULL, payment_date date NOT NULL, notes text NULL, created_by uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT treasury_entries_pkey PRIMARY KEY (id));
CREATE INDEX idx_treasury_entries_created_by ON public.treasury_entries USING btree (created_by);
CREATE INDEX idx_treasury_entries_payment_date ON public.treasury_entries USING btree (payment_date DESC);


-- public.user_push_subscriptions definição

-- Drop table

-- DROP TABLE public.user_push_subscriptions;

CREATE TABLE public.user_push_subscriptions ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NULL, "subscription" jsonb NOT NULL, device_info jsonb NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT user_push_subscriptions_pkey PRIMARY KEY (id));


-- public.users definição

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users ( id uuid DEFAULT gen_random_uuid() NOT NULL, email text NOT NULL, "password" text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT users_pkey PRIMARY KEY (id));
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


-- public.volunteers definição

-- Drop table

-- DROP TABLE public.volunteers;

CREATE TABLE public.volunteers ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, full_name text NOT NULL, phone text NULL, availability text NULL, interest_area text NULL, interest_areas _text DEFAULT ARRAY[]::text[] NULL, status text DEFAULT 'pending'::text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT volunteers_pkey PRIMARY KEY (id));


-- public.wz_dispatches definição

-- Drop table

-- DROP TABLE public.wz_dispatches;

CREATE TABLE public.wz_dispatches ( title text NOT NULL, "content" text NULL, "type" text NOT NULL, target_group_id text NULL, target_user_id text NULL, priority text DEFAULT 'normal'::text NOT NULL, status text DEFAULT 'pending'::text NOT NULL, scheduled_at timestamp(6) NOT NULL, sent_at timestamp(6) NULL, error_message text NULL, created_by text NULL, created_at timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, id uuid DEFAULT gen_random_uuid() NOT NULL, attachment_url text NULL, CONSTRAINT wz_dispatches_pkey PRIMARY KEY (id));


-- public.devotional_likes definição

-- Drop table

-- DROP TABLE public.devotional_likes;

CREATE TABLE public.devotional_likes ( id uuid DEFAULT gen_random_uuid() NOT NULL, devotional_id uuid NOT NULL, user_id uuid NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT devotional_likes_pkey PRIMARY KEY (id), CONSTRAINT devotional_likes_devotional_id_fkey FOREIGN KEY (devotional_id) REFERENCES public.devotionals(id) ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE UNIQUE INDEX devotional_likes_devotional_id_user_id_key ON public.devotional_likes USING btree (devotional_id, user_id);


-- public.events definição

-- Drop table

-- DROP TABLE public.events;

CREATE TABLE public.events ( id uuid DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, description text NULL, event_date timestamptz(6) NOT NULL, "location" text NULL, is_general bool DEFAULT true NOT NULL, group_id uuid NULL, created_by uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, event_type text DEFAULT 'simple'::text NOT NULL, banner_url text NULL, speakers text NULL, price numeric DEFAULT 0 NULL, pix_key text NULL, pix_qrcode_url text NULL, map_url text NULL, send_whatsapp bool DEFAULT false NULL, require_checkin bool DEFAULT false NULL, checkin_qr_secret text NULL, is_public bool DEFAULT false NOT NULL, CONSTRAINT events_pkey PRIMARY KEY (id), CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE SET NULL ON UPDATE CASCADE);
CREATE INDEX idx_events_is_public ON public.events USING btree (is_public);


-- public.group_routines definição

-- Drop table

-- DROP TABLE public.group_routines;

CREATE TABLE public.group_routines ( id uuid DEFAULT gen_random_uuid() NOT NULL, routine_key text NOT NULL, is_enabled bool DEFAULT true NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, group_id uuid NULL, role_id uuid NULL, CONSTRAINT group_routines_pkey PRIMARY KEY (id), CONSTRAINT group_routines_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE SET NULL ON UPDATE CASCADE);
CREATE UNIQUE INDEX group_routines_group_id_role_id_routine_key_key ON public.group_routines USING btree (group_id, role_id, routine_key);


-- public.member_groups definição

-- Drop table

-- DROP TABLE public.member_groups;

CREATE TABLE public.member_groups ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, group_id uuid NOT NULL, "role" text DEFAULT 'member'::text NULL, joined_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT member_groups_pkey PRIMARY KEY (id), CONSTRAINT member_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE UNIQUE INDEX member_groups_user_id_group_id_key ON public.member_groups USING btree (user_id, group_id);


-- public.profiles definição

-- Drop table

-- DROP TABLE public.profiles;

CREATE TABLE public.profiles ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, full_name text DEFAULT ''::text NOT NULL, avatar_url text NULL, whatsapp_phone text NULL, username text NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT profiles_pkey PRIMARY KEY (id), CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);


-- public.user_roles definição

-- Drop table

-- DROP TABLE public.user_roles;

CREATE TABLE public.user_roles ( id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, "role" public."app_role" DEFAULT 'membro'::app_role NOT NULL, CONSTRAINT user_roles_pkey PRIMARY KEY (id), CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX user_roles_user_id_key ON public.user_roles USING btree (user_id);
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);


-- public.volunteer_schedules definição

-- Drop table

-- DROP TABLE public.volunteer_schedules;

CREATE TABLE public.volunteer_schedules ( id uuid DEFAULT gen_random_uuid() NOT NULL, schedule_date date NOT NULL, role_function text NOT NULL, volunteer_id uuid NULL, item_user_id uuid NULL, group_id uuid NULL, created_by uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT volunteer_schedules_pkey PRIMARY KEY (id), CONSTRAINT volunteer_schedules_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT volunteer_schedules_item_user_id_fkey FOREIGN KEY (item_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX idx_v_schedules_user_id ON public.volunteer_schedules USING btree (item_user_id);


-- public.wz_dispatch_attachments definição

-- Drop table

-- DROP TABLE public.wz_dispatch_attachments;

CREATE TABLE public.wz_dispatch_attachments ( "type" text NOT NULL, filename text NOT NULL, filepath text NOT NULL, mimetype text NOT NULL, id uuid DEFAULT gen_random_uuid() NOT NULL, dispatch_id uuid NOT NULL, CONSTRAINT wz_dispatch_attachments_pkey PRIMARY KEY (id), CONSTRAINT wz_dispatch_attachments_dispatch_id_fkey FOREIGN KEY (dispatch_id) REFERENCES public.wz_dispatches(id) ON DELETE CASCADE ON UPDATE CASCADE);


-- public.wz_dispatch_logs definição

-- Drop table

-- DROP TABLE public.wz_dispatch_logs;

CREATE TABLE public.wz_dispatch_logs ( recipient text NOT NULL, status text NOT NULL, "error" text NULL, created_at timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, id uuid DEFAULT gen_random_uuid() NOT NULL, dispatch_id uuid NOT NULL, CONSTRAINT wz_dispatch_logs_pkey PRIMARY KEY (id), CONSTRAINT wz_dispatch_logs_dispatch_id_fkey FOREIGN KEY (dispatch_id) REFERENCES public.wz_dispatches(id) ON DELETE CASCADE ON UPDATE CASCADE);


-- public.announcements definição

-- Drop table

-- DROP TABLE public.announcements;

CREATE TABLE public.announcements ( id uuid DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, "content" text NOT NULL, "type" text NOT NULL, group_id uuid NULL, target_user_id uuid NULL, target_group_id uuid NULL, created_by uuid NULL, priority text DEFAULT 'normal'::text NULL, send_whatsapp bool DEFAULT false NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT announcements_pkey PRIMARY KEY (id), CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT announcements_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE SET NULL ON UPDATE CASCADE);


-- public.culto_reports definição

-- Drop table

-- DROP TABLE public.culto_reports;

CREATE TABLE public.culto_reports ( id uuid DEFAULT gen_random_uuid() NOT NULL, report_date date NOT NULL, report_type text DEFAULT 'culto'::text NOT NULL, total_attendees int4 DEFAULT 0 NOT NULL, children_count int4 DEFAULT 0 NOT NULL, youth_count int4 DEFAULT 0 NOT NULL, monitors_count int4 DEFAULT 0 NOT NULL, public_count int4 DEFAULT 0 NOT NULL, notes text NULL, event_id uuid NULL, escala_data jsonb DEFAULT '[]'::jsonb NULL, created_by uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT culto_reports_pkey PRIMARY KEY (id), CONSTRAINT culto_reports_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL ON UPDATE CASCADE);
CREATE INDEX idx_culto_reports_event_id ON public.culto_reports USING btree (event_id);
CREATE INDEX idx_culto_reports_report_date ON public.culto_reports USING btree (report_date DESC);


-- public.event_checkins definição

-- Drop table

-- DROP TABLE public.event_checkins;

CREATE TABLE public.event_checkins ( id uuid DEFAULT gen_random_uuid() NOT NULL, event_id uuid NOT NULL, user_id uuid NOT NULL, checked_in_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT event_checkins_pkey PRIMARY KEY (id), CONSTRAINT event_checkins_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX event_checkins_event_id_user_id_key ON public.event_checkins USING btree (event_id, user_id);
CREATE INDEX idx_event_checkins_event ON public.event_checkins USING btree (event_id);


-- public.event_registrations definição

-- Drop table

-- DROP TABLE public.event_registrations;

CREATE TABLE public.event_registrations ( id uuid DEFAULT gen_random_uuid() NOT NULL, event_id uuid NOT NULL, user_id uuid NOT NULL, "payment_status" text DEFAULT 'pending'::text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT event_registrations_pkey PRIMARY KEY (id), CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX event_registrations_event_id_user_id_key ON public.event_registrations USING btree (event_id, user_id);


-- public.event_reports definição

-- Drop table

-- DROP TABLE public.event_reports;

CREATE TABLE public.event_reports ( id uuid DEFAULT gen_random_uuid() NOT NULL, event_id uuid NULL, group_id uuid NULL, report_date date DEFAULT CURRENT_DATE NOT NULL, report_type text DEFAULT 'culto'::text NOT NULL, total_attendees int4 DEFAULT 0 NULL, children_count int4 DEFAULT 0 NULL, monitors_count int4 DEFAULT 0 NULL, youth_count int4 DEFAULT 0 NULL, public_count int4 DEFAULT 0 NULL, total_offerings numeric DEFAULT 0 NULL, tithes_amount numeric DEFAULT 0 NULL, tithers jsonb DEFAULT '[]'::jsonb NULL, notes text NULL, created_by uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, visitors_count int4 DEFAULT 0 NOT NULL, preacher text NULL, sermon_ref text NULL, pastors _text NULL, worship_team _text NULL, welcome_team _text NULL, media_team _text NULL, CONSTRAINT event_reports_pkey PRIMARY KEY (id), CONSTRAINT event_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT event_reports_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT event_reports_group_id_fkey FOREIGN KEY (group_id) REFERENCES public."groups"(id) ON DELETE SET NULL ON UPDATE CASCADE);


-- public.event_rsvps definição

-- Drop table

-- DROP TABLE public.event_rsvps;

CREATE TABLE public.event_rsvps ( id uuid DEFAULT gen_random_uuid() NOT NULL, event_id uuid NOT NULL, user_id uuid NOT NULL, status text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, CONSTRAINT event_rsvps_pkey PRIMARY KEY (id), CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE ON UPDATE CASCADE);
CREATE UNIQUE INDEX event_rsvps_event_id_user_id_key ON public.event_rsvps USING btree (event_id, user_id);


-- public.kids_checkins definição

-- Drop table

-- DROP TABLE public.kids_checkins;

CREATE TABLE public.kids_checkins ( id uuid DEFAULT gen_random_uuid() NOT NULL, child_name text NOT NULL, guardian_id uuid NULL, items_description text NULL, validation_token text NOT NULL, status text DEFAULT 'active'::text NULL, call_requested bool DEFAULT false NULL, category text DEFAULT 'kids'::text NULL, event_id uuid NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, updated_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT kids_checkins_pkey PRIMARY KEY (id), CONSTRAINT kids_checkins_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE ON UPDATE CASCADE);


-- public.messages definição

-- Drop table

-- DROP TABLE public.messages;

CREATE TABLE public.messages ( id uuid DEFAULT gen_random_uuid() NOT NULL, sender_id uuid NOT NULL, recipient_id uuid NULL, group_id uuid NULL, "content" text NOT NULL, created_at timestamptz(6) DEFAULT CURRENT_TIMESTAMP NOT NULL, is_hidden bool DEFAULT false NOT NULL, CONSTRAINT messages_pkey PRIMARY KEY (id), CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL ON UPDATE CASCADE, CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE RESTRICT ON UPDATE CASCADE);