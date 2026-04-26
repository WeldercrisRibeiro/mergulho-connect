# Scripts de Gerenciamento de Usuários

Este documento contém scripts para criar usuários administradores e alterar senhas no Mergulho Connect.

## 🔧 Criar Usuário Admin

### Como usar

#### Método 1: Via npm (recomendado - TypeScript)
```bash
cd backend
npm run create-admin
```

#### Método 2: Via npm (JavaScript compilado)
```bash
cd backend
npm run create-admin:js
```

#### Método 3: Via ts-node diretamente
```bash
cd backend
npx ts-node create-admin-user.ts
```

#### Método 4: Via node diretamente
```bash
cd backend
node create-admin-user.js
```

## 🔑 Alterar Senha de Usuário

### Como usar

#### Método 1: Via npm (recomendado - TypeScript)
```bash
cd backend
USER_EMAIL="usuario@exemplo.com" NEW_PASSWORD="novaSenha123" npm run change-password
```

#### Método 2: Via npm (JavaScript compilado)
```bash
cd backend
USER_EMAIL="usuario@exemplo.com" NEW_PASSWORD="novaSenha123" npm run change-password:js
```

#### Método 3: Via ts-node diretamente
```bash
cd backend
USER_EMAIL="usuario@exemplo.com" NEW_PASSWORD="novaSenha123" npx ts-node change-password.ts
```

#### Método 4: Via node diretamente
```bash
cd backend
USER_EMAIL="usuario@exemplo.com" NEW_PASSWORD="novaSenha123" node change-password.js
```

### Exemplo prático (Windows PowerShell):
```powershell
cd backend
$env:USER_EMAIL="admin@mergulho.com"
$env:NEW_PASSWORD="minhaNovaSenhaSegura123"
npm run change-password
```

### Exemplo prático (Linux/Mac):
```bash
cd backend
USER_EMAIL="admin@mergulho.com" NEW_PASSWORD="minhaNovaSenhaSegura123" npm run change-password
```

## 📋 Valores padrão (Criar Admin)

- **E-mail**: `admin@mergulho.com`
- **Senha**: `123456`
- **Nome completo**: `Administrador`
- **Username**: `admin`
- **Role**: `admin`

## Personalização via variáveis de ambiente (Criar Admin)

Você pode personalizar os dados do admin definindo variáveis de ambiente:

```bash
# Windows PowerShell
$env:ADMIN_EMAIL="admin@meudominio.com"
$env:ADMIN_PASSWORD="minhaSenhaSegura"
$env:ADMIN_FULL_NAME="Nome do Admin"
$env:ADMIN_USERNAME="admin_user"
$env:ADMIN_WHATSAPP_PHONE="+5511999999999"
$env:ADMIN_ROLE="admin_ccm"

# Linux/Mac
export ADMIN_EMAIL="admin@meudominio.com"
export ADMIN_PASSWORD="minhaSenhaSegura"
export ADMIN_FULL_NAME="Nome do Admin"
export ADMIN_USERNAME="admin_user"
export ADMIN_WHATSAPP_PHONE="+5511999999999"
export ADMIN_ROLE="admin_ccm"

# Depois execute o script
npm run create-admin
```

## Roles disponíveis

- `admin` - Administrador completo
- `admin_ccm` - Administrador da CCM
- `gerente` - Gerente
- `pastor` - Pastor
- `membro` - Membro comum

## Validações (Alterar Senha)

- **E-mail obrigatório**: Deve existir no sistema
- **Senha obrigatória**: Mínimo 6 caracteres
- **Usuário deve existir**: Caso contrário, retorna erro

## Segurança

⚠️ **Importante**:
- Altere a senha padrão após o primeiro login!
- Os scripts verificam se já existe um usuário com o e-mail especificado (não cria duplicatas)
- Senhas são criptografadas com bcrypt (10 rounds)
- Use senhas fortes com pelo menos 8 caracteres

## Arquivos criados

- `create-admin-user.ts` - Script TypeScript para criar admin
- `create-admin-user.js` - Versão JavaScript compilada
- `change-password.ts` - Script TypeScript para alterar senha
- `change-password.js` - Versão JavaScript compilada
- `CREATE_ADMIN_README.md` - Esta documentação

## 📋 Valores padrão (Criar Admin)

## Valores padrão

- **E-mail**: `admin@mergulho.com`
- **Senha**: `123456`
- **Nome completo**: `Administrador`
- **Username**: `admin`
- **Role**: `admin`

## Personalização via variáveis de ambiente

Você pode personalizar os dados do admin definindo variáveis de ambiente:

```bash
# Windows PowerShell
$env:ADMIN_EMAIL="admin@meudominio.com"
$env:ADMIN_PASSWORD="minhaSenhaSegura"
$env:ADMIN_FULL_NAME="Nome do Admin"
$env:ADMIN_USERNAME="admin_user"
$env:ADMIN_WHATSAPP_PHONE="+5511999999999"
$env:ADMIN_ROLE="admin_ccm"

# Linux/Mac
export ADMIN_EMAIL="admin@meudominio.com"
export ADMIN_PASSWORD="minhaSenhaSegura"
export ADMIN_FULL_NAME="Nome do Admin"
export ADMIN_USERNAME="admin_user"
export ADMIN_WHATSAPP_PHONE="+5511999999999"
export ADMIN_ROLE="admin_ccm"

# Depois execute o script
npm run create-admin
```

## Roles disponíveis

- `admin` - Administrador completo
- `admin_ccm` - Administrador da CCM
- `gerente` - Gerente
- `pastor` - Pastor
- `membro` - Membro comum

## Segurança

⚠️ **Importante**: Altere a senha padrão após o primeiro login!

O script verifica se já existe um usuário com o e-mail especificado e não cria duplicatas.