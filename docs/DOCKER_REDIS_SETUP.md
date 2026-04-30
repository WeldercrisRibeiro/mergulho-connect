# Guia de Configuração Docker & Redis (BullMQ)

Este guia contém as instruções para migrar o sistema de mensageria de "Polling (DB)" para "Queue (BullMQ/Redis)" no futuro.

## 1. Infraestrutura (Docker)

O arquivo `docker-compose.yml` na raiz do projeto já contém a definição do Redis. Para iniciar o serviço:

```bash
docker compose up -d
```

## 2. Dependências do Backend

Será necessário instalar os seguintes pacotes no diretório `backend`:

```bash
npm install @nestjs/bullmq bullmq ioredis
```

## 3. Alterações no Código

### AppModule
Importar o `BullModule` configurado para o Redis local:

```typescript
// src/app.module.ts
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    // ...
  ],
})
```

### WhatsApp Service (Refatoração)
Em vez de usar `@Cron` para processar o banco de dados, você deve injetar uma fila e adicionar jobs:

```typescript
// Exemplo de injeção de fila
constructor(@InjectQueue('whatsapp') private waQueue: Queue) {}

// Adicionando à fila
await this.waQueue.add('send-message', { phone, content, attachments });
```

## 4. Vantagens da Migração
- **Escalabilidade**: Processamento em segundo plano real, sem travar o event loop do Node.
- **Retentativas Automáticas**: O BullMQ gerencia falhas e retenta envios automaticamente.
- **Controle de Vazão**: Facilidade para limitar quantos envios ocorrem por segundo para evitar bloqueios do WhatsApp.
