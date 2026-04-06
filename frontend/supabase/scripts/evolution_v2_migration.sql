-- 1. Separar Kids de Volumes + Vincular a Evento
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kids_checkins' AND column_name = 'category') THEN
        ALTER TABLE public.kids_checkins ADD COLUMN category text DEFAULT 'kids' CHECK (category IN ('kids', 'volume'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kids_checkins' AND column_name = 'event_id') THEN
        ALTER TABLE public.kids_checkins ADD COLUMN event_id uuid REFERENCES public.events(id);
    END IF;
END $$;

-- 2. Configurações de Vídeo
-- Inserir chaves se não existirem
INSERT INTO public.site_settings (id, value) VALUES ('about_us_video_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.site_settings (id, value) VALUES ('about_us_video_is_upload', 'false') ON CONFLICT (id) DO NOTHING;

-- 3. Garantir Políticas de RLS para os novos campos
-- Já configuradas anteriormente, mas reforçando se necessário.
-- O campo category e event_id serão usados nos filtros de SELECT.
