# Maintenance Portal

Painel administrativo independente para manutenção do Mergulho Connect.

## Requisitos

- Node.js 20+
- Backend API NestJS acessível via HTTP/HTTPS

## Configuração

1. Copie `.env.example` para `.env.local`
2. Defina a URL da API:

```env
VITE_API_URL=http://localhost:3001/api
```

Para backend externo:

```env
VITE_API_URL=https://api.seudominio.com/api
```

## Executar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Diagnóstico de login

- A tela de login exibe a `API ativa`.
- A rota esperada para autenticação é:
  - `POST {VITE_API_URL}/auth/login`
- Se usar backend externo, configure CORS no backend para permitir o domínio do portal.
