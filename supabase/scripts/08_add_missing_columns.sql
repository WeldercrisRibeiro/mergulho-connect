-- Adiciona colunas que faltavam e foram adicionadas no frontend mas não no banco

-- 1. Tabela EVENT_REPORTS
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS youth_count integer DEFAULT 0;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS public_count integer DEFAULT 0;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS tithes_amount numeric DEFAULT 0;
ALTER TABLE public.event_reports ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- 2. Tabela VOLUNTEER_SCHEDULES
-- Adiciona a coluna item_user_id que foi referenciada nos scripts anteriores
ALTER TABLE public.volunteer_schedules ADD COLUMN IF NOT EXISTS item_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- (Reaplica a FKEY caso o script 07 tenha falhado por falta dessa coluna)
ALTER TABLE public.volunteer_schedules DROP CONSTRAINT IF EXISTS volunteer_schedules_item_user_id_fkey;
ALTER TABLE public.volunteer_schedules ADD CONSTRAINT volunteer_schedules_item_user_id_fkey FOREIGN KEY (item_user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
