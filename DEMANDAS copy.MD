# 📋 DEMANDAS — Mergulho Connect

> Documento de rastreamento de demandas técnicas e melhorias do projeto.
> Atualizado em: 2026-05-02 | Responsável: Dev Júnior

---

## 🔴 CRÍTICO — P0 (Resolver antes de qualquer deploy)

---

### [P0-1] ✅ ~~Dump com dados sensíveis versionado no Git~~

**Arquivo:** `database/export_202604271412.sql`
**Problema:** O dump continha INSERTs reais de usuários, perfis, telefones, e-mails e hashes de senha.

**Resolvido em:** 2026-05-02
- `git rm --cached database/export_202604271412.sql` — removido do tracking
- `.gitignore` atualizado com regras `database/*.sql`, `database/*.dump`, `database/*.backup`
- Arquivo deletado do disco

> ⚠️ **Ação manual ainda necessária:**
> 1. Execute o `git push` com o commit que Remove o dump
> 2. Se o dump já foi enviado ao remoto antes, execute **expurgo do histórico**:
>    ```bash
>    git filter-branch --force --index-filter \
>      "git rm --cached --ignore-unmatch database/export_202604271412.sql" \
>      --prune-empty --tag-name-filter cat -- --all
>    git push origin --force --all
>    ```
> 3. **Rotacione as senhas** dos usuários presentes no dump (execute reset-password via admin)

**Status:** [x] Código resolvido | ⚠️ Ação manual de rotação de senhas pendente

---

## 🟠 ALTO — P1 (Resolver antes de ir para produção)

---

### [P1-1] ✅ ~~Chat confia em IDs enviados pelo cliente (IDOR)~~

**Arquivo:** `backend/src/modules/messages/messages.controller.ts`
**Resolvido em:** 2026-05-02

Cada endpoint agora valida `req.user.id` contra os parâmetros da rota:
- `POST /messages` — `dto.senderId` deve ser igual a `req.user.id`
- `GET sender/:id`, `GET recipient/:id`, `GET user/:id` — apenas o próprio usuário ou admin
- `GET conversation/:u1/:u2` — apenas participantes ou admin
- `DELETE group/`, `DELETE :id` — apenas `admin` / `admin_ccm` (com `@Roles`)
- `DELETE direct/:u1/:u2` — participante ou admin

**Status:** [x] Concluído

---

### [P1-2] ✅ ~~Disparos WhatsApp sem controle de permissão por função~~

**Arquivo:** `backend/src/modules/wz-dispatches/wz-dispatches.controller.ts`
**Resolvido em:** 2026-05-02

Guards aplicados:
- `POST`, `PATCH`, `POST :id/retry` → `@Roles('admin', 'admin_ccm', 'lider')`
- `DELETE :id` → `@Roles('admin', 'admin_ccm')` (líderes não deletam)
- `GET` endpoints → acessíveis a qualquer usuário autenticado (para visualização)

**Status:** [x] Concluído

---

### [P1-3] ✅ ~~Upload sem limite de tamanho e sem filtro de MIME~~

**Arquivos resolvidos:**
- `backend/src/modules/upload/upload.controller.ts` — limite 10 MB, allowlist MIME: JPEG, PNG, WebP, GIF, PDF
- `backend/src/modules/wz-dispatches/wz-dispatches.controller.ts` — limite 16 MB (limite WhatsApp), allowlist de mídia

Erros agora retornam `400 Bad Request` com mensagem genérica (sem vazar detalhes internos).

**Status:** [x] Concluído

---

### [P1-4] ✅ ~~XSS persistente via `dangerouslySetInnerHTML`~~

**Arquivo:** `frontend/src/pages/AdminNotices.tsx`
**Resolvido em:** 2026-05-02

- Instalado `dompurify` + `@types/dompurify`
- `renderWhatsAppText` agora sanitiza o HTML antes de injetar:
  ```tsx
  DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['strong', 'em', 'del', 'code', 'br'],
    ALLOWED_ATTR: ['class'],
  })
  ```

