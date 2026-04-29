# Plano de Implementação: Desacoplamento de Mensagens com BullMQ e Redis

Este documento descreve como migrar a lógica de disparos de mensagens do sistema síncrono/cron atual para um sistema de filas robusto.

## 1. Visão Geral da Arquitetura

Atualmente, o sistema processa disparos em um loop dentro de um Cron. Se houver 1000 mensagens, o processo fica preso enviando uma por uma. Com BullMQ:

- **Produtor (NestJS):** Cria jobs na fila para cada destinatário.
- **Fila (Redis):** Armazena os jobs e gerencia estados (pendente, processando, falha, concluído).
- **Consumidor (NestJS Worker):** Processa cada job individualmente, permitindo controle de intervalos (rate limiting) e tentativas automáticas (retries).

---

## 2. Cenários de Infraestrutura

### Cenário A: Docker + PostgreSQL Local
Ideal para desenvolvimento ou VPS própria.

**docker-compose.yml:**
```yaml
services:
  postgres:
    image: postgres:16-alpine
    # ... configurações atuais ...

  redis:
    image: redis:7-alpine
    container_name: mergulho_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### Cenário B: Supabase + Produção (Render/Vercel)
Como o Supabase não fornece Redis, você precisa de um provedor externo.

- **Recomendação:** [Upstash](https://upstash.com/) (Serverless Redis) ou **Render Managed Redis**.
- **Configuração:** Você receberá uma `REDIS_URL`.

**.env:**
```env
# Conexão com Redis (Exemplo Upstash ou Local)
REDIS_URL=rediss://default:sua_senha@seu-host.upstash.io:6379
# Ou local
# REDIS_URL=redis://localhost:6379
```

---

## 3. Implementação no Backend (NestJS)

### Passo 1: Instalação
```bash
npm install @nestjs/bullmq bullmq ioredis
```

### Passo 2: Módulo de Fila (`messaging-queue.module.ts`)
```typescript
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),
    BullModule.registerQueue({
      name: 'whatsapp-messages',
      // Configuração de Rate Limiting nativa
      limiter: {
        max: 1, // 1 mensagem
        duration: 5000, // a cada 5 segundos
      },
    }),
  ],
})
export class MessagingQueueModule {}
```

### Passo 3: O Processador (`messaging.processor.ts`)
Este arquivo conterá a lógica que antes estava no `WhatsAppService`.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('whatsapp-messages')
export class MessagingProcessor extends WorkerHost {
  async process(job: Job<any>): Promise<any> {
    const { phone, content, attachments } = job.data;
    
    // Aqui chama a lógica de envio real (whatsapp.client.ts)
    // Se falhar, o BullMQ tentará novamente baseado na config
    console.log(`Enviando para ${phone}...`);
    // await sendTextMessage(phone, content);
  }
}
```

### Passo 4: Adaptando o `WhatsAppService`
Em vez de enviar, o serviço agora apenas "agenda" na fila.

```typescript
// No loop de destinatários:
await this.messagesQueue.add('send-whatsapp', {
  phone,
  content: dispatch.content,
  attachments: dispatch.attachments,
}, {
  attempts: 3, // Tenta 3 vezes em caso de erro
  backoff: {
    type: 'exponential',
    delay: 10000, // Espera 10s antes da primeira tentativa
  },
});
```

---

## 4. Benefícios da Mudança

1. **Escalabilidade:** Você pode enviar 5000 mensagens sem travar o servidor.
2. **Resiliência:** Se a internet cair ou o WhatsApp desconectar no meio, os jobs ficam salvos no Redis e continuam de onde pararam assim que voltar.
3. **Controle de Spam:** O `limiter` do BullMQ garante que você nunca envie mensagens rápido demais, protegendo seu número de banimentos.
4. **Monitoramento:** É possível usar ferramentas como o [BullBoard](https://github.com/felixmosh/bull-board) para ver em tempo real quantas mensagens faltam ser enviadas.

---

## 5. Próximos Passos (Para o Futuro)
1. Escolher o provedor de Redis (Upstash recomendado pela facilidade).
2. Criar o módulo no NestJS.
3. Mover a lógica de `sendToRecipient` para o `MessagingProcessor`.
4. Testar com um volume pequeno antes de disparar para toda a base.
