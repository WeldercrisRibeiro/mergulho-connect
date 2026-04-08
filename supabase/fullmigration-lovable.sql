-- =============================================================
-- MIGRAÇÃO COMPLETA - Mergulho Connect
-- Gerado em: 2026-04-07
-- Este script recria toda a estrutura do banco de dados já incluindo para backend do Whatsapp
-- Execute em um banco limpo ou use IF NOT EXISTS para segurança.
-- =============================================================

-- =====================
-- 1. ENUM
-- =====================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderador', 'membro', 'visitante', 'gerente');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Garantir todos os valores do enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='visitante') THEN
    ALTER TYPE public.app_role ADD VALUE 'visitante';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='gerente') THEN
    ALTER TYPE public.app_role ADD VALUE 'gerente';
  END IF;
END $$;

-- =====================
-- 2. TABELAS
-- =====================

-- GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'users',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  whatsapp_phone TEXT,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER_ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'membro',
  UNIQUE(user_id, role),
  UNIQUE(user_id)
);

-- MEMBER_GROUPS
CREATE TABLE IF NOT EXISTS public.member_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID,
  group_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_general BOOLEAN NOT NULL DEFAULT true,
  group_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL DEFAULT 'simple',
  banner_url TEXT,
  speakers TEXT,
  price NUMERIC DEFAULT 0,
  pix_key TEXT,
  pix_qrcode_url TEXT,
  map_url TEXT,
  send_whatsapp BOOLEAN DEFAULT false
);

-- EVENT_RSVPS
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- EVENT_REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- EVENT_REPORTS
CREATE TABLE IF NOT EXISTS public.event_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  group_id UUID,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_type TEXT NOT NULL DEFAULT 'culto',
  total_attendees INTEGER DEFAULT 0,
  children_count INTEGER DEFAULT 0,
  monitors_count INTEGER DEFAULT 0,
  youth_count INTEGER DEFAULT 0,
  public_count INTEGER DEFAULT 0,
  total_offerings NUMERIC DEFAULT 0,
  tithes_amount NUMERIC DEFAULT 0,
  tithers JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEVOTIONALS
CREATE TABLE IF NOT EXISTS public.devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  publish_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiration_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  video_url TEXT,
  is_video_upload BOOLEAN DEFAULT false
);

-- DEVOTIONAL_LIKES
CREATE TABLE IF NOT EXISTS public.devotional_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(devotional_id, user_id)
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  group_id UUID,
  target_user_id UUID,
  target_group_id UUID,
  created_by UUID,
  priority TEXT DEFAULT 'normal',
  send_whatsapp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- KIDS_CHECKINS
CREATE TABLE IF NOT EXISTS public.kids_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  guardian_id UUID,
  items_description TEXT,
  validation_token TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  call_requested BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'kids',
  event_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- VOLUNTEERS
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  availability TEXT,
  interest_area TEXT,
  interest_areas TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- VOLUNTEER_SCHEDULES
CREATE TABLE IF NOT EXISTS public.volunteer_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_date DATE NOT NULL,
  role_function TEXT NOT NULL,
  volunteer_id UUID,
  item_user_id UUID,
  group_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_v_schedules_user_id ON public.volunteer_schedules(item_user_id);

-- GROUP_ROUTINES
CREATE TABLE IF NOT EXISTS public.group_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT,
  routine_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(group_id, routine_key)
);

-- HIDDEN_CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.hidden_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_user_id UUID,
  group_id UUID,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id),
  UNIQUE(user_id, target_user_id)
);

