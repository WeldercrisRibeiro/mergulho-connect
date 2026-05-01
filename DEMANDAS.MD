Incluir lógicas com Redis para controle de Mensageria, para evitar bloqueios da Meta e criar uma fila inteligente de envio das mensagens para evitar ban. Isso deve ser feito tanto para docker quanto para o supabase, deve ficar documentado.

Corrigir consultas no supabase para otimizar a velocidade de carregamento. Verificar se o join está correto, se está utilizando os indices corretamente, etc. Rotinas como membros e departamentos, agendas, devocionais estão demorando um pouco para trazer a telas os dados. 

Eventos com check-in via Qrcode devem ter opção de marcar a opção "eu vou", se não for um evento do tipo conferência.

Caminho: Agenda > Tela inicial do evento

Corrigir Bugs CEP, ainda apresenta erro em PROD ao consultar CEPs válidos.

Limitar ano de nascimento para 4 dígitos. (Limitar todos os campso de anos da plataforma)

Membros pré-selecionados  estão aparecendo ao vincular membros em outro departamentos

Melhorar possibilidade desativar/ativar funções como: Desativar Validação, chat para geral.

Melhorar visualização mobile

Melhore a conexão ao WhatsAPp, fiz um teste om 36 disparos, e só 10 enviou pois a conexão caiu sendo necessário reconectar o número novamente.

Retire visualização de departamentos na tela de perfil