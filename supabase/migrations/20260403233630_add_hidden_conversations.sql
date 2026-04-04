-- Add hidden_conversations table to allow users to hide chat history
CREATE TABLE public.hidden_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  hidden_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id),
  UNIQUE(user_id, group_id),
  CHECK (target_user_id IS NOT NULL OR group_id IS NOT NULL)
);

-- RLS Policies
ALTER TABLE public.hidden_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own hidden conversations" ON public.hidden_conversations
FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hidden settings for audit" ON public.hidden_conversations
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
