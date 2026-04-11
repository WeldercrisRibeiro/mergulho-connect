-- Fix foreign keys para o PostgREST (Supabase) conseguir fazer os JOINs com a tabela profiles

-- 1. Garante que profiles.user_id seja uma chave única (necessário para ser alvo de FK)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- 2. Kids Checkin - Ajustar a referência de auth.users para public.profiles
-- O front-end usa profiles:guardian_id(full_name), o banco precisa do vinculo!
ALTER TABLE public.kids_checkins DROP CONSTRAINT IF EXISTS kids_checkins_guardian_id_fkey;
ALTER TABLE public.kids_checkins ADD CONSTRAINT kids_checkins_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 3. Volunteer Schedules - Ajustar item_user_id para apontar para profiles
-- O front-end usa profiles:item_user_id(full_name) na consulta.
ALTER TABLE public.volunteer_schedules DROP CONSTRAINT IF EXISTS volunteer_schedules_item_user_id_fkey;
ALTER TABLE public.volunteer_schedules ADD CONSTRAINT volunteer_schedules_item_user_id_fkey FOREIGN KEY (item_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 4. Event_reports - Ajustar created_by
ALTER TABLE public.event_reports DROP CONSTRAINT IF EXISTS event_reports_created_by_fkey;
ALTER TABLE public.event_reports ADD CONSTRAINT event_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
