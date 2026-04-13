-- ============================================
-- Script: Criar usuário ADM TOTAL
-- Uso: Execute via SQL Editor do banco
-- IMPORTANTE: Altere o email e senha abaixo!
-- ============================================

DO $$
DECLARE
  admin_uid UUID;
  admin_email TEXT := 'admin@ccmergulho.com';     -- << ALTERE AQUI
  admin_password TEXT := 'SuaSenhaForte@2026';     -- << ALTERE AQUI
  admin_name TEXT := 'Administrador Master';       -- << ALTERE AQUI
  admin_phone TEXT := '';                          -- << WhatsApp (opcional)
BEGIN
  -- 1. Cria o usuário no auth.users
  admin_uid := public.admin_manage_user(
    email := admin_email,
    password := admin_password,
    raw_user_meta_data := jsonb_build_object(
      'full_name', admin_name,
      'whatsapp_phone', admin_phone
    )
  );

  RAISE NOTICE 'Usuário criado com ID: %', admin_uid;

  -- 2. Garante que o perfil existe
  INSERT INTO public.profiles (user_id, full_name, whatsapp_phone)
  VALUES (admin_uid, admin_name, admin_phone)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    whatsapp_phone = EXCLUDED.whatsapp_phone,
    updated_at = now();

  -- 3. Atribui role ADMIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Remove role de visitante (caso tenha sido criada pelo trigger)
  DELETE FROM public.user_roles
  WHERE user_id = admin_uid AND role = 'visitante'::public.app_role;

  RAISE NOTICE '✅ Admin Master criado com sucesso! Email: %', admin_email;
END;
$$;