**Status:** [x] Concluído

---

## 🟡 MÉDIO — P2 (Melhorias importantes de estabilidade)

---

### [P2-1] ✅ ~~docker-compose.yml com configurações erradas~~

**Arquivo:** `docker-compose.yml`
**Resolvido em:** 2026-05-02

Correções aplicadas:
- Porta: `5433:5434` → `5433:5432` (Postgres escuta 5432 internamente)
- Healthcheck: `pg_isready -d mergulho` → `pg_isready -d ccm_dev`

> ⚠️ **Ação manual necessária:** Se o container está rodando, reinicie:
> ```bash
> docker compose down && docker compose up -d
> ```

**Status:** [x] Arquivo corrigido | ⚠️ Reiniciar container manualmente

---

### [P2-2] ✅ ~~Autenticação sem rate limit, CAPTCHA ou lockout~~

**Arquivos resolvidos:**
- `backend/src/app.module.ts` — `ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }])` + `ThrottlerGuard` como primeiro `APP_GUARD`
- `backend/src/modules/auth/auth.controller.ts` — limites específicos por endpoint:
  - `POST /login` → 5 tentativas/min
  - `POST /register` → 3 tentativas/min
  - `PATCH /password/by-credentials` → 5 tentativas/min
  - `GET /me` → `@SkipThrottle()` (endpoint frequente e seguro)
- `backend/src/main.ts` — Swagger agora só roda fora de produção (`NODE_ENV !== 'production'`)

**Status:** [x] Concluído

---

### [P2-3] ✅ ~~Controllers sem `@Roles` em módulos sensíveis~~

**Problema:** Muitos controllers têm CRUD completo sem verificação de papel (`role`).

**Resolvido em:** 2026-05-02
Aplicado `@Roles` e validações `req.user.id` em todos os controllers:
- `eventos` — criacão/edição para admin/lider/pastor, deleção para admin.
- `grupos` — CRUD restrito a admin/admin_ccm.
- `devocionais` — publicação restrita a admin/lider/pastor.
- `tesouraria` — acesso restrito a admin/admin_ccm/gerente/pastor.
- `perfis` — usuários editam os próprios, admin pode tudo.
- `checkins` — membros veem só os seus, admin/lider gerenciam tudo.
- `announcements` — restrições aplicadas para líderes/admins.

**Status:** [x] Concluído

---

### [P2-4] 📦 Vulnerabilidades npm (audit)

**Problema:** `npm audit` reportou vulnerabilidades. Após instalação dos novos pacotes:
- **Backend:** 22 vulnerabilidades (15 moderadas, 4 altas, 3 críticas — principalmente Baileys/protobufjs)
- **Frontend:** 19 vulnerabilidades (3 baixas, 7 moderadas, 9 altas)

**Como verificar:**
```bash
# Backend
cd backend
npm audit --omit=dev

# Frontend
cd frontend
npm audit --omit=dev
```

**Ordem de atualização segura:**
1. `multer` → `npm install multer@latest`
2. `lodash` → substituir por funções nativas onde possível
3. `protobufjs` (via Baileys) → aguardar update do Baileys ou fixar versão

> ⚠️ **Não use `npm audit fix --force`** — pode quebrar a aplicação. Atualize pacote por pacote.

**Status:** [ ] Pendente — requer análise por pacote

---

## 🔵 BAIXO — P3 (Qualidade e manutenibilidade)

---

### [P3-1] 🏗️ Arquitetura: Muitos `dto as any` e CRUD direto

**Problema:** Há padrão `dto: any` em vários services, o que elimina a validação de tipo em tempo de compilação.

