-- =============================================================
-- SCRIPT DE CORREÇÃO: Perfil de Usuário Não Salva
-- Mergulho Connect — 2026-04-13
-- Executar no Supabase Dashboard > SQL Editor
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PARTE 1: CORRIGIR RLS — Admins devem poder atualizar qualquer perfil
-- ─────────────────────────────────────────────────────────────

-- Remover a política que usa 'manager' (incorreta — nunca funciona)
DROP POLICY IF EXISTS "Profiles_Admin_Full_Access" ON public.profiles;

-- Remover política limitada a apenas o próprio usuário (será substituída)
-- ATENÇÃO: mantemos a política de INSERT e SELECT intactas
-- Recriamos apenas a de UPDATE para aceitar admins também
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Criar política correta: usuário pode atualizar só o próprio, admin pode atualizar qualquer um
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role::text IN ('admin', 'admin_ccm', 'pastor')
    )
  );

-- Verificar resultado (deve listar a nova política)
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- ─────────────────────────────────────────────────────────────
-- PARTE 2: CORRIGIR função admin_manage_user
-- Bug: quando password = null, a função usava '123456' como senha padrão,
--      trocando a senha de todos os membros editados sem aviso.
-- Correção: só altera senha quando password é explicitamente fornecido e não é vazio.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_manage_user(
  email TEXT,
  password TEXT DEFAULT NULL,
  raw_user_meta_data JSONB DEFAULT '{}'::JSONB,
  target_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_uid UUID;
  password_hash TEXT;
BEGIN
  IF target_user_id IS NOT NULL THEN
    -- MODO UPDATE: atualiza o usuário existente
    -- Só recalcula o hash de senha se password foi fornecido e não é vazio/nulo
    UPDATE auth.users SET
      email = admin_manage_user.email,
      encrypted_password = CASE
        WHEN admin_manage_user.password IS NOT NULL
         AND btrim(admin_manage_user.password) <> ''
        THEN extensions.crypt(
               btrim(admin_manage_user.password),
               extensions.gen_salt('bf', 10)
             )
        ELSE encrypted_password  -- MANTÉM a senha atual intacta
      END,
      raw_user_meta_data = admin_manage_user.raw_user_meta_data,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = target_user_id;
    RETURN target_user_id;
  ELSE
    -- MODO CREATE: cria novo usuário com senha padrão 123456 se não informada
    password_hash := extensions.crypt(
      COALESCE(NULLIF(btrim(password), ''), '123456'),
      extensions.gen_salt('bf', 10)
    );
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at,
      confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      admin_manage_user.email, password_hash,
      now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, admin_manage_user.raw_user_meta_data,
      false, now(), now(), '', '', '', ''
    )
    RETURNING id INTO new_uid;
    RETURN new_uid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, auth;

-- ─────────────────────────────────────────────────────────────
-- PARTE 3: Expor created_at nos profiles (caso não exista no SELECT)
-- Garantir que a coluna existe com valor correto
-- ─────────────────────────────────────────────────────────────

-- (A coluna já existe na tabela — apenas garantimos que não há bloqueio de SELECT)
-- Nenhuma ação necessária aqui; a correção é no frontend (AuthContext.tsx)

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ─────────────────────────────────────────────────────────────

-- Execute estas queries para confirmar:
-- 1. Políticas ativas em profiles:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles' ORDER BY cmd;

-- 2. Teste de atualização manual (substituir os UUIDs reais):
-- UPDATE public.profiles SET full_name = 'Teste Admin Update' WHERE user_id = '<UUID_DO_MEMBRO>';
-- SELECT full_name FROM public.profiles WHERE user_id = '<UUID_DO_MEMBRO>';
