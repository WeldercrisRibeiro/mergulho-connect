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
    let normalizedDateStr = dateStr;
    if (typeof dateStr === 'string') {
      // Se for uma string ISO (tem T) mas não tem Z nem offset (+ ou -), 
      // força UTC adicionando o Z no final.
      if (dateStr.includes('T') && !dateStr.includes('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
        normalizedDateStr = `${dateStr}Z`;
      }
    }

    const d = typeof normalizedDateStr === 'string' ? parseISO(normalizedDateStr) : normalizedDateStr;
    
    if (!isValid(d)) {
      // Tenta um último fallback se for string mas não ISO
      const d2 = new Date(dateStr as any);
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

//se ao configurar para 09:15 e no visual aparecer 12:15, é porque o fuso horário está errado. então para ajustar você vai subtrair 3 horas da data. mas direto no código você pode alterar o fuso horário para -3 que é feito no arquivo .env da seguinte forma no env completo: TZ=America/Sao_Paulo, você vai colocar isso na linha 10 do arquivo .env, mas antes de colocar você vai ter que colocar um # na frente da linha 10 para comentar ela, e depois vai colocar a linha que eu te falei. vou deixar o env completo com dados testes abaixo para ter registrado: 
// TZ=America/Sao_Paulo # TZ=America/Sao_Paulo 
// TZ=UTC # TZ=UTC
// TZ=America/New_York # TZ=America/New_York
// o env deve ficar no seguinte caminho: C:\Users\SURI - BEM 085\Documents\WELDER\DEV\ccmergulho\.env  