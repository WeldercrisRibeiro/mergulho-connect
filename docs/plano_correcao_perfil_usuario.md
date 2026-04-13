# Plano de Correção: Perfil de Usuário Não Salva

**Data:** 2026-04-13  
**Status:** Implementado  
**Relatado por:** Usuários que alteraram nome/username mas os dados não persistiram

---

## Diagnóstico

Após análise completa do código (`AuthContext.tsx`, `Members.tsx`, `Profile.tsx`) e do schema de banco (`fullmigration-lovable.sql`), foram identificados **3 bugs**:

---

### 🔴 Bug #1 — RLS bloqueia admins de salvar perfis alheios (causa principal)

**Arquivo:** Supabase → tabela `public.profiles`

A única política de `UPDATE` na tabela `profiles` era:
```sql
USING (auth.uid() = user_id)
```
Isso significa que apenas o próprio usuário poderia editar seu perfil.

Quando um admin abre o painel Members e salva alterações, o Supabase **silenciosamente ignora o UPDATE (0 linhas afetadas)** sem lançar erro — por isso o toast de sucesso aparece, mas nada muda no banco.

A política `Profiles_Admin_Full_Access` que tentava resolver isso usava `'manager'` (inglês) enquanto o sistema usa `'admin'` em português — **nunca batia**.

**Correção:** Substituir a política de UPDATE para aceitar também usuários com role `admin`, `admin_ccm` ou `pastor`.

---

### 🔴 Bug #2 — `admin_manage_user` redefinia senha para `123456` ao editar membros

**Arquivo:** Supabase → função `public.admin_manage_user`

```sql
-- Código problemático:
effective_password := COALESCE(NULLIF(btrim(password), ''), '123456');
```

Ao chamar a função com `password = null` (apenas editando dados do perfil, sem intenção de resetar senha), o `COALESCE` retornava `'123456'` e **a senha de todos os membros editados era trocada sem aviso**.

**Correção:** Separar a lógica: no modo UPDATE, só recalcular hash se `password` for explicitamente fornecido e não vazio. Caso contrário, manter `encrypted_password` intacto.

---

### 🟡 Bug #3 — Campo `created_at` não exposto no AuthContext

**Arquivo:** `frontend/src/contexts/AuthContext.tsx`

A interface `AuthContextType` não incluía `created_at` no tipo do perfil, e o `fetchProfile` não selecionava o campo. A tela de Preferências exibia "Recentemente" para todos os membros.

**Correção:** Adicionar `created_at` ao tipo e ao SELECT do `fetchProfile`.

---

## Arquivos Alterados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `docs/Scripts/fix_profile_rls_and_admin_manage_user.sql` | SQL | Script para aplicar no Supabase Dashboard |
| `supabase/fullmigration-lovable.sql` | SQL | Migration atualizada com as correções |
| `frontend/src/contexts/AuthContext.tsx` | TypeScript | `created_at` adicionado ao perfil |
| `frontend/src/pages/Members.tsx` | TypeScript | Removido `password: null` da chamada RPC de update |
| `frontend/src/pages/Profile.tsx` | TypeScript | Melhoria no feedback pós-save |

---

## Como Aplicar no Banco

1. Abrir o Supabase Dashboard
2. Ir em **SQL Editor**
3. Colar e executar o conteúdo de `docs/Scripts/fix_profile_rls_and_admin_manage_user.sql`
4. Verificar com a query de confirmação ao final do script

---

## Impacto do Bug #2 nos Usuários Já Afetados

Todos os membros que foram editados por um admin pelo painel Members **tiveram sua senha trocada para `123456`** sem saber. Recomenda-se:
- Comunicar os membros para redefinir sua senha na tela de Perfil
- Ou o admin pode usar o botão "Resetar senha" no Members para confirmar que a senha padrão está ativa e o membro pode trocá-la
