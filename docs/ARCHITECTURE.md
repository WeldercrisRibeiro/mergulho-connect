# Arquitetura do Sistema — Mergulho Connect

---

## 🏗️ Visão Geral das Camadas

```
┌─────────────────────────────────────────────┐
│              USUÁRIO (Navegador)             │
└──────────────────────┬──────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────┐
│          FRONTEND — React + Vite             │
│  Port: 8080   |   src/pages/   src/lib/     │
└──────────────────────┬──────────────────────┘
                       │ Axios (REST) / Socket.io
┌──────────────────────▼──────────────────────┐
│          BACKEND — NestJS API                │
│  Port: 3001   |   src/modules/              │
│  Swagger em /api                            │
└──────────┬───────────────────┬──────────────┘
           │ Prisma ORM        │ Baileys
┌──────────▼──────────┐ ┌──────▼──────────────┐
│  PostgreSQL (Docker) │ │   WhatsApp Web       │
│  Port: 5432         │ │   (sessão local)     │
└─────────────────────┘ └─────────────────────┘
```

---

## 🔐 Fluxo de Autenticação JWT

```
1. Usuário envia: { email, password }
         │
2. Backend: AuthService.login()
   ├── Busca User no banco pelo email
   ├── bcrypt.compare(password, user.password)
   └── Se válido: JwtService.sign({ sub: userId, email })
         │
3. Resposta: { access_token: "eyJ..." }
         │
4. Frontend: armazena token no localStorage
         │
5. Próximas requisições: Header Authorization: Bearer <token>
         │
6. Backend: JwtStrategy.validate()
   ├── Decodifica e valida o token
   └── Injeta o usuário no contexto da requisição
         │
7. Guards: @UseGuards(JwtAuthGuard)
   └── Protege rotas que requerem autenticação
```

> [!NOTE]
> O token expira em `JWT_EXPIRES_IN` (padrão: `7d`). Após expirar, o usuário precisa fazer login novamente.

---

## 📂 Estrutura do Backend

```
backend/src/
├── main.ts              # Bootstrap da aplicação (CORS, Swagger, porta)
├── app.module.ts        # Módulo raiz — importa todos os outros módulos
├── prisma/
│   └── prisma.service.ts  # Conexão com banco (singleton)
└── modules/
    ├── auth/
    │   ├── auth.module.ts        # Configura JWT + Passport
    │   ├── auth.controller.ts    # POST /auth/login, /auth/register
    │   ├── auth.service.ts       # Lógica: validar senha, gerar token
    │   ├── jwt.strategy.ts       # Lê e valida o JWT de cada requisição
    │   └── admin-users.controller.ts  # CRUD de usuários via admin
    ├── profiles/
    │   ├── profiles.controller.ts  # GET/PATCH /profiles
    │   └── profiles.service.ts
    ├── events/
    │   └── ...                    # Padrão: controller + service
    └── [demais módulos]/
        ├── <nome>.controller.ts
        ├── <nome>.service.ts
        └── <nome>.module.ts
```

### Padrão de um Módulo NestJS

Cada módulo segue o mesmo padrão:

```typescript
// exemplo.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ExemploController],
  providers: [ExemploService],
})
export class ExemploModule {}

// exemplo.controller.ts — define as rotas HTTP
@Controller('exemplo')
@UseGuards(JwtAuthGuard)
export class ExemploController {
  constructor(private readonly service: ExemploService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() dto: CreateExemploDto) { return this.service.create(dto); }
}

// exemplo.service.ts — contém a lógica de negócio
@Injectable()
export class ExemploService {
  constructor(private prisma: PrismaService) {}

  findAll() { return this.prisma.exemplo.findMany(); }
  create(dto: CreateExemploDto) { return this.prisma.exemplo.create({ data: dto }); }
}
```

---

## 📂 Estrutura do Frontend

```
frontend/src/
├── main.tsx             # Entry point — monta o React
├── App.tsx              # Roteamento principal + Providers globais
├── pages/               # Uma pasta por tela
├── components/          # Componentes reutilizáveis
│   └── ui/              # Componentes shadcn/ui (Button, Input, etc.)
├── contexts/
│   └── AuthContext.tsx  # Estado global do usuário logado
├── lib/
│   ├── api.ts           # Instância do Axios com baseURL e interceptores
│   ├── dateUtils.ts     # Formatação de datas
│   ├── errorMessages.ts # Tratamento centralizado de erros da API
│   ├── phoneUtils.ts    # Formatação de telefones
│   └── security.ts      # Sanitização de inputs
└── hooks/               # Custom hooks do React
```

### Como uma Página se Comunica com a API

```typescript
// Padrão típico em uma página React:

// 1. BUSCAR dados (useQuery)
const { data: members, isLoading } = useQuery({
  queryKey: ['members'],          // chave única para cache
  queryFn: async () => {
    const { data } = await api.get('/profiles');  // chama a API
    return data;
  },
});

// 2. MODIFICAR dados (useMutation)
const createMutation = useMutation({
  mutationFn: (payload) => api.post('/profiles', payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });  // atualiza cache
    toast({ title: 'Criado com sucesso!' });
  },
});
```

---

## 🗃️ Banco de Dados — Modelos Principais

```
User                    Profile
├── id (UUID)           ├── userId (FK → User)
├── email               ├── fullName
└── password            ├── whatsappPhone
      │                 ├── avatarUrl
      ▼                 └── username
   UserRole
   ├── userId (FK)
   └── role (admin|lider|pastor|membro)

Event                   KidsCheckin
├── id                  ├── id
├── title               ├── eventId (FK → Event)
├── date                ├── childName
└── ...                 ├── guardianId (FK → Profile)
                        ├── validationToken (6 dígitos)
                        └── status (active|retirado)

Group (Departamento)    MemberGroup
├── id                  ├── userId (FK → Profile)
├── name                ├── groupId (FK → Group)
└── description         └── role (member|manager)
```

---

## 📡 WhatsApp — Integração com Baileys

O módulo `whatsapp` usa a biblioteca **Baileys** para conectar ao WhatsApp Web via QR Code.

**Fluxo:**
```
1. Admin acessa /whatsapp no frontend
2. Backend gera QR Code via Baileys
3. Admin escaneia com o WhatsApp do celular da igreja
4. Sessão é salva em backend/baileys_auth/
5. Sistema pode enviar mensagens via /api/wz-dispatches
```

> [!WARNING]
> A sessão do WhatsApp fica salva localmente em `baileys_auth/`. Se o servidor for reiniciado ou a pasta deletada, será necessário escanear o QR Code novamente.

---

## 🔄 WebSockets — Chat em Tempo Real

O módulo `messages` usa **Socket.io** para o chat interno.

```
Frontend                    Backend
    │── conecta ao Socket ──▶ Gateway (MessagesGateway)
    │── emite 'send_message' ─▶ salva no banco
    │◀─ recebe 'new_message' ── broadcast para sala
```

---

## 📁 Uploads de Arquivos

O módulo `upload` usa **Multer** para receber arquivos e os salva em `backend/uploads/`.

- **Rota**: `POST /api/upload`
- **Acesso**: `GET /uploads/<nome-do-arquivo>`
- **Configurável**: via `UPLOADS_DIR` no `.env`
