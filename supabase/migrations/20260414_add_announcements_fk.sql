
-- Adiciona Chave Estrangeira para permitir select relacional com profiles
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;
