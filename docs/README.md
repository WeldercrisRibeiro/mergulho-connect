# Mergulho Connect — Documentação do Projeto

> Plataforma de gestão para igrejas: comunicação, agenda, departamentos, voluntários, tesouraria e mais.

---

## 📁 Estrutura do Repositório

```
mergulho-connect/
├── backend/          # API NestJS
├── frontend/         # App React + Vite
├── docs/             # Esta documentação
└── vercel.json       # Deploy config (opcional)
```

---

## 🚀 Tecnologias

### Backend
| Tecnologia | Versão | Função |
|---|---|---|
| NestJS | 10 | Framework da API REST |
| Prisma | 6 | ORM — mapeamento banco/código |
| PostgreSQL | 16 | Banco de dados relacional |
| Docker | - | Execução local do PostgreSQL |
| JWT + Passport | - | Autenticação stateless |
| bcrypt | - | Hash de senhas |
| Baileys | 7 | Integração WhatsApp Web |
| Socket.io | 4 | Chat em tempo real (WebSockets) |
| Multer | - | Upload de arquivos |
| Swagger | 7 | Documentação da API |

### Frontend
| Tecnologia | Versão | Função |
|---|---|---|
| React | 18 | Biblioteca de UI |
| Vite | 5 | Build tool |
| TypeScript | 5 | Tipagem estática |
| shadcn/ui | - | Componentes de UI |
| TanStack Query | 5 | Gerenciamento de estado servidor |
| React Router | 6 | Roteamento |
| Axios | - | Requisições HTTP |

---

## 🧩 Módulos do Backend

| Módulo | Rota Base | Descrição |
|---|---|---|
| `auth` | `/api/auth` | Login, registro, JWT |
| `profiles` | `/api/profiles` | Perfis de usuários |
| `user-roles` | `/api/user-roles` | Permissões (admin, gerente, membro) |
| `events` | `/api/events` | Cultos e eventos |
| `event-checkins` | `/api/event-checkins` | Presença em eventos |
| `event-rsvps` | `/api/event-rsvps` | Confirmação de presença |
| `event-registrations` | `/api/event-registrations` | Inscrições em eventos |
| `kids-checkins` | `/api/kids-checkins` | Controle de crianças e volumes |
| `groups` | `/api/groups` | Departamentos/células |
| `member-groups` | `/api/member-groups` | Vínculo membro-departamento |
| `messages` | `/api/messages` | Chat interno (WebSocket) |
| `devotionals` | `/api/devotionals` | Devocionais publicados |
| `devotional-likes` | `/api/devotional-likes` | Curtidas em devocionais |
| `announcements` | `/api/announcements` | Comunicados da liderança |
| `treasury-entries` | `/api/treasury-entries` | Entradas/saídas financeiras |
| `volunteers` | `/api/volunteers` | Cadastro de voluntários |
| `volunteer-schedules` | `/api/volunteer-schedules` | Escalas de voluntários |
| `culto-reports` | `/api/culto-reports` | Relatórios de culto |
| `event-reports` | `/api/event-reports` | Relatórios de evento |
| `whatsapp` | `/api/whatsapp` | Gerenciamento da sessão Baileys |
| `wz-dispatches` | `/api/wz-dispatches` | Disparos em massa (WhatsApp) |
| `upload` | `/api/upload` | Upload de imagens/arquivos |
| `site-settings` | `/api/site-settings` | Configurações gerais do sistema |
| `landing-photos` | `/api/landing-photos` | Fotos da página pública |
| `landing-testimonials` | `/api/landing-testimonials` | Depoimentos da página pública |
| `contact-messages` | `/api/contact-messages` | Formulário de contato público |
| `group-routines` | `/api/group-routines` | Rotinas de departamentos |
| `user-push-subscriptions` | `/api/user-push-subscriptions` | Assinaturas de notificações push |

---

## 🖥️ Páginas do Frontend

| Rota | Componente | Acesso |
|---|---|---|
| `/` | `Index` | Público (redireciona) |
| `/landing` | `Landing` | Público |
| `/auth` | `Auth` | Público |
| `/home` | `HomePage` | Autenticado |
| `/agenda` | `Agenda` | Autenticado |
| `/devocionais` | `Devotionals` | Autenticado |
| `/membros` | `Members` | Admin/Gerente |
| `/chat` | `Chat` | Autenticado |
| `/perfil` | `Profile` | Autenticado |
| `/departamentos` | `Groups` | Autenticado |
| `/configuracoes` | `Settings` | Admin |
| `/voluntarios` | `Volunteers` | Autenticado |
| `/relatorios` | `Reports` | Admin/Gerente |
| `/checkin-kids` | `KidsCheckin` | Admin/Gerente |
| `/Disparos` | `AdminNotices` | Admin |
| `/whatsapp` | `AdminWhatsApp` | Admin |
| `/gestao-rotinas` | `GroupPermissions` | Admin/Gerente |
| `/tesouraria` | `Tesouraria` | Admin/Gerente |

---

## 🔐 Níveis de Acesso

| Role | Descrição |
|---|---|
| `admin_ccm` | Super admin — acesso total, gerencia outros admins |
| `admin` | Administrador da igreja |
| `gerente` | Líder de departamento |
| `pastor` | Pastor |
| `membro` | Membro comum |

---

## 📖 Documentação Adicional

- [Como Rodar o Projeto](./SETUP.md)
- [Arquitetura e Fluxos](./ARCHITECTURE.md)
- [Manutenção e Comandos](./MAINTENANCE.md)
