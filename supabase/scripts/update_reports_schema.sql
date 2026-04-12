-- Adicionar vínculo com eventos e dados de escala nos relatórios de culto
ALTER TABLE public.culto_reports 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS escala_data JSONB DEFAULT '[]'::jsonb;

-- Índice para performance nas buscas por evento
CREATE INDEX IF NOT EXISTS idx_culto_reports_event_id ON public.culto_reports(event_id);

-- Comentário para documentação
COMMENT ON COLUMN public.culto_reports.escala_data IS 'Armazena a escala manual no formato [{role: text, name: text}]';
