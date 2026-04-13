# Atualizações: Normalização de Telefones, Centralização de Erros e Controle de Auditoria

**Data:** 13 de Abril de 2026  
**Objetivo:** Padronizar entrada de dados no banco, facilitar a leitura de erros pelo usuário final e aprimorar as regras de controle de acesso de relatórios e rotinas.

---

## 1. Padronização de Telefones (WhatsApp)
Para garantir que o fluxo de disparos de mensagens automatizadas pelo backend funcione corretamente (sem falhas por conta de números mal formatados na tabela de perfis), as seguintes regras foram estabelecidas no código:

- **Lógica de Interface (Frontend):**
  - **Exibição visual:** Todos os telefones retornam à interface (formulários, listar cards, inputs) formatados no padrão de **11 dígitos com o 9** (`DDD` + `9` + `8 dígitos`). Ex: `11987654321`.
  - **Função utilitária:** `formatPhoneForDisplay` (em `/frontend/src/lib/phoneUtils.ts`).

- **Lógica de Banco de Dados:**
  - **Salvamento (Storage):** Ao enviar informações para o Supabase (via mutações no perfil ou na gerência por administradores), os telefones são formatados de volta para o padrão limpo de disparo: **12 dígitos com o prefixo 55 e sem o nono dígito**. Ex: `551187654321`.
  - **Função utilitária:** `normalizePhoneForDB` (em `/frontend/src/lib/phoneUtils.ts`).
  
- **Atualização Backend:** O `formatPhoneNumber` (em `/backend/src/scheduler/index.ts`) foi flexibilizado para compatibilidade com legados, aceitando o número já padronizado e limpo, ou lidando com as strings em suas antigas tipagens caso faltem prefixos.

---

## 2. Tradução e Centralização de Mensagens de Erro
Para suavizar o feedback recebido por ações não permitidas, problemas de conexão, ou limites do Supabase, construiu-se uma tradução automatizada:

- **Utilitário `errorMessages.ts`:**
  - Todas as popups de alerta (toasts) disparadas no sistema param de exibir erros crus vindos do banco de dados (ex: `duplicate key value violates unique constraint` ou `Invalid login credentials`).
  - O utilitário mapeia frases em inglês para retornos traduzidos: _"Este e-mail já está cadastrado"_ ou _"Usuário ou senha incorretos"_ respectivamente.
- **Implementação Global:** Um script verificou as páginas do painel (`Admin.tsx`, `Settings.tsx`, `Agenda.tsx`, `Profile.tsx`, etc) substituindo chamadas originais de `err.message` para referenciar o `getErrorMessage(err)`.

---

## 3. Flexibilização de Relatórios de Culto
- Na aba `Reports.tsx`, o menu dropdown focado em **Departamento / Grupo** não é mais uma barreira obrigatória para finalizar um relatório. 
- O botão salvar libera a execução do formulário informando a tag `Geral` internamente (salvando-o focado diretamente no templo da igreja ou uso geral).
- A indicação no frontend foi substituída do ícone de obrigatório (`*`) pela indicativa cinza `(opcional)`.

---

## 4. Auditoria Exclusiva para ADM CCM
O controle em cima dos Logins e CRUD foi elevado da flag mista geral de `admin` para acesso global exclusivo de `admin_ccm`.
- **`AuditLogs.tsx`:** Adicionado guardião no topo da rota. Se um admin não-CCM acessar a aba (`!isAdminCCM`), é redirecionado coercivamente para a `Home`.
- **`auditLogger.ts`:** Amplia as informações listadas nos resumos de dados. Captura o status da flag do autor do clique (agora retornando no formato JSON de exibição atributos como o `user_role` e o `local_time` de SP do evento, não mais amontoado).
- **Settings/Privilégios:** Separado visualmente das rotinas delegáveis pelas congregações (Membros, Células, Chat). Injetado o menu `Acesso Exclusivo — ADM CCM` em formato vermelho vibrante limitando gerentes ou admins locais de controlarem quem acessa Auditoria da plataforma.
