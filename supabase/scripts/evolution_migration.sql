-- SQL MIGRATION: Mergulho Connect System Evolution

-- 1. ADICIONAR ROLE 'visitante' AO ENUM app_role
-- Nota: Postgres não permite alterar enum dentro de transação se ele já estiver em uso.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'visitante') THEN
        ALTER TYPE public.app_role ADD VALUE 'visitante';
    END IF;
END $$;

-- 1.1 GARANTIR FUNÇÃO has_role (Sempre necessária para as políticas)
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ATUALIZAR TRIGGER PARA NOVOS USUÁRIOS (Visitante por padrão)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Cria o perfil básico
  INSERT INTO public.profiles (user_id, full_name, whatsapp_phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp_phone', '')
  );

  -- Define a role inicial como 'visitante'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'visitante'::public.app_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. TABELA DE CHECK-IN KIDS
CREATE TABLE IF NOT EXISTS public.kids_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_name TEXT NOT NULL,
    guardian_id UUID REFERENCES auth.users(id),
    items_description TEXT,
    validation_token TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    call_requested BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABELA DE AVISOS E NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL, 
    group_id UUID REFERENCES public.groups(id), 
    target_user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SUPORTE A VÍDEO EM DEVOCIONAIS
-- Nota: Usando 'ALTER TABLE ... ADD COLUMN IF NOT EXISTS' para segurança
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devotionals' AND column_name='video_url') THEN
        ALTER TABLE public.devotionals ADD COLUMN video_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='devotionals' AND column_name='is_video_upload') THEN
        ALTER TABLE public.devotionals ADD COLUMN is_video_upload BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 6. POLÍTICAS RLS BÁSICAS
ALTER TABLE public.kids_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Permissões Kids Check-in
DROP POLICY IF EXISTS "ADM vê tudo checkins" ON public.kids_checkins;
CREATE POLICY "ADM vê tudo checkins" ON public.kids_checkins FOR ALL TO authenticated USING (public.has_role('admin'::public.app_role, auth.uid()));

DROP POLICY IF EXISTS "Pais veem seus checkins" ON public.kids_checkins;
CREATE POLICY "Pais veem seus checkins" ON public.kids_checkins FOR SELECT TO authenticated USING (auth.uid() = guardian_id);

-- Permissões Avisos
DROP POLICY IF EXISTS "Todos veem avisos gerais" ON public.announcements;
CREATE POLICY "Todos veem avisos gerais" ON public.announcements FOR SELECT TO authenticated USING (type = 'general');

DROP POLICY IF EXISTS "Usuários veem seus avisos individuais" ON public.announcements;
CREATE POLICY "Usuários veem seus avisos individuais" ON public.announcements FOR SELECT TO authenticated USING (target_user_id = auth.uid());

DROP POLICY IF EXISTS "ADM cria avisos" ON public.announcements;
CREATE POLICY "ADM cria avisos" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role('admin'::public.app_role, auth.uid()));
