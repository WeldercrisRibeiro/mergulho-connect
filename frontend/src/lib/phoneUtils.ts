/**
 * Utilitário centralizado para normalização de números de telefone.
 *
 * Regra de negócio:
 *  - Exibição visual: DDD (2 dígitos) + 9 + 8 dígitos = 11 dígitos, ex: "11987654321"
 *  - Banco de dados:  55 + DDD (2) + 8 dígitos = 12 dígitos, ex: "551187654321"
 *    (o nono dígito é removido ao persistir, conforme exigência do sistema de disparos)
 *
 * Aceita qualquer um dos formatos abaixo como entrada:
 *   "11987654321"       → DDD + 9 + 8 (11 dígitos)
 *   "551187654321"      → 55 + DDD + 8 (12 dígitos — já normalizado)
 *   "5511987654321"     → 55 + DDD + 9 + 8 (13 dígitos)
 *   "(11) 98765-4321"   → com máscara
 */

/**
 * Normaliza um número de telefone para armazenamento no banco.
 * Resultado: "55" + DDD (2) + 8 dígitos = 12 dígitos.
 * Retorna null se o número for inválido ou vazio.
 */
export function normalizePhoneForDB(raw: string): string | null {
  if (!raw) return null;

  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) return null;

  let number = digits;

  // Remove o prefixo 55 se presente
  if (number.startsWith("55") && number.length >= 12) {
    number = number.slice(2);
  }

  // Se tem 11 dígitos (DDD + 9 + 8), o sistema de disparos exige remover o "9"
  // Resultado: 55 + DDD (2) + 8 dígitos = 12 dígitos
  if (number.length === 11) {
    const ddd = number.slice(0, 2);
    const rest = number.slice(3); // remove o "9"
    return `55${ddd}${rest}`;
  }

  // Se tem 10 dígitos (DDD + 8), apenas adiciona o 55
  if (number.length === 10) {
    return `55${number}`;
  }

  // Número com comprimento inválido — retorna null para evitar erros de disparo
  return null;
}

/**
 * Formata um número (de qualquer formato) para exibição visual:
 * DDD + 9 + 8 dígitos, sem o +55.
 * Ex: "551187654321" → "11987654321"
 *     "11987654321"  → "11987654321"
 * Retorna a string original se não for possível formatar.
 */
export function formatPhoneForDisplay(raw: string): string {
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");

  let number = digits;

  // Remove prefixo 55
  if (number.startsWith("55") && number.length >= 12) {
    number = number.slice(2);
  }

  // Se tem 10 dígitos (DDD + 8), adiciona o nono dígito "9"
  if (number.length === 10) {
    const ddd = number.slice(0, 2);
    const rest = number.slice(2);
    return `${ddd}9${rest}`;
  }

  // Se já tem 11 dígitos (DDD + 9 + 8), retorna como está
  if (number.length === 11) {
    return number;
  }

  // Fallback: retorna o original
  return raw;
}

/**
 * Aplica uma máscara visual ao telefone conforme o usuário digita.
 * Formato: (XX) XXXXX-XXXX
 */
export function maskPhone(value: string): string {
  if (!value) return "";
  
  let digits = value.replace(/\D/g, "");
  
  // Se o usuário colou um número com 55 no início, removemos para a máscara visual
  // mas apenas se o número resultante tiver um tamanho de celular brasileiro (10 ou 11 dígitos)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  
  // Limita a 11 dígitos (DDD + 9 + 8)
  digits = digits.slice(0, 11);
  
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
