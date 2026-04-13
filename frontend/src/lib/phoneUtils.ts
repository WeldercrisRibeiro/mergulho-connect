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

  // Agora deve ter 10 (DDD + 8) ou 11 (DDD + 9 + 8) dígitos
  if (number.length === 11) {
    // DDD + 9 + 8 dígitos → remove o nono dígito
    const ddd = number.slice(0, 2);
    const rest = number.slice(3); // pula o "9"
    return `55${ddd}${rest}`;
  }

  if (number.length === 10) {
    // DDD + 8 dígitos → já no formato correto
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