**Melhorias recomendadas:**
- Substituir `any` por tipos/interfaces específicos em todos os DTOs
- Criar `PolicyService` centralizado para autorização reutilizável
- Usar `class-validator` com decorators nos DTOs (`@IsUUID()`, `@IsEnum()`, etc.)

**Status:** [ ] Em backlog

---

### [P3-2] 📘 TypeScript frouxo (sem `strict`)

**Problema:** O frontend tem **366 usos de `any`** e ambos os projetos estão sem `strict: true`.

**Como ativar gradualmente:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```
> Ative uma opção por vez e corrija os erros antes de passar para a próxima.

**Status:** [ ] Em backlog

---

### [P3-3] 🧩 Telas grandes que precisam ser quebradas em componentes

| Tela | Ação |
|---|---|
| `Settings.tsx` | Quebrar em sub-componentes por aba |
| `Admin.tsx` | Extrair lógicas de gerenciamento em hooks |
| `Volunteers.tsx` | Separar formulário e lista |
| `Tesouraria.tsx` | Separar visão financeira e configurações |

**Status:** [ ] Em backlog

---

### [P3-4] ✅ ~~Bundle grande no frontend (~1.76 MB)~~

**Resolvido em:** 2026-05-02
Implementado code splitting via `React.lazy` no `App.tsx` para todas as páginas protegidas, garantindo carregamento on-demand.

**Status:** [x] Concluído

---

### [P3-5] 🧪 Testes insuficientes

**Onde começar:**
1. Testes de guard/roles no backend (NestJS Testing)
2. Testes de autenticação (login correto, inválido, token expirado)
3. Testes de validação de DTOs
4. Frontend: rotas protegidas com React Testing Library

**Status:** [ ] Em backlog

---

## ✅ Concluído

| Item | Descrição | Data |
|---|---|---|
| P0-1 | Dump sensível removido do Git + .gitignore atualizado | 2026-05-02 |
| P1-1 | IDOR no módulo de mensagens corrigido (req.user validado) | 2026-05-02 |
| P1-2 | @Roles aplicado em todos os endpoints de dispatches WhatsApp | 2026-05-02 |
| P1-3 | Upload com limite 10/16 MB e allowlist de MIME | 2026-05-02 |
| P1-4 | XSS sanitizado com DOMPurify no AdminNotices.tsx | 2026-05-02 |
| P2-1 | docker-compose.yml: porta 5432 e healthcheck ccm_dev corrigidos | 2026-05-02 |
| P2-2 | Rate limiting com ThrottlerGuard + Swagger restrito a dev | 2026-05-02 |
| P2-3 | Controllers protegidos com @Roles e regras de ownership | 2026-05-02 |
| P3-4 | Code splitting via React.lazy implementado no frontend | 2026-05-02 |

---

## ⚠️ Ações Manuais Pendentes

Estas ações **não podem ser automatizadas** — requerem intervenção do desenvolvedor:

| # | Ação | Urgência |
|---|---|---|
| 1 | Rotacionar senhas dos usuários presentes no dump `export_202604271412.sql` | 🔴 URGENTE |
| 2 | Se o dump foi enviado ao remoto: expurgar histórico git (`filter-branch`) | 🔴 URGENTE |
| 3 | Fazer commit e push de todas as alterações desta sessão | 🟠 Alta |
| 4 | Reiniciar o container Docker localmente | 🟡 Média |
| 5 | Rodar `npm audit --omit=dev` em backend e frontend e atualizar pacotes com cuidado | 🟡 Média |

---

## 📌 Ordem recomendada para próxima sprint

```text
1. [Manual] Rotacionar senhas + expurgar histórico git
2. [Manual] Commit e push das alterações desta sessão
3. [P2-4]  Atualizar dependências vulneráveis (pacote a pacote)
4. [P3-1]  Eliminar dto: any gradualmente
5. [P3-2]  Ativar strict TypeScript gradualmente
6. [P3-3]  Refatorar telas grandes
7. [P3-5]  Implementar testes de permissão
```