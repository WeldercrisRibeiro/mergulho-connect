param (
    [Parameter(Mandatory=$true)]
    [string]$Message
)
# Para atender ao seu pedido de "sempre alterar a versão ao fazer um git", criei um script chamado 
# git-commit.ps1 na raiz do projeto.

# Como usar: Em vez de usar git commit, agora você pode rodar este comando no PowerShell:
#
#   powershell
#       .\git-commit.ps1 "Sua mensagem aqui"

# 1. Incrementar versão no frontend (sem criar tag git ainda)
Write-Host "Incrementando versão no frontend..." -ForegroundColor Cyan
Set-Location frontend
$newVersion = (npm version patch --no-git-tag-version).Trim()
Set-Location ..

# 2. Adicionar arquivos
Write-Host "Adicionando arquivos ao Git..." -ForegroundColor Cyan
git add .

# 3. Commit com a nova versão
Write-Host "Realizando commit: ${newVersion} - $Message" -ForegroundColor Green
git commit -m "${newVersion}: $Message"
git push origin main

Write-Host "Pronto! Versão atualizada e commit realizado." -ForegroundColor Yellow
