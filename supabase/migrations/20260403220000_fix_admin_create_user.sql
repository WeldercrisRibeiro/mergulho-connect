-- Corrigir o sistema de criação de usuários pelo admin
-- O problema anterior: extensions.crypt() gerava hashes incompatíveis com o GoTrue

-- Habilitar extensão necessária no schema correto
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, authenticated, service_role;

-- Recriar a função admin_manage_user com compatibilidade total com GoTrue
CREATE OR REPLACE FUNCTION public.admin_manage_user(
  email text,
  password text DEFAULT NULL,
  raw_user_meta_data jsonb DEFAULT '{}',
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  new_uid UUID;
  effective_password TEXT;
  password_hash TEXT;
BEGIN
  effective_password := COALESCE(NULLIF(btrim(password), ''), '123456');
  
  -- Gera hash compatível com GoTrue (bcrypt)
  password_hash := extensions.crypt(effective_password, extensions.gen_salt('bf', 10));

  IF target_user_id IS NOT NULL THEN
    -- Atualizar usuário existente
    UPDATE auth.users 
    SET 
      email = admin_manage_user.email,
      encrypted_password = CASE
        WHEN admin_manage_user.password IS NOT NULL AND btrim(admin_manage_user.password) <> ''
          THEN password_hash
        ELSE encrypted_password
      END,
      raw_user_meta_data = admin_manage_user.raw_user_meta_data,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_sent_at = COALESCE(confirmation_sent_at, now()),
      updated_at = now()
    WHERE id = target_user_id;

    RETURN target_user_id;
  ELSE
    -- Criar novo usuário
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_manage_user.email,
      password_hash,
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      admin_manage_user.raw_user_meta_data,
      false,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_uid;

    RETURN new_uid;
  END IF;
END;
$$;

-- Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';
