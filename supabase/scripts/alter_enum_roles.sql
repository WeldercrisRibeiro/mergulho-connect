-- Execute este script no SQL Editor do Supabase para atualizar as permissões existentes no banco:

-- 1. Renomear os valores no ENUM já existente
ALTER TYPE public.app_role RENAME VALUE 'member' TO 'membro';
ALTER TYPE public.app_role RENAME VALUE 'moderator' TO 'moderador';

-- Atenção: Esse comando acima já altera automaticamente todas as linhas
-- da tabela user_roles que utilizavam "member" para "membro".
