import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata uma data de forma segura, evitando quebras por datas inválidas ou nulas.
 * @param dateStr A data a ser formatada (string ou Date)
 * @param formatStr O formato desejado (padrão dd/MM/yyyy)
 * @param fallback O que retornar caso a data seja inválida (padrão "--/--/----")
 */
export const safeFormat = (
  dateStr: string | Date | null | undefined, 
  formatStr: string = "dd/MM/yyyy", 
  fallback: string = "--/--/----"
): string => {
  if (!dateStr) return fallback;

  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    
    if (!isValid(d)) {
      // Tenta um último fallback se for string mas não ISO
      const d2 = new Date(dateStr);
      if (isValid(d2)) return format(d2, formatStr, { locale: ptBR });
      return fallback;
    }
    
    return format(d, formatStr, { locale: ptBR });
  } catch (err) {
    console.error("Erro ao formatar data:", dateStr, err);
    return fallback;
  }
};

/**
 * Retorna o nome do mês abreviado de forma segura
 */
export const safeFormatMonth = (dateStr: string | Date | null | undefined): string => {
  return safeFormat(dateStr, "MMM", "---").toUpperCase();
};

/**
 * Retorna o dia do mês de forma segura
 */
export const safeFormatDay = (dateStr: string | Date | null | undefined): string => {
  return safeFormat(dateStr, "dd", "--");
};

/**
 * Retorna a hora formatada de forma segura
 */
export const safeFormatTime = (dateStr: string | Date | null | undefined): string => {
  return safeFormat(dateStr, "HH:mm", "--:--");
};
