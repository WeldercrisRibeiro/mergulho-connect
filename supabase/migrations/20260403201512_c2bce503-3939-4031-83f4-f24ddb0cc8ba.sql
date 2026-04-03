CREATE OR REPLACE FUNCTION public.admin_manage_user(email text, password text, raw_user_meta_data jsonb, target_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  new_uid UUID;
BEGIN
  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET 
      email = admin_manage_user.email,
      encrypted_password = extensions.crypt(admin_manage_user.password, extensions.gen_salt('bf')),
      raw_user_meta_data = admin_manage_user.raw_user_meta_data,
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = target_user_id;
    RETURN target_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
      admin_manage_user.email, extensions.crypt(admin_manage_user.password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', admin_manage_user.raw_user_meta_data,
      now(), now(), '', ''
    )
    RETURNING id INTO new_uid;
    RETURN new_uid;
  END IF;
END;
$$;