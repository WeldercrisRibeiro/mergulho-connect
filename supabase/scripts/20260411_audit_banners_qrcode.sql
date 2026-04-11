-- =============================================================
-- MIGRATION: Auditoria, Admin CCM, QR Code Eventos, Banners
-- Data: 2026-04-11
-- Executar no Supabase SQL Editor
-- =============================================================

-- =====================
-- 1. NOVO VALOR NO ENUM app_role: admin_ccm
-- =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='admin_ccm') THEN
    ALTER TYPE public.app_role ADD VALUE 'admin_ccm';
  END IF;
END $$;

-- =====================
-- 2. TABELA: audit_logs
-- =====================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL,           -- login, create, update, delete, access
  routine TEXT NOT NULL,          -- agenda, devocionais, membros, etc.
  details JSONB DEFAULT '{}'::jsonb,  -- { old: {...}, new: {...} }
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_routine ON public.audit_logs(routine);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================
-- 3. NOVOS CAMPOS EM events
-- =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='require_checkin') THEN
    ALTER TABLE public.events ADD COLUMN require_checkin BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='checkin_qr_secret') THEN
    ALTER TABLE public.events ADD COLUMN checkin_qr_secret TEXT;
  END IF;
END $$;

-- =====================
-- 4. TABELA: event_checkins (presença via QR)
-- =====================
CREATE TABLE IF NOT EXISTS public.event_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON public.event_checkins(event_id);

-- =====================
-- 5. NOVOS CAMPOS EM landing_photos
-- =====================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_photos' AND column_name='expires_at') THEN
    ALTER TABLE public.landing_photos ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_photos' AND column_name='priority') THEN
    ALTER TABLE public.landing_photos ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='landing_photos' AND column_name='is_banner') THEN
    ALTER TABLE public.landing_photos ADD COLUMN is_banner BOOLEAN DEFAULT false;
  END IF;
END $$;

-- =====================
-- 6. RLS - audit_logs
-- =====================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'admin_ccm')
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin CCM can delete audit logs" ON public.audit_logs;
CREATE POLICY "Admin CCM can delete audit logs" ON public.audit_logs
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text = 'admin_ccm'
    )
  );

-- =====================
-- 7. RLS - event_checkins
-- =====================
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view event checkins" ON public.event_checkins;
CREATE POLICY "Authenticated can view event checkins" ON public.event_checkins
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can checkin themselves" ON public.event_checkins;
CREATE POLICY "Users can checkin themselves" ON public.event_checkins
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage event checkins" ON public.event_checkins;
CREATE POLICY "Admins manage event checkins" ON public.event_checkins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role::text IN ('admin', 'admin_ccm')
    )
  );

-- =====================
-- 8. REALTIME para audit_logs
-- =====================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checkins;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================
-- 9. BUCKET avatars (Storage)
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- =====================
-- 10. Atualizar is_admin_master para incluir admin_ccm
-- =====================
CREATE OR REPLACE FUNCTION public.is_admin_master()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role::text IN ('admin', 'admin_ccm')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================
-- FIM DA MIGRATION
-- =====================