-- LANDING_PHOTOS
CREATE TABLE IF NOT EXISTS public.landing_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LANDING_TESTIMONIALS
CREATE TABLE IF NOT EXISTS public.landing_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- CONTACT_MESSAGES
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SITE_SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- USER_PUSH_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  subscription JSONB NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- WZ_DISPATCHES
CREATE TABLE IF NOT EXISTS public.wz_dispatches (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  target_group_id TEXT,
  target_user_id TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WZ_DISPATCH_LOGS
CREATE TABLE IF NOT EXISTS public.wz_dispatch_logs (
  id TEXT PRIMARY KEY,
  dispatch_id TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- WZ_DISPATCH_ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.wz_dispatch_attachments (
  id TEXT PRIMARY KEY,
  dispatch_id TEXT NOT NULL,
  type TEXT NOT NULL,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  mimetype TEXT NOT NULL
);

-- =====================
-- 3. FUNÇÕES
-- =====================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.role = role_name::public.app_role
    AND user_roles.user_id = has_role.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = has_role.user_id
    AND ur.role::text = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, whatsapp_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_phone', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'visitante'::public.app_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_manage_user(
  email TEXT,
  password TEXT DEFAULT NULL,
  raw_user_meta_data JSONB DEFAULT '{}'::JSONB,
  target_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_uid UUID;
  effective_password TEXT;
  password_hash TEXT;
BEGIN
  effective_password := COALESCE(NULLIF(btrim(password), ''), '123456');
  password_hash := extensions.crypt(effective_password, extensions.gen_salt('bf', 10));

  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users SET
      email = admin_manage_user.email,
      encrypted_password = CASE WHEN admin_manage_user.password IS NOT NULL AND btrim(admin_manage_user.password) <> '' THEN password_hash ELSE encrypted_password END,
      raw_user_meta_data = admin_manage_user.raw_user_meta_data,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = target_user_id;
    RETURN target_user_id;
  ELSE
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      admin_manage_user.email, password_hash,
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, admin_manage_user.raw_user_meta_data,
      false, now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_uid;
    RETURN new_uid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

CREATE OR REPLACE FUNCTION public.admin_remove_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM auth.users WHERE id = target_user_id;
  DELETE FROM public.member_groups WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================
-- 4. TRIGGER - Novo usuário
-- =====================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- 5. RLS - HABILITAR
-- =====================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hidden_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================
-- 6. RLS POLICIES
-- =====================

-- === GROUPS ===
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
CREATE POLICY "Admins can manage groups" ON public.groups FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Allow_Authenticated_Select_Groups" ON public.groups;
CREATE POLICY "Allow_Authenticated_Select_Groups" ON public.groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Anyone can view groups" ON public.groups;
CREATE POLICY "Anyone can view groups" ON public.groups FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Groups viewable by authenticated" ON public.groups;
CREATE POLICY "Groups viewable by authenticated" ON public.groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public view groups" ON public.groups;
CREATE POLICY "Public view groups" ON public.groups FOR SELECT TO public USING (true);

-- === PROFILES ===
DROP POLICY IF EXISTS "Perfis visiveis para autenticados" ON public.profiles;
CREATE POLICY "Perfis visiveis para autenticados" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Profiles_Admin_Full_Access" ON public.profiles;
CREATE POLICY "Profiles_Admin_Full_Access" ON public.profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role::text = ANY(ARRAY['admin','manager'])));
DROP POLICY IF EXISTS "Profiles_Public_View" ON public.profiles;
CREATE POLICY "Profiles_Public_View" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public view profiles" ON public.profiles;
CREATE POLICY "Public view profiles" ON public.profiles FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (true);

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Admin_Manage_Roles" ON public.user_roles;
CREATE POLICY "Admin_Manage_Roles" ON public.user_roles FOR ALL TO authenticated USING (is_admin_master()) WITH CHECK (is_admin_master());
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles u WHERE u.user_id = auth.uid() AND u.role = 'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid() LIMIT 1) = 'admin'::app_role);
DROP POLICY IF EXISTS "Public view roles" ON public.user_roles;
CREATE POLICY "Public view roles" ON public.user_roles FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.user_roles;
CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "User_Roles_Self_Access" ON public.user_roles;
CREATE POLICY "User_Roles_Self_Access" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users_View_Own_Roles" ON public.user_roles;
CREATE POLICY "Users_View_Own_Roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === MEMBER_GROUPS ===
DROP POLICY IF EXISTS "Admins can manage member groups" ON public.member_groups;
CREATE POLICY "Admins can manage member groups" ON public.member_groups FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage member_groups" ON public.member_groups;
CREATE POLICY "Admins can manage member_groups" ON public.member_groups FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view member_groups" ON public.member_groups;
CREATE POLICY "Anyone can view member_groups" ON public.member_groups FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Gerentes podem ver membros de seus grupos" ON public.member_groups;
CREATE POLICY "Gerentes podem ver membros de seus grupos" ON public.member_groups FOR SELECT TO authenticated USING ((EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'gerente'::app_role]))) OR (user_id = auth.uid()));
DROP POLICY IF EXISTS "Member groups viewable by authenticated" ON public.member_groups;
CREATE POLICY "Member groups viewable by authenticated" ON public.member_groups FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Public view member_groups" ON public.member_groups;
CREATE POLICY "Public view member_groups" ON public.member_groups FOR SELECT TO public USING (true);
DROP POLICY IF EXISTS "Users can join groups" ON public.member_groups;
CREATE POLICY "Users can join groups" ON public.member_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave groups" ON public.member_groups;
CREATE POLICY "Users can leave groups" ON public.member_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users_View_Own_Group_Memberships" ON public.member_groups;
CREATE POLICY "Users_View_Own_Group_Memberships" ON public.member_groups FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role));

