# Arquivos Recomendados para Sincronização (Tests -> Next)

Para deixar a branch `next` com todas as funcionalidades da `tests`, os seguintes arquivos devem ser priorizados para cópia ou merge:

## Backend (Lógica e Rotinas)
- `backend/src/modules/health/*` (Pasta completa)
- `backend/src/modules/whatsapp/prisma-auth.ts`
- `backend/src/modules/whatsapp/whatsapp.client.ts`
- `backend/src/modules/member-groups/member-groups.controller.ts`
- `backend/src/modules/member-groups/member-groups.service.ts`
- `backend/src/modules/auth/admin-users.controller.ts`
- `backend/src/modules/auth/dto/create-admin-user.dto.ts`
- `backend/src/modules/auth/dto/update-admin-user.dto.ts`

## Frontend (Interfaces e UX)
- `frontend/src/pages/Landing.tsx` (Nova Landing Page)
- `frontend/src/pages/Auth.tsx` (Novo Login)
- `frontend/src/pages/Members.tsx` (Gestão de Membros com Endereço)
- `frontend/src/pages/Profile.tsx` (Perfil atualizado)
- `frontend/src/components/WhatsAppWidget.tsx` (Novo Widget)
- `frontend/src/components/VersionIndicator.tsx` (Novo Componente)
- `frontend/src/pages/Privacy.tsx` e `frontend/src/pages/Terms.tsx` (Páginas Legais)
- `frontend/src/lib/phoneUtils.ts` (Melhorias na formatação de telefone)

## Configuração de Deploy
- `render.yaml` (Na raiz do projeto)
- `backend/docker-compose.yml` (Verificar se há ajustes de volume ou rede)
