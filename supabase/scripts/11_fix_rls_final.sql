-- Script Definitivo de Correção de RLS e Permissões de Storage

-- 1. Tabela site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on site_settings" ON public.site_settings;
CREATE POLICY "Admins can do everything on site_settings" 
ON public.site_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_ccm')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_ccm')
  )
);

-- 2. Garantir permissões de Storage para os buckets
-- Buckets: 'event-banners', 'landing-photos', 'site-assets'

-- Habilitar acesso aos buckets para administradores
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-banners', 'event-banners', true), ('landing-photos', 'landing-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Delete/Upload para Storage
DROP POLICY IF EXISTS "Admins can upload to event-banners" ON storage.objects;
CREATE POLICY "Admins can upload to event-banners" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'event-banners' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_ccm')
  )
);

DROP POLICY IF EXISTS "Admins can update event-banners" ON storage.objects;
CREATE POLICY "Admins can update event-banners" 
ON storage.objects 
FOR UPDATE
TO authenticated 
USING (
  bucket_id = 'event-banners' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_ccm')
  )
);

-- Repetir para landing-photos se necessário
DROP POLICY IF EXISTS "Admins can manage landing-photos" ON storage.objects;
CREATE POLICY "Admins can manage landing-photos" 
ON storage.objects 
FOR ALL
TO authenticated 
USING (
  bucket_id = 'landing-photos' AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'admin_ccm')
  )
);
