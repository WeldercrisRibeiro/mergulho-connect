-- Script de Migração Universal de Domínio para @ccmergulho.com
-- Este script altera TODOS os usuários na tabela auth.users para o novo domínio corporativo.

UPDATE auth.users
SET 
  email = LOWER(SPLIT_PART(email, '@', 1) || '@ccmergulho.com'),
  raw_user_meta_data = raw_user_meta_data || 
    jsonb_strip_nulls(jsonb_build_object('username', SPLIT_PART(email, '@', 1)))
WHERE email NOT LIKE '%@ccmergulho.com';

-- Nota: Após executar este script, todos os usuários deverão logar usando 
-- o prefixo do email antigo + @ccmergulho.com.