-- === MESSAGES ===
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING ((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = messages.group_id)));

-- === EVENTS ===
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "General events viewable by authenticated" ON public.events;
CREATE POLICY "General events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING ((is_general = true) OR (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = events.group_id)) OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers_Manage_Events" ON public.events;
CREATE POLICY "Managers_Manage_Events" ON public.events FOR ALL TO authenticated
  USING (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) OR (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'gerente'::app_role) AND (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = events.group_id))))
  WITH CHECK (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) OR (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'gerente'::app_role) AND (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = events.group_id))));
DROP POLICY IF EXISTS "Public view events" ON public.events;
CREATE POLICY "Public view events" ON public.events FOR SELECT TO public USING (true);

-- === EVENT_RSVPS ===
DROP POLICY IF EXISTS "RSVPs viewable by authenticated" ON public.event_rsvps;
CREATE POLICY "RSVPs viewable by authenticated" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can delete own RSVPs" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can manage own RSVPs" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can update own RSVPs" ON public.event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- === EVENT_REGISTRATIONS ===
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.event_registrations;
CREATE POLICY "Admins can manage registrations" ON public.event_registrations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated can view registrations" ON public.event_registrations;
CREATE POLICY "Authenticated can view registrations" ON public.event_registrations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can register" ON public.event_registrations;
CREATE POLICY "Users can register" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === EVENT_REPORTS ===
DROP POLICY IF EXISTS "Admins can manage reports" ON public.event_reports;
CREATE POLICY "Admins can manage reports" ON public.event_reports FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view reports" ON public.event_reports;
CREATE POLICY "Admins can view reports" ON public.event_reports FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Managers_Manage_Reports" ON public.event_reports;
CREATE POLICY "Managers_Manage_Reports" ON public.event_reports FOR ALL TO authenticated USING (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) OR (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = event_reports.group_id AND member_groups.role = ANY(ARRAY['manager','gerente','Líder']))));

-- === DEVOTIONALS ===
DROP POLICY IF EXISTS "Admins can manage devotionals" ON public.devotionals;
CREATE POLICY "Admins can manage devotionals" ON public.devotionals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Published devotionals viewable" ON public.devotionals;
CREATE POLICY "Published devotionals viewable" ON public.devotionals FOR SELECT TO authenticated USING (((status = 'published' AND is_active = true AND (expiration_date IS NULL OR expiration_date > now())) OR has_role(auth.uid(), 'admin'::app_role)));

