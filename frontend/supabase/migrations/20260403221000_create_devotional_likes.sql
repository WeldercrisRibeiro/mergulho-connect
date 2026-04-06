-- Criar tabela de curtidas nos devocionais
CREATE TABLE IF NOT EXISTS public.devotional_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  devotional_id UUID REFERENCES public.devotionals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(devotional_id, user_id)
);

ALTER TABLE public.devotional_likes ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver as curtidas
CREATE POLICY "Authenticated can view likes"
  ON public.devotional_likes FOR SELECT
  TO authenticated
  USING (true);

-- Usuário pode curtir (inserir)
CREATE POLICY "Users can like devotionals"
  ON public.devotional_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode descurtir (deletar própria curtida)
CREATE POLICY "Users can unlike devotionals"
  ON public.devotional_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
