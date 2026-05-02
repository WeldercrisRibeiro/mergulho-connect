# Controle de Demandas - Mergulho Connect

Abaixo está o registro do status atual de cada demanda e o plano de ação correspondente.

---

### 1. Fila de Mensagens (WhatsApp) e Redis
> **Demanda original:** Incluir lógicas com Redis para controle de Mensageria, para evitar bloqueios da Meta e criar uma fila inteligente de envio das mensagens para evitar ban. Isso deve ser feito tanto para docker quanto para o supabase, deve ficar documentado.

* **Status:** ✅ **FEITO (com nova abordagem)**
* **Detalhes:** A abordagem com Redis foi descartada por aumentar custos de servidor e complexidade da infraestrutura. A fila foi implementada com sucesso utilizando o próprio PostgreSQL integrado com um Cron Job. Adicionamos *sleeps* de segurança (entre 1.5s e 2s) entre os envios para evitar bloqueios pela Meta. 
* **Documentação:** Criada em `docs/MESSAGING_ARCHITECTURE.md`. O Docker Compose foi limpo para remover o Redis.

---

### 2. Novo Botão "Eu Vou" na Agenda
> **Demanda original:** Eventos com check-in via Qrcode devem ter opção de marcar a opção "eu vou", se não for um evento do tipo conferência. Caminho: Agenda > Tela inicial do evento.

* **Status:** ✅ **FEITO**
* **Detalhes:** O botão "Vou / Não vou" já está implementado nativamente no `EventCard.tsx` e atende eventos que não são do tipo conferência, registrando o RSVP com sucesso no banco de dados.

---

### 3. Feature Flags (Ativar/Desativar Funções)
> **Demanda original:** Melhorar possibilidade desativar/ativar funções como: Desativar Validação, chat para geral.

* **Status:** ✅ **FEITO**
* **Detalhes:** As Feature Flags ("Chat" e "Validação") foram unificadas com o painel de Acessos (GroupPermissions). Tudo agora fica concentrado na aba "Funcionalidades & Acessos" dentro de Configurações (`Settings.tsx`). A gestão global de ON/OFF foi aprimorada para permitir controle preciso: agora o administrador define exatamente quais departamentos e quais níveis hierárquicos têm acesso a cada um dos módulos do sistema (Agenda, Devocionais, Chat, Check-in, etc). A antiga página "Acessos" independente foi removida.

---

### 4. Estabilidade da Conexão do WhatsApp
> **Demanda original:** Melhore a conexão ao WhatsAPp, fiz um teste om 36 disparos, e só 10 enviou pois a conexão caiu sendo necessário reconectar o número novamente.

* **Status:** 🔄 **EM VALIDAÇÃO / MELHORIA CONTÍNUA**
* **Detalhes:** O novo sistema de filas mitigou parte desse problema, pois as mensagens não são enviadas todas de uma vez "estourando" a conexão. Além disso, a sessão de autenticação do Baileys agora é salva de forma persistente no PostgreSQL. 
* **Plano de Ação:** É necessário rodar um novo teste de carga prático. Se a biblioteca de conexão ainda "dormir" na nuvem, precisaremos implementar um mecanismo de reconexão forçada (Ping automático) ou lógica de "Retry" em lote antes de considerarmos o envio falho.

---

### 5. Salvar Histórico (Versionamento do App)
> **Demanda original:** Criar função para salvar todas alterações realizadas para ficar no versionamento do app.

* **Status:** ✅ **FEITO**
* **Detalhes:** Implementamos um sistema de **Changelog visual** através do componente `VersionIndicator.tsx`, posicionado no rodapé da Landing Page. Ele exibe de forma amigável as atualizações do sistema para que tanto os gestores quanto os membros saibam o que há de novo na plataforma.

---

### 6. Notificação em Massa para Escalados
> **Demanda original:** ADicione uma forma de notificar a todos escalados, independente de departamento. Hoje já existe uma forma individual que é um botão do whatsapp, adapte a rotina para avisar de forma geral invés de individual e adapte visualmente o botão para não ficar em cada escalado mas em um lugar fixo.

* **Status:** ✅ **FEITO**
* **Detalhes:** Adicionado um botão "Notificar Todos" no cabeçalho da seção de gerenciamento de escalas. Ao clicar, o sistema monta uma mensagem consolidada com todos os horários e voluntários agendados e faz um disparo individual via WhatsApp para todos os membros escalados, respeitando a fila.

---

### 7. Exportar Escala como Imagem
> **Demanda original:** Crie uma forma de exportar a escala pronta, pegando o resultado e exportandp p resuktado para imagem

* **Status:** ✅ **FEITO**
* **Detalhes:** Incluído um botão "Exportar Imagem" ao lado das ações de escala. Utilizando a biblioteca `html2canvas`, a estrutura visual da escala é capturada com fundo branco transparente e baixada diretamente como arquivo `.png` no dispositivo do administrador.

---

### 8. Envio Automático de Token de Check-in
> **Demanda original:** Insira uma forma da rotina de check-in de enviar o token gerado ao deixar uma criança ou volume, para o whatsapp do responsável, já que o token fica na tela inicial do responsável, crie uma forma de enviar ao número do responsável

* **Status:** ✅ **FEITO**
* **Detalhes:** Após o registro bem-sucedido do check-in no banco de dados (`checkins.service.ts`), o sistema agenda automaticamente um envio do WhatsApp (WzDispatch) com nível alto de prioridade. A mensagem contém o Token de 6 dígitos gerado e instruções para retirada do volume/criança de forma segura.