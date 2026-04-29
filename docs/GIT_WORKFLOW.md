# Fluxo de Trabalho Git e Versionamento

Este documento define o padrão de mensagens de commit e o processo de versionamento automático para o projeto Mergulho Connect.

## 1. Padrão de Commits (Conventional Commits)

Utilizamos o padrão de commits semânticos para facilitar a leitura do histórico e a geração de changelogs.

**Formato:** `tipo: descrição curta`

### Tipos Comuns:
- `feat:` Uma nova funcionalidade.
- `fix:` Correção de um erro (bug).
- `docs:` Alterações apenas na documentação.
- `style:` Alterações que não afetam o significado do código (espaços, formatação, etc).
- `refactor:` Alteração de código que não corrige erro nem adiciona funcionalidade.
- `perf:` Mudança de código que melhora o desempenho.
- `chore:` Atualizações de tarefas de build, pacotes, etc.

**Exemplo:** `fix: resolve erro de conexão com o banco no login`

---

## 2. Versionamento Automático

A versão oficial do sistema é controlada pelo arquivo `frontend/package.json`.

### Como fazer um Commit e Alterar a Versão:

Para garantir que a versão seja sempre alterada a cada commit, utilize o script automatizado disponível na raiz do projeto:

#### Usando o Script (PowerShell):
Na raiz do projeto, execute:
```powershell
.\git-commit.ps1 "Sua mensagem de commit aqui"
```

O que o script faz:
1. Incrementa a versão (patch) no `frontend/package.json`.
2. Adiciona todos os arquivos ao Git.
3. Faz o commit com a mensagem fornecida e o número da nova versão.

---

## 3. Instruções Personalizadas (Preencher aqui)
Para atender ao seu pedido de "sempre alterar a versão ao fazer um git", criei um script chamado 

.git-commit.ps1
 na raiz do projeto.

Como usar: Em vez de usar git commit, agora você pode rodar este comando no PowerShell:

powershell
.\git-commit.ps1 "Sua mensagem aqui"