-- === DEVOTIONAL_LIKES ===
DROP POLICY IF EXISTS "Authenticated can view likes" ON public.devotional_likes;
CREATE POLICY "Authenticated can view likes" ON public.devotional_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can like devotionals" ON public.devotional_likes;
CREATE POLICY "Users can like devotionals" ON public.devotional_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can unlike devotionals" ON public.devotional_likes;
CREATE POLICY "Users can unlike devotionals" ON public.devotional_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- === ANNOUNCEMENTS ===
DROP POLICY IF EXISTS "ADM cria avisos" ON public.announcements;
CREATE POLICY "ADM cria avisos" ON public.announcements FOR INSERT TO authenticated WITH CHECK (has_role('admin'::app_role, auth.uid()));
DROP POLICY IF EXISTS "Admins_Manage_Announcements" ON public.announcements;
CREATE POLICY "Admins_Manage_Announcements" ON public.announcements FOR ALL TO authenticated USING ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) WITH CHECK ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role);
DROP POLICY IF EXISTS "Anyone can view relevant notices" ON public.announcements;
CREATE POLICY "Anyone can view relevant notices" ON public.announcements FOR SELECT TO authenticated USING ((type = 'general') OR (target_user_id = auth.uid()) OR (group_id IN (SELECT mg.group_id FROM member_groups mg WHERE mg.user_id = auth.uid())));
DROP POLICY IF EXISTS "RLS_DELETE_ANNOUNCEMENTS" ON public.announcements;
CREATE POLICY "RLS_DELETE_ANNOUNCEMENTS" ON public.announcements FOR DELETE TO authenticated USING ((created_by = auth.uid()) OR (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role)));
DROP POLICY IF EXISTS "RLS_INSERT_ANNOUNCEMENTS" ON public.announcements;
CREATE POLICY "RLS_INSERT_ANNOUNCEMENTS" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "RLS_SELECT_ANNOUNCEMENTS" ON public.announcements;
CREATE POLICY "RLS_SELECT_ANNOUNCEMENTS" ON public.announcements FOR SELECT TO authenticated USING ((EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = ANY(ARRAY['admin'::app_role, 'gerente'::app_role]))) OR (created_by = auth.uid()) OR (type = 'general') OR (target_user_id = auth.uid()) OR (target_group_id IN (SELECT mg.group_id FROM member_groups mg WHERE mg.user_id = auth.uid())));
DROP POLICY IF EXISTS "Todos veem avisos gerais" ON public.announcements;
CREATE POLICY "Todos veem avisos gerais" ON public.announcements FOR SELECT TO authenticated USING (type = 'general');
DROP POLICY IF EXISTS "Users_Read_Filtered_Announcements" ON public.announcements;
CREATE POLICY "Users_Read_Filtered_Announcements" ON public.announcements FOR SELECT TO authenticated USING (((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) OR (target_user_id = auth.uid()) OR ((target_group_id IS NULL) AND (target_user_id IS NULL)) OR (EXISTS (SELECT 1 FROM member_groups WHERE member_groups.user_id = auth.uid() AND member_groups.group_id = announcements.target_group_id)));
DROP POLICY IF EXISTS "Usuários veem seus avisos individuais" ON public.announcements;
CREATE POLICY "Usuários veem seus avisos individuais" ON public.announcements FOR SELECT TO authenticated USING (target_user_id = auth.uid());

-- === KIDS_CHECKINS ===
DROP POLICY IF EXISTS "ADM vê tudo checkins" ON public.kids_checkins;
CREATE POLICY "ADM vê tudo checkins" ON public.kids_checkins FOR ALL TO authenticated USING (has_role('admin'::app_role, auth.uid()));
DROP POLICY IF EXISTS "Admin_Manager_Checkin_Access" ON public.kids_checkins;
CREATE POLICY "Admin_Manager_Checkin_Access" ON public.kids_checkins FOR ALL TO authenticated USING (auth.uid() IN (SELECT ur.user_id FROM user_roles ur WHERE ur.role::text = ANY(ARRAY['admin','gerente'])));
DROP POLICY IF EXISTS "Admin_Manager_Checkin_Read" ON public.kids_checkins;
CREATE POLICY "Admin_Manager_Checkin_Read" ON public.kids_checkins FOR SELECT TO authenticated USING (auth.uid() IN (SELECT ur.user_id FROM user_roles ur WHERE ur.role::text = ANY(ARRAY['admin','gerente'])));
DROP POLICY IF EXISTS "Checkin_Parent_View" ON public.kids_checkins;
CREATE POLICY "Checkin_Parent_View" ON public.kids_checkins FOR SELECT TO authenticated USING (guardian_id = auth.uid());

-- === VOLUNTEERS ===
DROP POLICY IF EXISTS "Admins can manage volunteers" ON public.volunteers;
CREATE POLICY "Admins can manage volunteers" ON public.volunteers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated can view volunteers" ON public.volunteers;
CREATE POLICY "Authenticated can view volunteers" ON public.volunteers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete own volunteer" ON public.volunteers;
CREATE POLICY "Users can delete own volunteer" ON public.volunteers FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own volunteer" ON public.volunteers;
CREATE POLICY "Users can update own volunteer" ON public.volunteers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can volunteer" ON public.volunteers;
CREATE POLICY "Users can volunteer" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- === VOLUNTEER_SCHEDULES ===
DROP POLICY IF EXISTS "Admins manage volunteer schedules" ON public.volunteer_schedules;
CREATE POLICY "Admins manage volunteer schedules" ON public.volunteer_schedules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Authenticated view volunteer schedules" ON public.volunteer_schedules;
CREATE POLICY "Authenticated view volunteer schedules" ON public.volunteer_schedules FOR SELECT TO authenticated USING (true);

-- === GROUP_ROUTINES ===
DROP POLICY IF EXISTS "Admins_Manage_Routines" ON public.group_routines;
CREATE POLICY "Admins_Manage_Routines" ON public.group_routines FOR ALL TO authenticated USING ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role) WITH CHECK ((SELECT u.role FROM user_roles u WHERE u.user_id = auth.uid()) = 'admin'::app_role);
DROP POLICY IF EXISTS "Everyone_Read_Routines" ON public.group_routines;
CREATE POLICY "Everyone_Read_Routines" ON public.group_routines FOR SELECT TO authenticated USING (true);

