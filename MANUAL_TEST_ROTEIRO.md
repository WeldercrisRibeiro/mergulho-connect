# Roteiro de Testes Manuais - Mergulho Connect

Guia rapido para validar as principais rotinas do sistema sem precisar ler codigo.

## 1) Objetivo

Este roteiro resume as funcoes principais e orienta como testar manualmente cada fluxo:
- autenticacao e perfil
- conteudo publico (landing)
- agenda e eventos
- comunicacao (chat, avisos, contatos)
- administracao e configuracoes
- operacoes ministeriais (voluntarios, check-in kids, tesouraria, relatorios)

## 2) Perfis para teste

Use pelo menos 3 usuarios:
- `admin`: acesso total
- `lider`: acesso parcial por departamento
- `membro`: acesso basico

## 3) Pre-condicoes

- Backend ativo em `http://localhost:3001/api`
- Frontend ativo em `http://localhost:8080` (ou porta configurada no projeto)
- Banco com dados minimos:
  - 1 grupo/departamento
  - 1 evento publico e 1 privado
  - 1 anuncio
  - 1 usuario por perfil de teste

## 4) Resumo das funcoes por area

### 4.1 Autenticacao e Conta
- Login por usuario/email/telefone (normalizacao na tela de acesso).
- Solicitar acesso (gera mensagem de contato).
- Troca de senha:
  - autenticado (`/auth/password`)
  - por credenciais na tela de login (`/auth/password/by-credentials`).
- Sessao com token JWT e validacao de `/auth/me`.

### 4.2 Landing (publica)
- Exibe fotos, depoimentos e configuracoes do site.
- Exibe agenda publica de eventos.
- Formulario "fale conosco" grava contato.
- Acesso publico sem login apenas nas rotinas marcadas como publicas.

### 4.3 Agenda e Eventos
- Listagem de eventos.
- Criacao/edicao/exclusao de evento (perfil com permissao).
- RSVP/inscricao/check-in em eventos.
- Visualizacao de evento publico sem autenticar.

### 4.4 Comunicacao
- Avisos/comunicados: listar, criar, editar, excluir.
- Contador de avisos nao lidos.
- Chat direto e em grupo (inclui arquivamento/ocultacao quando aplicavel).
- Mensagens de contato vindas da landing.

### 4.5 Administracao
- Gestao de membros e papeis.
- Gestao de grupos e vinculo de membros.
- Uploads (imagens/arquivos) e uso em telas.
- Configuracoes gerais do site.

### 4.6 Operacao ministerial
- Voluntarios e escalas.
- Check-in kids (entrada, retirada e chamadas).
- Tesouraria e relatorios de culto/evento.
- Relatorios consolidados.

## 5) Roteiro de teste manual (passo a passo)

## Etapa A - Smoke test (5 a 10 min)

1. Acesse `/landing` sem login.
2. Confirme carregamento de:
   - fotos
   - depoimentos
   - agenda publica
3. Envie formulario de contato.
4. Acesse `/auth` e faça login com usuario valido.
5. Confirme redirecionamento para `/home`.
6. Abra `/perfil` e altere algum campo simples.

**Esperado:** sem erros visiveis, sem tela quebrada, API respondendo.

## Etapa B - Autenticacao e seguranca

1. Login com credencial invalida.
2. Login com credencial valida.
3. Troca de senha com senha atual correta.
4. Logout e login com a nova senha.
5. Chame uma rota protegida sem token (via DevTools/Postman).

**Esperado:**
- credencial invalida retorna erro amigavel
- troca de senha persiste
- rota protegida sem token retorna `401`

## Etapa C - Permissao por perfil

1. Logado como `membro`, tente acessar tela/acao administrativa.
2. Logado como `lider`, valide apenas funcoes do escopo dele.
3. Logado como `admin`, valide acesso completo.

**Esperado:** menus, telas e acoes respeitam o perfil.

## Etapa D - Eventos e agenda

1. Criar evento publico e verificar na landing.
2. Criar evento privado e verificar que nao aparece publicamente.
3. Editar evento e conferir atualizacao na agenda.
4. Excluir evento e validar remocao nas listagens.
5. Realizar RSVP/inscricao/check-in.

**Esperado:** regras de publico/privado e operacoes CRUD funcionando.

## Etapa E - Comunicacao

1. Criar comunicado.
2. Verificar contador de nao lidos em outro usuario.
3. Abrir chat, enviar mensagem direta e em grupo.
4. Arquivar/ocultar conversa (quando funcionalidade estiver disponivel).
5. Validar mensagem de contato recebida no painel.

**Esperado:** envio/recebimento correto, contador consistente.

## Etapa F - Admin e configuracoes

1. Criar membro pelo admin.
2. Alterar papel e grupos do membro.
3. Resetar senha do membro.
4. Alterar configuracao de site (ex.: WhatsApp/links).
5. Upload de imagem e validacao visual na tela correspondente.

**Esperado:** persistencia no banco e reflexo imediato no frontend.

## Etapa G - Operacao ministerial

1. Voluntarios:
   - cadastrar
   - criar escala
   - alterar status
2. Check-in kids:
   - registrar entrada
   - solicitar chamada
   - registrar retirada
3. Tesouraria:
   - lancar entrada/saida
   - editar/excluir lancamento
4. Relatorios:
   - gerar e validar dados basicos.

**Esperado:** ciclo completo sem inconsistencias visiveis.

## 6) Checklist de regressao rapida (a cada release)

- [ ] Login, logout, troca de senha
- [ ] Landing publica abre sem erro
- [ ] Evento publico aparece na agenda publica
- [ ] Criacao de comunicado + contador nao lido
- [ ] Chat envia/recebe mensagem
- [ ] CRUD basico de membros e grupos
- [ ] Upload de arquivo funcional
- [ ] Rotas protegidas retornam `401` sem token

## 7) Evidencias recomendadas

Para cada etapa, registrar:
- usuario usado
- data/hora
- resultado (`OK` ou `NOK`)
- screenshot/video curto quando `NOK`
- payload/erro retornado (se houver)

## 8) Modelo de relatorio de teste manual

Use este padrao:

- **Cenario:** Login com usuario valido
- **Passos:** acessar `/auth`, informar credenciais, clicar em entrar
- **Resultado esperado:** redirecionar para `/home`
- **Resultado obtido:** ...
- **Status:** OK/NOK
- **Observacoes:** ...

---

Se quiser, no proximo passo eu tambem posso criar uma versao "matriz" (Funcao x Perfil x Resultado esperado) para o time marcar execucao em cada sprint.
