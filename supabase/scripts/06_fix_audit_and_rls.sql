-- Fix ALL remaining RLS problems

-- 1. Permite deletar Audit Logs (Limpar Tudo funcionará para admins normais)
DROP POLICY IF EXISTS "Admin CCM can delete audit logs" ON public.audit_logs;
CREATE POLICY "Admins can delete audit logs" ON public.audit_logs
FOR DELETE USING (
  public.has_role('admin'::public.app_role, auth.uid()) OR 
  public.has_role('admin_ccm'::public.app_role, auth.uid())
);

-- 2. Abre totalmente a visualização de Escalas para qualquer pessoa autenticada
DROP POLICY IF EXISTS "Public can view volunteer schedules" ON public.volunteer_schedules;
CREATE POLICY "Public can view volunteer schedules" ON public.volunteer_schedules
FOR SELECT USING (true);

-- 3. Abre totalmente a inserção de Escalas 
DROP POLICY IF EXISTS "Public can insert volunteer schedules" ON public.volunteer_schedules;
CREATE POLICY "Public can insert volunteer schedules" ON public.volunteer_schedules
FOR INSERT WITH CHECK (true);

-- 4. Abre Kids Checkin
DROP POLICY IF EXISTS "Public can view kids checkins" ON public.kids_checkins;
CREATE POLICY "Public can view kids checkins" ON public.kids_checkins
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert kids checkins" ON public.kids_checkins;
CREATE POLICY "Public can insert kids checkins" ON public.kids_checkins
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Pais veem seus checkins" ON public.kids_checkins;
DROP POLICY IF EXISTS "ADM vê tudo checkins" ON public.kids_checkins;
