# Guia de Migração para PostgreSQL com Docker

Este guia detalha os passos exatos para migrar o banco de dados do Supabase (Cloud) para um ambiente local utilizando Docker.

## 1. Requisitos
- Docker Desktop instalado e rodando.
- Node.js e NPM instalados.

## 2. Subir o Banco de Dados (Docker)
O projeto já possui um arquivo `docker-compose.yml` na pasta `backend`.

1. Abra o terminal na pasta `backend`:
   ```powershell
   cd backend
   ```
2. Inicie o container do banco:
   ```powershell
   docker-compose up -d
   ```
   *Isso criará um banco Postgres 16 acessível em `localhost:5432`.*

## 3. Ajustes no Backend (.env)
Você precisa redirecionar a conexão do Prisma para o novo banco local.

No arquivo `backend/.env`, altere as variáveis de banco para:

```env
# Banco Local no Docker
DATABASE_URL="postgresql://postgres:mergulho123@localhost:5432/mergulho?schema=public"
DIRECT_URL="postgresql://postgres:mergulho123@localhost:5432/mergulho?schema=public"
```

> **Nota:** Se futuramente você colocar o **Backend** dentro de um container Docker também, a palavra `localhost` na URL acima deverá ser trocada por `postgres` (o nome do serviço no docker-compose).

## 4. Sincronizar o Schema (Prisma)
Com o banco local rodando e o `.env` atualizado, crie as tabelas:

1. Na pasta `backend`, execute:
   ```powershell
   npx prisma migrate dev --name migracao_docker
   ```
2. Gere o cliente do Prisma atualizado:
   ```powershell
   npx prisma generate
   ```

## 5. Migração de Dados (Supabase para Docker)

Existem duas formas de trazer os dados do Supabase para o seu ambiente local.

### Opção A: Migração Direta (Sem arquivos intermediários)
Este comando "espelha" o banco do Supabase direto para o Docker:

```powershell
# Execute na pasta backend
pg_dump "postgresql://postgres.gzsjgqekudrgaqknqxvn:@@mergulhodb@aws-1-us-east-1.pooler.supabase.com:5432/postgres" --clean --if-exists --no-owner --no-privileges | docker exec -i mergulho_postgres psql -U postgres -d mergulho
```

### Opção B: Via Arquivo de Backup (Recomendado)
Para maior segurança, gere um arquivo primeiro e depois importe:

1. **Extrair do Supabase:**
   ```powershell
   pg_dump "postgresql://postgres.gzsjgqekudrgaqknqxvn:@@mergulhodb@aws-1-us-east-1.pooler.supabase.com:5432/postgres" --no-owner --no-privileges > ../database/migracao_supabase.sql
   ```
2. **Importar no Docker:**
   ```powershell
   docker exec -i mergulho_postgres psql -U postgres -d mergulho < ../database/migracao_supabase.sql
   ```

> **Atenção:** Se você já rodou o `prisma migrate dev` localmente, o banco já tem as tabelas. Nesse caso, você pode adicionar a flag `--data-only` no `pg_dump` para trazer apenas os registros.

## Resumo de Comandos Rápidos
- **Subir banco**: `docker-compose up -d`
- **Parar banco**: `docker-compose down`
- **Ver logs**: `docker logs -f mergulho_postgres`
- **Acessar banco via terminal**: `docker exec -it mergulho_postgres psql -U postgres -d mergulho`
