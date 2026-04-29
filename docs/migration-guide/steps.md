# Guia de Migração: `tests` para `next`

Este guia detalha os passos necessários para trazer as melhorias, novas rotinas e atualizações de estrutura da branch `tests` para a branch `next`, mantendo a flexibilidade do banco de dados.

## 1. Atualização do Banco de Dados (Estrutura)

A branch `tests` introduziu modelos críticos e expandiu perfis. 

### Passo a Passo:
1. Copie o conteúdo de `backend/prisma/schema.prisma` da branch `tests`.
2. **Ajuste**: No `datasource db`, mantenha o `provider = "postgresql"`. Se estiver no Docker local, você pode ignorar o `directUrl` ou deixá-lo como opcional.
3. Execute a migration para aplicar as mudanças:
   ```bash
   npx prisma migrate dev --name update_schema_from_tests
   ```

### O que mudou no Schema:
- **Tabela `baileys_auth`**: Essencial para persistência do WhatsApp.
- **Tabela `profiles`**: Novos campos de endereço e nascimento.
- **Tabela `volunteer_schedules`**: Campo `status`.
- **Enum `AppRole`**: Inclusão de `lider`.

---

## 2. Implementação das Novas Rotinas (Backend)

### Persistência de WhatsApp
Esta é a maior mudança funcional. 
1. Certifique-se de que o arquivo `backend/src/modules/whatsapp/prisma-auth.ts` existe.
2. Atualize o `whatsapp.client.ts` para usar o `usePrismaAuthState`.

### Módulo Health Check
1. Copie a pasta `backend/src/modules/health`.
2. Registre o `HealthModule` no `app.module.ts`.

### Melhorias em Membros e Grupos
1. Sincronize os arquivos em `backend/src/modules/member-groups/` para habilitar as novas lógicas de permissão.

---

## 3. Atualização de Interfaces e Funcionalidades (Frontend)

### Landing Page e Autenticação
- A `Landing.tsx` foi totalmente reestruturada para um visual premium.
- O `Auth.tsx` agora possui layout dividido (Split Screen).

### Novos Componentes Reutilizáveis
- `WhatsAppWidget`: Widget flutuante de contato.
- `VersionIndicator`: Indicador de versão do sistema.

### Formulários de Membros
- Atualize os componentes de formulário para incluir os campos de Endereço e CEP, integrando com a API do ViaCEP (conforme implementado na branch `tests`).

---

## 4. Limpeza e Organização
1. A pasta `maintenance-portal` na raiz pode ser removida se todas as suas funcionalidades já estiverem integradas no `ccm-manager` ou no novo fluxo da `tests`.
2. Verifique o arquivo `render.yaml` na raiz para garantir que os scripts de deploy estão corretos para o novo esquema.
