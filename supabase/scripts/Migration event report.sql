-- ============================================================
-- Migration: event_reports — novos campos
-- Gerado em: 2026-04-11
-- ============================================================

ALTER TABLE event_reports
  -- Frequência
  ADD COLUMN IF NOT EXISTS visitors_count   INTEGER NOT NULL DEFAULT 0,

  -- Culto
  ADD COLUMN IF NOT EXISTS preacher         TEXT,
  ADD COLUMN IF NOT EXISTS sermon_ref       TEXT,

  -- Escalas (arrays de texto, opcionais)
  ADD COLUMN IF NOT EXISTS pastors          TEXT[],
  ADD COLUMN IF NOT EXISTS worship_team     TEXT[],
  ADD COLUMN IF NOT EXISTS welcome_team     TEXT[],
  ADD COLUMN IF NOT EXISTS media_team       TEXT[];

-- ============================================================
-- Comentários descritivos nas colunas (opcional mas recomendado)
-- ============================================================

COMMENT ON COLUMN event_reports.visitors_count IS 'Quantidade de visitantes presentes no culto/evento';
COMMENT ON COLUMN event_reports.preacher       IS 'Nome do pregador do culto';
COMMENT ON COLUMN event_reports.sermon_ref     IS 'Referência bíblica e/ou tema da pregação';
COMMENT ON COLUMN event_reports.pastors        IS 'Lista de pastores presentes no culto';
COMMENT ON COLUMN event_reports.worship_team   IS 'Escala do louvor (músicos e vocais)';
COMMENT ON COLUMN event_reports.welcome_team   IS 'Escala do acolhimento (recepcionistas)';
COMMENT ON COLUMN event_reports.media_team     IS 'Escala da mídia (operadores de som/projeção)';