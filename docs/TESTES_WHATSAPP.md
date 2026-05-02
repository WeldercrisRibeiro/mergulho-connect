# Guia de Validação: Estabilidade de Fila do WhatsApp

Este documento detalha o processo de testes para garantir a estabilidade da conexão do bot do WhatsApp (Baileys) no envio de mensagens em lote (Disparos), verificando se as travas anti-ban e o mecanismo de fila em background estão operando corretamente.

## Objetivo
Validar que a conexão do WhatsApp não sofra desconexões abruptas (ex: falhar após enviar 10 mensagens) ao lidar com volumes maiores (ex: 36+ mensagens de uma só vez), garantindo que o cron job faça o *throttling* adequado.

## Pré-requisitos
1. Servidor Backend rodando (`npm run start:dev` ou em Produção).
2. O servidor deve estar autenticado com o WhatsApp (Status: **Conectado** no painel Administrativo).
3. Pelo menos um grupo com mais de 30 membros cadastrados ou disponibilidade para adicionar contatos fictícios/de teste.

## Passo a Passo do Teste Prático

### 1. Limpeza de Sessão (Recomendado)
Para evitar que "sujeiras" de sessões travadas anteriores influenciem no teste:
* Acesse **Configurações > WhatsApp**.
* Clique em **Encerrar Sessão do WhatsApp**.
* Gere um novo QR Code e conecte o aparelho novamente.

### 2. Criação do Disparo de Carga
* Navegue até a tela de **Notificações** (Disparos).
* Clique em **Novo Disparo**.
* No campo de destinatário, escolha a segmentação que englobe cerca de 36 pessoas (pode ser "Todos", um grupo específico ou selecionar individualmente).
* Inclua uma mensagem de texto padrão e (opcionalmente) um anexo leve para testar a carga do conversor de mídia em memória.
* Clique em **Enviar**.

### 3. Monitoramento da Fila
Após enviar, não atualize ou saia imediatamente da página; acompanhe os seguintes comportamentos no sistema:
* **Fase 1 (Pendente):** O disparo é salvo no banco de dados com status `pending`.
* **Fase 2 (Pickup):** Em até 60 segundos (tempo do Cron Job), o status deve mudar automaticamente para `sending`.
* **Fase 3 (Throttling):** Acompanhe os logs no terminal do backend. Você deve notar um intervalo de **1 a 2 segundos** entre o registro de sucesso de cada mensagem enviada.
* **Fase 4 (Conclusão):** O status final mudará para `sent`. O processo total para 36 mensagens deve durar entre 1 a 2 minutos.

## Critérios de Sucesso
* [ ] O disparo foi processado inteiramente em background.
* [ ] O intervalo (sleep) entre as mensagens foi respeitado, garantindo que a API não foi inundada.
* [ ] A conexão principal (Aparelhos Conectados no celular do bot) permaneceu ativa durante e após o teste, sem pedir reconexão.
* [ ] Todas as 36 pessoas receberam a mensagem com sucesso (ou as falhas por "número inválido" não interromperam o envio das demais).

## Resolução de Problemas
Se a conexão continuar caindo (Status muda para Desconectado durante o processo):
* **Cenário A:** O Supabase pode estar derrubando as conexões do banco. Verifique o limite de conexões (`pool_size`).
* **Cenário B:** A biblioteca de rede (`Baileys`) está perdendo a atividade do Socket. Pode ser necessário implementar um PING periódico ou reconexão forçada (Retry mechanism) nos casos onde o bot "dorme".