-- === HIDDEN_CONVERSATIONS ===
DROP POLICY IF EXISTS "Admins can view all hidden settings for audit" ON public.hidden_conversations;
CREATE POLICY "Admins can view all hidden settings for audit" ON public.hidden_conversations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can manage own hidden conversations" ON public.hidden_conversations;
CREATE POLICY "Users can manage own hidden conversations" ON public.hidden_conversations FOR ALL TO authenticated USING (auth.uid() = user_id);

-- === LANDING_PHOTOS ===
DROP POLICY IF EXISTS "Admins can manage landing photos" ON public.landing_photos;
CREATE POLICY "Admins can manage landing photos" ON public.landing_photos FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Landing photos viewable by everyone" ON public.landing_photos;
CREATE POLICY "Landing photos viewable by everyone" ON public.landing_photos FOR SELECT TO public USING (true);

-- === LANDING_TESTIMONIALS ===
DROP POLICY IF EXISTS "Admins can manage landing testimonials" ON public.landing_testimonials;
CREATE POLICY "Admins can manage landing testimonials" ON public.landing_testimonials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Landing testimonials viewable by everyone" ON public.landing_testimonials;
CREATE POLICY "Landing testimonials viewable by everyone" ON public.landing_testimonials FOR SELECT TO public USING (true);

-- === CONTACT_MESSAGES ===
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages FOR INSERT TO public WITH CHECK (true);

-- === SITE_SETTINGS ===
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Site settings viewable by everyone" ON public.site_settings;
CREATE POLICY "Site settings viewable by everyone" ON public.site_settings FOR SELECT TO public USING (true);

-- === USER_PUSH_SUBSCRIPTIONS ===
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.user_push_subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON public.user_push_subscriptions FOR ALL TO authenticated USING (auth.uid() = user_id);

-- =====================
-- 7. REALTIME
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- =====================
-- 8. STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('landing-photos', 'landing-photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('devotionals', 'devotionals', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public read landing-photos" ON storage.objects;
CREATE POLICY "Public read landing-photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'landing-photos');
DROP POLICY IF EXISTS "Admin upload landing-photos" ON storage.objects;
CREATE POLICY "Admin upload landing-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'landing-photos' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin delete landing-photos" ON storage.objects;
CREATE POLICY "Admin delete landing-photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'landing-photos' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read devotionals" ON storage.objects;
CREATE POLICY "Public read devotionals" ON storage.objects FOR SELECT TO public USING (bucket_id = 'devotionals');
DROP POLICY IF EXISTS "Admin upload devotionals" ON storage.objects;
CREATE POLICY "Admin upload devotionals" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'devotionals' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin delete devotionals" ON storage.objects;
CREATE POLICY "Admin delete devotionals" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'devotionals' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public read event-banners" ON storage.objects;
CREATE POLICY "Public read event-banners" ON storage.objects FOR SELECT TO public USING (bucket_id = 'event-banners');
DROP POLICY IF EXISTS "Admin upload event-banners" ON storage.objects;
CREATE POLICY "Admin upload event-banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admin delete event-banners" ON storage.objects;
CREATE POLICY "Admin delete event-banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-banners' AND has_role(auth.uid(), 'admin'::app_role));

-- =====================
-- FIM DA MIGRAÇÃO COMPLETA
-- =====================
