# Testes Locais com Docker (Ambiente DEV)

Para garantir que as funcionalidades operem corretamente antes de subirmos para o ambiente de produção (Supabase), configuramos um fluxo de desenvolvimento local utilizando **Docker** e **PostgreSQL**. Dessa forma, você terá uma réplica do ambiente de produção rodando na sua máquina.

## Pré-requisitos
- Docker e Docker Compose instalados.
- Node.js instalado.

## 1. Subindo o Banco de Dados Local
Na raiz do projeto, execute o comando abaixo para iniciar o container do PostgreSQL:
```bash
docker-compose up -d
```
*Isso criará o banco `mergulho_postgres` na porta `5432` da sua máquina, rodando em background (`-d`).*

## 2. Configurando o Ambiente (Variáveis)
Para que o sistema passe a utilizar o seu banco de dados local, altere temporariamente os apontamentos de banco no arquivo `backend/.env`.

**No arquivo `backend/.env`, altere (ou comente as credenciais do Supabase e adicione):**
```env
# Banco de Dados (Local Docker)
DATABASE_URL="postgresql://postgres:mergulho123@localhost:5432/mergulho?schema=public"
DIRECT_URL="postgresql://postgres:mergulho123@localhost:5432/mergulho?schema=public"
```
*(Nota: Lembre-se de não alterar as chaves do `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`, pois o storage de imagens continuará usando o Supabase mesmo em desenvolvimento).*

## 3. Preparando as Tabelas (Prisma)
Como o banco de dados do Docker acabou de ser criado e está vazio, você precisará criar as tabelas com base no seu *schema* do Prisma.
No terminal, dentro da pasta `backend`, execute:
```bash
npx prisma db push
```

## 4. Criando Usuário Administrador
Para conseguir fazer o primeiro login e visualizar o Dashboard localmente, execute o script de criação do administrador padrão:
No terminal, dentro da pasta `backend`, rode:
```bash
npm run create-admin
```

## 5. Parando o Banco Local
Quando finalizar os seus testes e não precisar mais do banco rodando, para economizar memória da sua máquina, você pode pausá-lo executando na raiz do projeto:
```bash
docker-compose stop
```
*(No dia seguinte, você pode usar `docker-compose start` para religá-lo sem perder os dados, pois os volumes estão persistidos).*

## 6. Retornando para Produção (Supabase)
Quando for fazer deploy ou quiser que seu código aponte novamente para os dados reais (Supabase):
1. Restaure o `DATABASE_URL` e o `DIRECT_URL` no seu arquivo `backend/.env` para as chaves originais do Supabase (use o arquivo de backup `.env.production` caso tenha criado um).
2. Não há necessidade de parar o Docker se não quiser, pois o NestJS passará a ignorá-lo e conectará diretamente no Supabase.
