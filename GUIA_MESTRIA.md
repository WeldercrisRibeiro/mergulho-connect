# 🌊 Mergulho Connect: Guia de Mestria do Projeto

Este documento contém todo o conhecimento necessário para dominar a arquitetura, as tecnologias e os fluxos de trabalho do Mergulho Connect.

---

## 🚀 1. Stack Tecnológica Core

O projeto é dividido em um monorepo com duas frentes principais:

### **Backend (API)**
- **Framework:** [NestJS](https://nestjs.com/) (Node.js) - Arquitetura modular e escalável.
- **ORM:** [Prisma](https://www.prisma.io/) - Interface tipada para o banco de dados.
- **Banco de Dados:** PostgreSQL (Rodando em Docker localmente ou Supabase em produção).
- **Integração WhatsApp:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) - Para envio de notificações e mensagens.
- **Real-time:** [Socket.io](https://socket.io/) - Para atualizações em tempo real (notificações, status).
- **Documentação:** Swagger UI (disponível em `/api` por padrão).

### **Frontend (Web App)**
- **Framework:** React + Vite (TypeScript).
- **Estilização:** Tailwind CSS + [Shadcn UI](https://ui.shadcn.com/) (Componentes premium e acessíveis).
- **Gerenciamento de Estado/Cache:** [TanStack Query (React Query)](https://tanstack.com/query/latest) - Sincronização eficiente com a API.
- **Roteamento:** React Router DOM.
- **Ícones:** Lucide React.

---

## 🏗️ 2. Arquitetura e Fluxos Críticos

### **Sistema de Mensageria (WhatsApp)**
- **Abordagem:** Fila baseada em banco de dados (PostgreSQL).
- **Funcionamento:** Um Cron Job processa as mensagens pendentes na tabela, respeitando um intervalo (*sleep*) de 1.5s a 2s entre disparos para evitar banimentos da Meta.
- **Persistência:** A sessão do WhatsApp é armazenada no banco de dados, garantindo que a conexão não caia ao reiniciar o servidor.

### **Gestão de Eventos e Check-in**
- **Fluxo:** Eventos podem ser criados como "Conferência" ou "Culto/Comum".
- **Check-in:** Utiliza QR Codes gerados dinamicamente para validação na entrada.
- **RSVP:** Sistema "Eu Vou" para eventos não-conferência.

### **Pagamentos (Pix)**
- **Geração:** Integração para criar QR Codes Pix estáticos ou dinâmicos para contribuições e inscrições.

---

## 🛠️ 3. Fluxo de Desenvolvimento

### **Setup Inicial**
1. Instalar dependências: `npm install` em ambas as pastas (`backend` e `frontend`).
2. Subir infraestrutura: `docker-compose up -d`.
3. Sincronizar banco: `npx prisma migrate dev` (dentro de `backend`).
4. Iniciar: `npm run start:dev` (backend) e `npm run dev` (frontend).

### **Scripts Úteis (Backend)**
- `npm run create-admin`: Cria um usuário administrador inicial.
- `npm run change-password`: Altera a senha de um usuário via CLI.
- `npm run prisma:studio`: Abre uma interface visual para editar o banco de dados.

---

## 📁 4. Estrutura de Pastas Importante

- `/backend/src`: Lógica de negócio, controladores e serviços.
- `/backend/prisma`: Schema do banco de dados.
- `/frontend/src/components`: UI components (Shadcn + Custom).
- `/frontend/src/pages`: Telas da aplicação.
- `/docs`: Documentação detalhada de arquitetura (ex: `MESSAGING_ARCHITECTURE.md`).

---

## 🎯 5. Próximos Passos para Maestria
1. **Entender o Schema:** Estude o arquivo `backend/prisma/schema.prisma`. Ele é o coração dos dados.
2. **Dominar os Hooks:** Veja como os dados são consumidos no frontend em `frontend/src/hooks`.
3. **Explorar a Mensageria:** Leia `docs/MESSAGING_ARCHITECTURE.md` para entender como o sistema evita bloqueios de WhatsApp.
4. **Segurança:** Estude a implementação do `AuthContext` no frontend e os `Guards` de JWT no backend.

---
*Este guia é o ponto de partida para qualquer evolução no Mergulho Connect.*
