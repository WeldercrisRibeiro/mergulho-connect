-- ============================================================
--  Migração: adicionar coluna is_public na tabela events
--  Supabase / PostgreSQL
-- ============================================================

-- 1. Adiciona a coluna (safe — não quebra dados existentes)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 2. Índice para a query da agenda pública (OR entre is_general e is_public)
CREATE INDEX IF NOT EXISTS idx_events_is_public
  ON public.events (is_public)
  WHERE is_public = true;

-- 3. Eventos gerais já eram públicos por definição —
--    sincroniza retroativamente (opcional, mas recomendado)
UPDATE public.events
  SET is_public = true
  WHERE is_general = true AND is_public = false;

-- ============================================================
--  FIM DA MIGRAÇÃO
-- ============================================================