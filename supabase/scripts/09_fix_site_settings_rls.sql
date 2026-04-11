-- 09_fix_site_settings_rls.sql
-- Garante que admins possam gerenciar as configurações do site (como banners)

-- 1. Habilita RLS (caso não esteja)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. Permite que QUALQUER PESSOA (inclusive visitantes) veja as configurações (para exibir o site)
DROP POLICY IF EXISTS "Public view" ON public.site_settings;
CREATE POLICY "Public view" ON public.site_settings 
FOR SELECT USING (true);

-- 3. Permite que ADMINS e ADMIN_CCM gerenciem (Inserir, Atualizar, Deletar)
DROP POLICY IF EXISTS "Admins manage settings" ON public.site_settings;
CREATE POLICY "Admins manage settings" ON public.site_settings
FOR ALL 
TO authenticated
USING (
  public.has_role('admin'::public.app_role, auth.uid()) OR 
  public.has_role('admin_ccm'::public.app_role, auth.uid())
)
WITH CHECK (
  public.has_role('admin'::public.app_role, auth.uid()) OR 
  public.has_role('admin_ccm'::public.app_role, auth.uid())
);

-- 4. Garante que os Admins tenham acesso total ao bucket de imagens (site-assets)
-- Se o bucket não existir, este comando falhará silenciosamente se não for via dashboard, 
-- mas as políticas abaixo garantem o acesso se ele existir.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Admins can upload site assets" ON storage.objects;
CREATE POLICY "Admins can upload site assets" ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'site-assets' AND (
  public.has_role('admin'::public.app_role, auth.uid()) OR 
  public.has_role('admin_ccm'::public.app_role, auth.uid())
))
WITH CHECK (bucket_id = 'site-assets' AND (
  public.has_role('admin'::public.app_role, auth.uid()) OR 
  public.has_role('admin_ccm'::public.app_role, auth.uid())
));
