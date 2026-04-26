# Manutenção e Operação — Mergulho Connect

---

## ⚡ Comandos Rápidos do Dia a Dia

### Backend
```bash
cd backend

npm run start:dev          # Rodar em desenvolvimento (com watch)
npm run start:prod         # Rodar em produção
npm run build              # Compilar TypeScript para /dist

npx prisma studio          # Interface visual do banco (abre no navegador)
npx prisma migrate dev     # Aplicar novas migrações
npx prisma generate        # Regenerar o Prisma Client
npx prisma db push         # Sincronizar schema sem criar migration (cuidado!)
```

### Frontend
```bash
cd frontend

npm run dev                # Rodar em desenvolvimento
npm run build              # Gerar build de produção em /dist
npm run preview            # Visualizar o build de produção localmente
```

### Docker (Banco de Dados)
```bash
cd backend

docker compose up -d       # Subir o banco em background
docker compose down        # Parar o banco (dados preservados)
docker compose down -v     # Parar e APAGAR todos os dados
docker compose logs -f     # Ver logs do banco em tempo real
docker ps                  # Listar containers rodando
```

---

## 🗃️ Variáveis de Ambiente (`.env`)

Localização: `backend/.env`

| Variável | Exemplo | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:senha@localhost:5432/mergulho` | String de conexão com o PostgreSQL |
| `JWT_SECRET` | `minha-chave-super-secreta` | Chave para assinar os tokens JWT. **Troque em produção!** |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiração do token. Formatos: `7d`, `24h`, `60m` |
| `PORT` | `3001` | Porta em que o backend vai escutar |
| `NODE_ENV` | `development` | Ambiente. Use `production` em produção |
| `FRONTEND_URL` | `http://localhost:5173` | URL do frontend (usado no CORS) |
| `UPLOADS_DIR` | `./uploads` | Pasta onde os arquivos enviados são salvos |

> [!IMPORTANT]
> Nunca faça commit do arquivo `.env` para o Git. Ele já está no `.gitignore`. Use o `.env.example` como template.

---

## ➕ Como Adicionar um Novo Módulo no Backend

Siga esses passos para criar um módulo do zero:

### 1. Criar o modelo no Prisma (se precisar de uma nova tabela)

Edite `backend/prisma/schema.prisma`:
```prisma
model MinhaEntidade {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nome      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("minha_entidade")
}
```

Depois rode a migration:
```bash
npx prisma migrate dev --name add_minha_entidade
```

### 2. Criar a estrutura de arquivos

```
src/modules/minha-entidade/
├── minha-entidade.module.ts
├── minha-entidade.controller.ts
└── minha-entidade.service.ts
```

### 3. Implementar o Service

```typescript
// minha-entidade.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MinhaEntidadeService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.minhaEntidade.findMany();
  }

  create(data: { nome: string }) {
    return this.prisma.minhaEntidade.create({ data });
  }
}
```

### 4. Implementar o Controller

```typescript
// minha-entidade.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MinhaEntidadeService } from './minha-entidade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('minha-entidade')
@UseGuards(JwtAuthGuard)  // Protege todas as rotas com JWT
export class MinhaEntidadeController {
  constructor(private readonly service: MinhaEntidadeService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  create(@Body() body: { nome: string }) { return this.service.create(body); }
}
```

### 5. Registrar o Módulo

```typescript
// minha-entidade.module.ts
import { Module } from '@nestjs/common';
import { MinhaEntidadeController } from './minha-entidade.controller';
import { MinhaEntidadeService } from './minha-entidade.service';

@Module({
  controllers: [MinhaEntidadeController],
  providers: [MinhaEntidadeService],
})
export class MinhaEntidadeModule {}
```

### 6. Importar no AppModule

Edite `backend/src/app.module.ts`:
```typescript
import { MinhaEntidadeModule } from './modules/minha-entidade/minha-entidade.module';

@Module({
  imports: [
    // ... outros módulos
    MinhaEntidadeModule,
  ],
})
export class AppModule {}
```

---

## ➕ Como Adicionar uma Nova Página no Frontend

### 1. Criar o componente da página

```typescript
// frontend/src/pages/MinhaPagina.tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const MinhaPagina = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['minha-entidade'],
    queryFn: async () => {
      const { data } = await api.get('/minha-entidade');
      return data;
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-4">
      <h1>Minha Página</h1>
      {data?.map((item: any) => <p key={item.id}>{item.nome}</p>)}
    </div>
  );
};

export default MinhaPagina;
```

### 2. Registrar a rota no App.tsx

Edite `frontend/src/App.tsx`:
```typescript
import MinhaPagina from './pages/MinhaPagina';

// Dentro de <Routes>:
<Route path="/minha-pagina" element={<ProtectedRoute><MinhaPagina /></ProtectedRoute>} />
```

### 3. Adicionar ao menu (BottomNav / DesktopSidebar)

Para aparecer na navegação, edite:
- `frontend/src/components/BottomNav.tsx` — menu mobile
- `frontend/src/components/DesktopSidebar.tsx` — menu desktop

---

## 🔑 Como Resetar Senha de um Usuário

### Via interface (recomendado)
1. Acesse `/membros` como admin
2. Clique no ícone de chave (🔑) ao lado do usuário
3. Confirme o reset — senha volta para `123456`

### Via Prisma Studio
```bash
cd backend
npx prisma studio
```
1. Abra a tabela `users`
2. Encontre o usuário
3. **Não edite a senha diretamente** — ela precisa de hash bcrypt

### Via seed script
```bash
cd backend
npx ts-node seed-admin.ts  # recria o admin padrão
```

---

## 🔒 Como Criar um Novo Admin pelo Banco

Se precisar criar um admin via script:

```typescript
// Crie um arquivo seed-novo-admin.ts em backend/
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('senha123', 10);
  
  const user = await prisma.user.create({
    data: {
      email: 'novo@ccmergulho.com',
      password: hash,
      profile: {
        create: {
          fullName: 'Nome do Admin',
          username: 'novo.admin',
        }
      },
      userRole: {
        create: { role: 'admin' }
      }
    }
  });
  
  console.log('Admin criado:', user.email);
}

main().finally(() => prisma.$disconnect());
```

Execute:
```bash
npx ts-node seed-novo-admin.ts
```

---

## 🛠️ Migrações de Banco — Boas Práticas

> [!IMPORTANT]
> Sempre use `prisma migrate dev` em desenvolvimento e `prisma migrate deploy` em produção.

```bash
# Desenvolvimento — cria e aplica a migration
npx prisma migrate dev --name descricao_da_mudanca

# Produção — só aplica migrations já existentes (não cria novas)
npx prisma migrate deploy

# Ver status das migrations
npx prisma migrate status

# Resetar banco completamente (APAGA TODOS OS DADOS)
npx prisma migrate reset
```

---

## 🩺 Verificação de Saúde do Sistema

```bash
# Verificar se a API está respondendo:
curl http://localhost:3001/api

# Ver logs do backend em tempo real (terminal onde npm run start:dev está rodando)

# Verificar banco:
cd backend && npx prisma studio

# Verificar container Docker:
docker ps
docker logs mergulho_postgres
```

---

## 📁 Onde Ficam os Arquivos de Upload

Os arquivos enviados pelos usuários ficam em:
```
backend/uploads/
```

São servidos estaticamente em: `http://localhost:3001/uploads/<nome-do-arquivo>`

> [!NOTE]
> Em produção, considere mover os uploads para um serviço externo como AWS S3 ou Cloudflare R2 para maior confiabilidade.
