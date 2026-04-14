# 🔐 Segurança da Plataforma – Mergulho Connect

**Versão:** 1.0  
**Data:** 2026-04-14  
**Autor:** Welder Cris Ribeiro  
**Status:** ✅ Implementado

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Camadas de Proteção Implementadas](#camadas-de-proteção)
3. [Arquivos Modificados](#arquivos-modificados)
4. [O que NÃO pode ser ocultado](#o-que-não-pode-ser-ocultado)
5. [Headers HTTP Configurados](#headers-http-configurados)
6. [Como testar a segurança](#como-testar)
7. [Manutenção e boas práticas](#manutenção)

---

## Visão Geral

Esta documentação descreve as medidas de segurança implementadas para proteger dados sensíveis dos usuários da plataforma Mergulho Connect. O objetivo é garantir que:

- Nenhum dado sensível (senha, email, token) apareça no Console do DevTools
- O código-fonte da aplicação não seja acessível via browser
- O app esteja protegido contra ataques comuns (XSS, clickjacking, MIME sniffing)
- As comunicações sigam boas práticas de HTTPS

---

## Camadas de Proteção

### 🔴 Camada 1 – Remoção de Logs Sensíveis (Crítico)

**Problema:** O arquivo `Auth.tsx` continha `console.error("Login error details:", error)` que expunha detalhes completos de erros de autenticação no Console do DevTools, incluindo informações sobre a estrutura do sistema de login.

**Solução:** Removido o log. Todos os `console.*` foram substituídos por `devLog/devWarn/devError` do módulo centralizado `src/lib/security.ts`.

---

### 🟠 Camada 2 – Supressão de Console em Produção (Importante)

**Dois mecanismos redundantes:**

**a) `esbuild.drop` no Vite** (compile-time):
```ts
// vite.config.ts
esbuild: isProd ? { drop: ["console", "debugger"] } : {}
```
Remove fisicamente todos os `console.*` do bundle compilado. O código nem existe no JavaScript final.

**b) Override de `window.console` no `main.tsx`** (runtime):
```ts
if (import.meta.env.PROD) {
  const noop = () => {};
  window.console = { ...console, log: noop, warn: noop, error: noop, ... };
}
```
Camada extra de defesa caso algum trecho escape a minificação (ex: bibliotecas de terceiros).

---

### 🟡 Camada 3 – Source Maps Desabilitados (Importante)

```ts
// vite.config.ts
build: {
  sourcemap: false, // Sem .map files no dist/
  minify: "esbuild",
}
```

**O que resolve:** Sem source maps, o bundle minificado é ilegível para quem inspecionar o código no DevTools → Sources. O código real fica protegido contra engenharia reversa básica.

---

### 🟢 Camada 4 – Security Headers HTTP via Vercel

Configurados em `vercel.json` para todas as rotas (`/(.*)`):

| Header | Valor | Protege contra |
|--------|-------|----------------|
| `X-Frame-Options` | `DENY` | Clickjacking (iframes maliciosos) |
| `X-Content-Type-Options` | `nosniff` | MIME type confusion attacks |
| `X-XSS-Protection` | `1; mode=block` | XSS em browsers legados |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Vazamento de URL em requests externos |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Força HTTPS por 2 anos |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Acesso a APIs sensíveis do browser |
| `Content-Security-Policy` | (ver abaixo) | XSS, injeção de scripts externos |

---

### 🟢 Camada 5 – Content Security Policy (CSP)

Configurada em dois lugares para máxima cobertura:

1. **HTTP Header** via `vercel.json` (efetivo em produção)
2. **Meta tag** no `index.html` (fallback para desenvolvimento e ambientes sem headers)

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assets.mixkit.co;
media-src 'self' blob: https://assets.mixkit.co;
worker-src 'self' blob:;
frame-ancestors 'none';
```

**Notas:**
- `unsafe-inline` e `unsafe-eval` são necessários para o React/Vite funcionar
- `frame-ancestors 'none'` é o equivalente CSP do `X-Frame-Options: DENY`

---

### 🟢 Camada 6 – Utilitário Centralizado `security.ts`

Localização: `frontend/src/lib/security.ts`

#### Funções disponíveis:

```ts
// Logging seguro (só ativo em desenvolvimento)
devLog("log", "mensagem", dados)
devInfo("mensagem")
devWarn("aviso")
devError("erro", objetoDeErro)

// Sanitização de objetos antes de qualquer log
sanitizeForLog(objeto) 
// Remove automaticamente: password, email, token, phone, cpf, etc.

// Hook de detecção de DevTools (componentes de formulário)
useDevToolsGuard()
// Dispara evento "devtools-opened" quando detecta painel aberto em produção
```

#### Como usar `useDevToolsGuard` em formulários sensíveis:

```tsx
import { useDevToolsGuard } from "@/lib/security";

const MeuFormulario = () => {
  const [senha, setSenha] = useState("");
  
  useDevToolsGuard(); // Ativa a detecção
  
  useEffect(() => {
    const limpar = () => setSenha(""); // Limpa o campo se DevTools abrir
    window.addEventListener("devtools-opened", limpar);
    return () => window.removeEventListener("devtools-opened", limpar);
  }, []);
  
  // ...
};
```

---

### 🟢 Camada 7 – Autocomplete Correto em Inputs de Senha

O campo de senha no formulário de login agora tem `autoComplete="current-password"`, que:
- Instrui o browser a tratar o campo como senha atual
- Ativa o gerenciador de senhas nativo do browser
- Facilita o uso de password managers (LastPass, 1Password, etc.)

---

## Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `frontend/vite.config.ts` | ✏️ Build seguro: `sourcemap: false`, `esbuild.drop` |
| `frontend/index.html` | ✏️ Adicionada CSP via `<meta>` |
| `vercel.json` | ✏️ Adicionados 7 security headers HTTP |
| `frontend/src/main.tsx` | ✏️ Supressão do console em produção + SW limpo |
| `frontend/src/lib/security.ts` | 🆕 Módulo centralizado de segurança |
| `frontend/src/contexts/AuthContext.tsx` | ✏️ Todos os `console.*` → `devLog/devError/devWarn` |
| `frontend/src/pages/Auth.tsx` | ✏️ Removido `console.error` sensível + `autocomplete` |

---

## O que NÃO pode ser ocultado

> ⚠️ **Entendimento importante para o time técnico:**

### Por que a senha aparece no DevTools → Network?

O DevTools do browser mostra o que **o seu próprio browser** enviou ao servidor. Isso é **tecnicamente inevitável** — é o browser inspecionando a si mesmo.

**O que acontece na transmissão:**
1. Usuário digita a senha → fica em memória do browser
2. Supabase SDK formata um JSON com `{ email, password }`
3. O browser envia via **HTTPS** — os dados são **criptografados em trânsito**
4. DevTools exibe os dados **já descriptografados** para facilitar o debug

**Não existe forma legítima de ocultar o payload do Network tab** do próprio usuário. Tentativas de ofuscação (Base64, XOR) são facilmente revertidas e  criam uma falsa sensação de segurança.

### A proteção REAL do payload vem de:
1. ✅ **HTTPS** — dados criptografados em trânsito (já implementado pelo Supabase)
2. ✅ **Supabase RLS** — Row Level Security protege os dados no banco
3. ✅ **JWT com expiração** — tokens de sessão expiram automaticamente
4. ✅ **Auto-logout por inatividade** — 60 minutos (já implementado no AuthContext)

---

## Como Testar

### 1. Verificar ausência de source maps no build:
```bash
cd frontend
npm run build
ls dist/assets/*.js.map  # Não deve existir nenhum arquivo .map
```

### 2. Verificar console zerado em produção:
```bash
npm run build && npm run preview
```
Abrir DevTools → Console → fazer qualquer ação → nenhum log deve aparecer.

### 3. Verificar headers HTTP (após deploy no Vercel):
```bash
curl -I https://app.ccmergulho.com
# Deve mostrar: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, etc.
```

### 4. Teste online de headers:
- https://securityheaders.com → URL do app
- https://observatory.mozilla.org → URL do app

---

## Manutenção

### Boas práticas para o time:

1. **NUNCA use `console.log/error/warn` diretamente** — use sempre `devLog/devError/devWarn` de `@/lib/security`
2. **NUNCA logue objetos completos** com dados de usuário — use `sanitizeForLog(obj)` primeiro
3. **NUNCA exponha tokens ou senhas** em mensagens de erro visíveis ao usuário
4. Se precisar de logging persistente, use o sistema de Audit Logs já implementado (`auditLogger.ts`)

### Campos sensíveis reconhecidos pelo `sanitizeForLog`:

```
password, senha, token, access_token, refresh_token,
email, phone, whatsapp_phone, cpf, credit_card, secret, apiKey, api_key
```

Para adicionar novos campos à lista de sanitização, edite o `Set SENSITIVE_FIELDS` em `src/lib/security.ts`.
