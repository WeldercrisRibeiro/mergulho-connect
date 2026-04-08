CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_manage_user(email text, password text DEFAULT NULL::text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb, target_user_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_uid UUID;
  effective_password TEXT;
BEGIN
  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users 
    SET 
      email = admin_manage_user.email,
      encrypted_password = CASE
        WHEN admin_manage_user.password IS NOT NULL AND btrim(admin_manage_user.password) <> ''
          THEN extensions.crypt(admin_manage_user.password, extensions.gen_salt('bf'))
        ELSE encrypted_password
      END,
      raw_user_meta_data = admin_manage_user.raw_user_meta_data,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = target_user_id;

    RETURN target_user_id;
  ELSE
    effective_password := COALESCE(NULLIF(btrim(admin_manage_user.password), ''), '123456');

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, 
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, confirmation_token, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 
      admin_manage_user.email, extensions.crypt(effective_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}', admin_manage_user.raw_user_meta_data,
      now(), now(), '', ''
    )
    RETURNING id INTO new_uid;

    RETURN new_uid;
  END IF;
END;
$function$;