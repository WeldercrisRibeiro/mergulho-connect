-- Execute este script no SQL Editor do Supabase para corrigir o erro de criação de novos usuários:
-- O erro ocorre porque o trigger de criação automática tentava usar o nome em inglês "member"
-- enquanto o banco agora utiliza apenas "membro" (Português).

-- 1. Atualizar a função handle_new_user para usar o termo correto 'membro'
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

  -- Define a role inicial como 'membro' (Enum app_role)
  -- Nota: Se o valor for 'member' (inglês), gerará o erro "invalid input value"
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'membro');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Garantir que o trigger está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. (Opcional) Corrigir usuários que possam ter sido criados sem role por falhas anteriores
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'membro'::public.app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;
