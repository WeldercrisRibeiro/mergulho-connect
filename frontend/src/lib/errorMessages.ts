/**
 * Utilitário de tradução de mensagens de erro para português.
 * Centraliza todos os textos de erro do sistema.
 */

const ERROR_MAP: Record<string, string> = {
  // Auth errors (Supabase)
  "Invalid login credentials": "Usuário ou senha incorretos.",
  "Email not confirmed": "E-mail não confirmado. Verifique sua caixa de entrada.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Password should be at least 6 characters": "A senha deve ter pelo menos 6 caracteres.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "User not found": "Usuário não encontrado.",
  "New password should be different from the old password": "A nova senha deve ser diferente da senha atual.",
  "Token has expired or is invalid": "O link expirou ou é inválido. Solicite um novo.",
  "Unable to validate email address: invalid format": "Formato de e-mail inválido.",
  "signup is disabled": "O cadastro está desabilitado no momento.",
  "only_mfa_backup_codes_enabled": "Autenticação multifator necessária.",

  // DB / RPC errors
  "duplicate key value violates unique constraint": "Já existe um registro com esses dados.",
  "violates foreign key constraint": "Não é possível realizar esta ação: registro vinculado a outros dados.",
  "null value in column": "Campo obrigatório não preenchido.",
  "value too long for type": "Valor muito longo para o campo.",
  "permission denied": "Permissão negada. Você não tem acesso a esta ação.",
  "insufficient_privilege": "Permissão insuficiente para realizar esta ação.",
  "JWT expired": "Sessão expirada. Faça login novamente.",
  "invalid token": "Sessão inválida. Faça login novamente.",

  // Network errors
  "Failed to fetch": "Falha na conexão com o servidor. Verifique sua internet.",
  "NetworkError": "Erro de rede. Verifique sua conexão.",
  "Load failed": "Falha ao carregar. Verifique sua internet.",

  // Phone
  "Número inválido": "Número de telefone inválido. Use o formato: (DDD) 9XXXX-XXXX.",

  // Storage
  "The object exceeded the maximum allowed size": "Arquivo muito grande. O tamanho máximo permitido é 2MB.",
  "Bucket not found": "Armazenamento não encontrado. Contate o administrador.",
  "new row violates row-level security policy": "Ação não permitida pelas regras de segurança.",
};

/**
 * Traduz uma mensagem de erro para português.
 * Procura por correspondências parciais na mensagem original.
 * Se não encontrar tradução, retorna a mensagem original.
 */
export function translateError(message: string): string {
  if (!message) return "Ocorreu um erro inesperado.";

  // Procura correspondência exata primeiro
  if (ERROR_MAP[message]) return ERROR_MAP[message];

  // Procura correspondência parcial (case-insensitive)
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Retorna a mensagem original se não houver tradução
  return message;
}

/**
 * Extrai e traduz a mensagem de erro de um objeto de erro genérico.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return "Ocorreu um erro inesperado.";
  if (typeof err === "string") return translateError(err);
  if (err instanceof Error) return translateError(err.message);
  if (typeof err === "object" && "message" in err) {
    return translateError((err as any).message || "Ocorreu um erro inesperado.");
  }
  return "Ocorreu um erro inesperado.";
}
