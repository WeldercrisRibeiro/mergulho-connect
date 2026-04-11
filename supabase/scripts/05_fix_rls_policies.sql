-- Fix RLS Policies for new tables

-- 1. Kids Checkin
ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view kids checkins" ON public.kids_checkins;
DROP POLICY IF EXISTS "Public can insert kids checkins" ON public.kids_checkins;
DROP POLICY IF EXISTS "Public can update kids checkins" ON public.kids_checkins;

CREATE POLICY "Public can view kids checkins" ON public.kids_checkins FOR SELECT USING (true);
CREATE POLICY "Public can insert kids checkins" ON public.kids_checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update kids checkins" ON public.kids_checkins FOR UPDATE USING (true);

-- 2. Volunteer Schedules
ALTER TABLE public.volunteer_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view volunteer schedules" ON public.volunteer_schedules;
DROP POLICY IF EXISTS "Public can insert volunteer schedules" ON public.volunteer_schedules;
DROP POLICY IF EXISTS "Public can update volunteer schedules" ON public.volunteer_schedules;
DROP POLICY IF EXISTS "Public can delete volunteer schedules" ON public.volunteer_schedules;

CREATE POLICY "Public can view volunteer schedules" ON public.volunteer_schedules FOR SELECT USING (true);
CREATE POLICY "Public can insert volunteer schedules" ON public.volunteer_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update volunteer schedules" ON public.volunteer_schedules FOR UPDATE USING (true);
CREATE POLICY "Public can delete volunteer schedules" ON public.volunteer_schedules FOR DELETE USING (true);

-- 3. Reports
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view reports" ON public.event_reports;
DROP POLICY IF EXISTS "Public can insert reports" ON public.event_reports;
DROP POLICY IF EXISTS "Public can update reports" ON public.event_reports;
DROP POLICY IF EXISTS "Public can delete reports" ON public.event_reports;

CREATE POLICY "Public can view reports" ON public.event_reports FOR SELECT USING (true);
CREATE POLICY "Public can insert reports" ON public.event_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update reports" ON public.event_reports FOR UPDATE USING (true);
CREATE POLICY "Public can delete reports" ON public.event_reports FOR DELETE USING (true);

-- 4. Contact Messages (Inbox Arquivados Bug)
-- Adiciona a coluna status para permitir arquivamento real no painel admin
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Fim do script
