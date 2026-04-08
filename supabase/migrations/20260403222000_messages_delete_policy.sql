-- Permitir que administradores apaguem mensagens (necessário para "Limpar Histórico")
CREATE POLICY "Admins can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Permitir que usuários apaguem suas próprias mensagens (opcional mas útil)
CREATE POLICY "Users can delete own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

NOTIFY pgrst, 'reload schema';
