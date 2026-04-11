-- =============================================================
-- MIGRATION: Corrigir chaves estrangeiras perdidas da tabela events
-- Data: 2026-04-11
-- =============================================================

-- Remover registros com 'event_id' órfãos para evitar erro ao criar a restrição
DELETE FROM public.event_rsvps WHERE event_id NOT IN (SELECT id FROM public.events);
DELETE FROM public.event_registrations WHERE event_id NOT IN (SELECT id FROM public.events);

-- 1. Restauração do FK: event_rsvps -> events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_rsvps_event_id_fkey'
  ) THEN
    ALTER TABLE public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Restauração do FK: event_registrations -> events
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_registrations_event_id_fkey'
  ) THEN
    ALTER TABLE public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE;
  END IF;
END $$;
