# Arquitetura de Fila de Mensagens (WhatsApp)

Este documento descreve como o sistema gerencia a fila e o envio de mensagens em lote (disparos) para o WhatsApp, garantindo estabilidade e evitando bloqueios.

## Abordagem Adotada: Fila via Banco de Dados (Postgres)

Anteriormente, considerou-se o uso do Redis + BullMQ para o gerenciamento das filas. No entanto, para **reduzir a complexidade da infraestrutura**, **diminuir custos** (evitando a necessidade de um servidor Redis dedicado) e **aproveitar a robustez do PostgreSQL já presente via Supabase**, a abordagem foi simplificada.

Atualmente, o sistema utiliza o próprio banco de dados relacional associado a um **Cron Job** (tarefa agendada) no NestJS.

### Como Funciona:

1. **Armazenamento no Banco (`WzDispatch`):**
   Quando um administrador agenda ou dispara uma mensagem, um registro é criado na tabela `WzDispatch` com o status inicial igual a `pending`.
   - Se possuir anexos, eles são salvos na tabela `WzDispatchAttachment`.
   - Uma data `scheduledAt` é definida (pode ser o momento atual ou uma data futura).

2. **O "Worker" (Cron Job):**
   Dentro do módulo `WhatsAppModule` (`whatsapp.service.ts`), existe um método decorado com `@Cron(CronExpression.EVERY_MINUTE)`. 
   - A cada minuto, este "worker" verifica o banco de dados em busca de disparos onde `status = 'pending'` e `scheduledAt <= agora()`.

3. **Processamento Seguro (Throttling):**
   Ao encontrar um disparo pendente:
   - O status é imediatamente alterado para `sending` (para evitar que a próxima execução do Cron tente processar o mesmo disparo).
   - O sistema levanta a lista de destinatários com base no tipo do disparo (geral, por grupo ou individual).
   - **Prevenção de Banimento:** O envio é feito de forma sequencial com intervalos de espera forçados (usando `await sleep(...)`).
     - Intervalo entre mensagens de texto: ~1.2s
     - Intervalo para anexos: ~1.5s
     - Intervalo entre contatos diferentes: ~2.0s

4. **Tratamento de Anexos (Integração Supabase):**
   Antes de iniciar o loop de destinatários, o sistema baixa os anexos do Supabase Storage diretamente para a memória (`Buffer`). Se for um áudio, ele também realiza a conversão para OGG/Opus (necessário para o WhatsApp) em memória. Isso otimiza o uso de rede e evita gargalos de I/O de disco.

5. **Logs de Sucesso e Erro (`WzDispatchLog`):**
   Para cada destinatário processado, um log é registrado indicando se houve sucesso ou erro no envio daquela mensagem específica.

6. **Finalização:**
   Após todos os destinatários serem processados, o status do `WzDispatch` é atualizado para `sent` (ou `error` caso ocorra uma falha crítica que aborte o processo).

### Vantagens Desta Arquitetura:
* **Zero Configuração de Infraestrutura Extra:** Não há necessidade de gerenciar Redis ou Workers separados.
* **Tudo no Postgres:** O estado da fila sobrevive a reinicializações da aplicação.
* **Custo-Benefício:** Perfeito para o fluxo de mensagens de uma igreja, onde os volumes geralmente não justificam uma infraestrutura elástica de filas puras.

### O Que Aconteceu Com o Redis?
O Redis foi **completamente removido** da stack de dependências do projeto. Isso significa que tanto no ambiente Docker local quanto na produção com Supabase, você só precisa se preocupar com o PostgreSQL. O arquivo `docker-compose.yml` foi limpo para refletir esta simplificação.
