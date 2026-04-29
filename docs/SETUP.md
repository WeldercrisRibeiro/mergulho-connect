# Como Rodar o Projeto — Passo a Passo

> Guia completo para instalar, configurar e executar o Mergulho Connect do zero.

---

## ✅ Pré-requisitos

Instale as seguintes ferramentas antes de começar:

| Ferramenta | Versão mínima | Download |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | Vem com o Node |
| Docker Desktop | 4+ | https://docker.com |
| Git | qualquer | https://git-scm.com |

Verifique se estão instalados:
```bash
node -v       # deve mostrar v20.x
npm -v        # deve mostrar 10.x
docker -v     # deve mostrar Docker version ...
git --version
```

---

## 📦 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd mergulho-connect
```

---

## 🗄️ 2. Subir o Banco de Dados (PostgreSQL via Docker)

O banco roda em um container Docker. Não precisa instalar o PostgreSQL manualmente.

```bash
cd backend
docker compose up -d
```

Aguarde alguns segundos e verifique se o container está rodando:
```bash
docker ps
# Deve aparecer: mergulho_postgres   postgres:16-alpine   Up
```

> [!NOTE]
> O banco cria automaticamente o banco `mergulho` com usuário `postgres` e senha `mergulho123`. Esses valores já estão configurados no `.env`.

---

## ⚙️ 3. Configurar as Variáveis de Ambiente do Backend

O arquivo `.env` já existe em `backend/.env`. Revise os valores:

```env
DATABASE_URL="postgresql://postgres:mergulho123@localhost:5432/mergulho"
JWT_SECRET="sua-chave-secreta-muito-segura-aqui-troque-em-producao"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
UPLOADS_DIR="./uploads"
```

> [!IMPORTANT]
> Em produção, troque o `JWT_SECRET` por uma string longa e aleatória. Nunca use o valor padrão em produção.

---

## 📚 4. Instalar Dependências do Backend

```bash
# Dentro da pasta backend/
npm install
```

---

## 🔄 5. Rodar as Migrações do Banco

As migrações criam todas as tabelas no PostgreSQL:

```bash
# Dentro da pasta backend/
npx prisma migrate dev
```

Se aparecer um prompt pedindo nome da migration, digite algo como `init`.

Após as migrações, gere o client do Prisma:
```bash
npx prisma generate
```

---

## 👤 6. Criar o Primeiro Usuário e Promover para Admin

Atualmente não existe script de seed versionado para admin. O fluxo inicial é:

1. Criar o primeiro usuário via endpoint de registro:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Admin Inicial\",\"email\":\"admin@ccmergulho.com\",\"password\":\"123456\"}"
```
2. Promover esse usuário para admin no banco (via Prisma Studio ou SQL), ajustando `user_roles.role` para `admin`.

> [!WARNING]
> Troque a senha imediatamente após o primeiro login e nunca mantenha senha padrão em produção.

---

## 🚀 7. Rodar o Backend

```bash
# Dentro da pasta backend/
npm run start:dev
```

O backend estará disponível em:
- **API**: http://localhost:3001/api
- **Swagger (documentação interativa)**: http://localhost:3001/docs

Você verá no terminal:
```
🚀 API rodando em: http://localhost:3001/api
📚 Swagger em:     http://localhost:3001/docs
```

---

## 🖥️ 8. Configurar e Rodar o Frontend

Em um **novo terminal**:

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em:
- http://localhost:8080

---

## 🔁 Fluxo Resumido (após a instalação inicial)

Toda vez que for trabalhar no projeto, basta:

```bash
# Terminal 1 — Banco de Dados
cd backend
docker compose up -d

# Terminal 2 — Backend
cd backend
npm run start:dev

# Terminal 3 — Frontend
cd frontend
npm run dev
```

---

## 🛑 Parar Tudo

```bash
# Parar os servidores: Ctrl+C em cada terminal

# Parar o container do banco:
cd backend
docker compose down
```

> [!NOTE]
> Os dados do banco são persistidos em um volume Docker chamado `pgdata`. Usar `docker compose down` **não apaga os dados**. Para apagar tudo inclusive os dados: `docker compose down -v`

---

## ❗ Problemas Comuns

### Erro: "Cannot connect to database"
- Verifique se o Docker está rodando: `docker ps`
- Verifique se o container `mergulho_postgres` está `Up`
- Confirme que a `DATABASE_URL` no `.env` está correta

### Erro: "Port 3001 already in use"
```bash
# Encontrar o processo usando a porta
netstat -ano | findstr :3001
# Encerrar o processo
taskkill /PID <numero_do_pid> /F
```

### Erro no Prisma após pull do git
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### Frontend não consegue acessar a API
- Verifique se o backend está rodando na porta 3001
- Verifique o arquivo `frontend/src/lib/api.ts` — a `baseURL` deve apontar para `http://localhost:3001/api`
