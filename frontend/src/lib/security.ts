/**
 * security.ts
 * Utilitário centralizado de segurança para a plataforma Mergulho Connect.
 *
 * Responsabilidades:
 *  - Logging seguro: substitui console.* diretos, eliminados no build de produção
 *    pelo esbuild.drop configurado em vite.config.ts.
 *  - sanitizeForLog: limpa objetos sensíveis antes de qualquer log.
 *  - useDevToolsGuard: hook que detecta abertura do DevTools em produção
 *    e limpa campos de formulário sensíveis via evento customizado.
 *
 * IMPORTANTE: Em produção, o Vite (esbuild.drop) já remove automaticamente
 * todos os console.* do bundle final. Este módulo serve como salvaguarda extra
 * em desenvolvimento e como documentação da intenção de segurança.
 */

const IS_DEV = import.meta.env.DEV;

// ─── Campos considerados sensíveis e que não devem aparecer em logs ──────────
const SENSITIVE_FIELDS = new Set([
  "password",
  "senha",
  "token",
  "access_token",
  "refresh_token",
  "email",
  "phone",
  "whatsapp_phone",
  "cpf",
  "credit_card",
  "secret",
  "apiKey",
  "api_key",
]);

// ─── Tipos de log ─────────────────────────────────────────────────────────────
type LogLevel = "log" | "warn" | "error" | "info" | "debug";

/**
 * devLog – wrapper seguro de console.
 * Só executa em ambiente de desenvolvimento.
 * Em produção, o esbuild.drop já elimina qualquer console.* do bundle.
 */
export const devLog = (level: LogLevel, ...args: unknown[]): void => {
  if (!IS_DEV) return;
  console[level](...args);
};

/** Atalhos para os casos mais comuns */
export const devInfo  = (...args: unknown[]) => devLog("log",   ...args);
export const devWarn  = (...args: unknown[]) => devLog("warn",  ...args);
export const devError = (...args: unknown[]) => devLog("error", ...args);

// ─── sanitizeForLog ──────────────────────────────────────────────────────────

/**
 * Remove campos sensíveis de um objeto antes de enviá-lo ao console.
 * Útil para logar objetos complexos sem vazar credenciais.
 *
 * @example
 * devError("Falha no login:", sanitizeForLog(error));
 */
export const sanitizeForLog = (obj: unknown, depth = 0): unknown => {
  if (depth > 5) return "[max-depth]";
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeForLog(item, depth + 1));

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = sanitizeForLog(value, depth + 1);
    }
  }
  return sanitized;
};

// ─── useDevToolsGuard ─────────────────────────────────────────────────────────

/**
 * useDevToolsGuard
 * Hook React que detecta quando o DevTools é aberto em uma sessão de produção
 * e dispara o evento customizado "devtools-opened".
 *
 * Componentes que exibem dados sensíveis podem ouvir esse evento e
 * limpar/mascarar seus campos quando necessário.
 *
 * Técnica: mede a diferença entre window.innerWidth e window.outerWidth/Height,
 * que aumenta quando o painel de DevTools está acoplado à janela.
 *
 * @returns void
 *
 * @example
 * // Em um componente de formulário sensível:
 * useEffect(() => {
 *   const handler = () => setPassword("");
 *   window.addEventListener("devtools-opened", handler);
 *   return () => window.removeEventListener("devtools-opened", handler);
 * }, []);
 */
import { useEffect } from "react";

export const useDevToolsGuard = (): void => {
  useEffect(() => {
    // Só ativa a proteção em produção
    if (IS_DEV) return;

    const THRESHOLD = 160; // px — diferença típica do painel do DevTools
    let devToolsOpen = false;

    const check = () => {
      const widthDiff  = window.outerWidth  - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen     = widthDiff > THRESHOLD || heightDiff > THRESHOLD;

      if (isOpen && !devToolsOpen) {
        devToolsOpen = true;
        window.dispatchEvent(new CustomEvent("devtools-opened"));
      } else if (!isOpen && devToolsOpen) {
        devToolsOpen = false;
      }
    };

    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);
};
