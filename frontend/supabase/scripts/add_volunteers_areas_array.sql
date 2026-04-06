-- Execute este script no SQL Editor do Supabase para permitir múltiplas áreas de interesse:

-- 1. Adicionar a coluna de array para armazenar múltiplas áreas
ALTER TABLE public.volunteers ADD COLUMN IF NOT EXISTS interest_areas TEXT[] DEFAULT '{}';

-- 2. (Opcional) Migrar dados da coluna antiga 'interest_area' para a nova 'interest_areas'
UPDATE public.volunteers 
SET interest_areas = ARRAY[interest_area] 
WHERE interest_area IS NOT NULL AND (interest_areas IS NULL OR array_length(interest_areas, 1) IS NULL);

-- 3. Comentário: Manteremos a coluna interest_area original por compatibilidade
-- tempoerária, mas a nova lógica utilizará interest_areas.
