-- ============================================================
--  TESOURARIA — Script Corrigido e Atualizado
--  Inclui: Vínculo com Agenda e Escalas Manuais
-- ============================================================

-- ------------------------------------------------------------
-- 1. TREASURY_ENTRIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treasury_entries (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name   TEXT          NOT NULL,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_type  TEXT          NOT NULL CHECK (payment_type IN ('dizimo', 'oferta')),
  payment_date  DATE          NOT NULL,
  notes         TEXT,
  created_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treasury_entries_created_by   ON public.treasury_entries (created_by);
CREATE INDEX IF NOT EXISTS idx_treasury_entries_payment_date ON public.treasury_entries (payment_date DESC);

ALTER TABLE public.treasury_entries ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS usando a função has_role do projeto
DROP POLICY IF EXISTS "Membros podem registrar contribuições" ON public.treasury_entries;
CREATE POLICY "Membros podem registrar contribuições" ON public.treasury_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Membros veem suas próprias contribuições" ON public.treasury_entries;
CREATE POLICY "Membros veem suas próprias contribuições" ON public.treasury_entries
  FOR SELECT TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins veem todas as contribuições" ON public.treasury_entries;
CREATE POLICY "Admins veem todas as contribuições" ON public.treasury_entries
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem editar contribuições" ON public.treasury_entries;
CREATE POLICY "Admins podem editar contribuições" ON public.treasury_entries
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins podem excluir contribuições" ON public.treasury_entries;
CREATE POLICY "Admins podem excluir contribuições" ON public.treasury_entries
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- 2. CULTO_REPORTS (Atualizado com EventId e Escala)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.culto_reports (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date      DATE        NOT NULL,
  report_type      TEXT        NOT NULL DEFAULT 'culto'
                               CHECK (report_type IN ('culto', 'evento', 'conferencia', 'celula')),
  total_attendees  INTEGER     NOT NULL DEFAULT 0 CHECK (total_attendees >= 0),
  children_count   INTEGER     NOT NULL DEFAULT 0 CHECK (children_count >= 0),
  youth_count      INTEGER     NOT NULL DEFAULT 0 CHECK (youth_count >= 0),
  monitors_count   INTEGER     NOT NULL DEFAULT 0 CHECK (monitors_count >= 0),
  public_count     INTEGER     NOT NULL DEFAULT 0 CHECK (public_count >= 0),
  notes            TEXT,
  event_id         UUID        REFERENCES public.events(id) ON DELETE SET NULL,
  escala_data      JSONB       DEFAULT '[]'::jsonb,
  created_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Se a tabela já existia, garantir que as novas colunas existam
ALTER TABLE public.culto_reports ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;
ALTER TABLE public.culto_reports ADD COLUMN IF NOT EXISTS escala_data JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_culto_reports_report_date ON public.culto_reports (report_date DESC);
CREATE INDEX IF NOT EXISTS idx_culto_reports_event_id ON public.culto_reports (event_id);

ALTER TABLE public.culto_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem gerenciar relatórios" ON public.culto_reports;
CREATE POLICY "Admins podem gerenciar relatórios" ON public.culto_reports
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ------------------------------------------------------------
-- 3. SITE_SETTINGS
-- ------------------------------------------------------------
INSERT INTO public.site_settings (id, value)
VALUES ('pix_key', '')
ON CONFLICT (id) DO NOTHING;
