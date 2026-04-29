# 🚀 Deploy do Backend – Render.com

**Versão:** 1.0  
**Data:** 2026-04-14  
**Plataforma:** Render.com (Free Tier)

---

## Por que Render e não Vercel?

O backend usa **Baileys (WhatsApp)** + **node-cron** + **ffmpeg**, que exigem:
- ✅ **Processo Node.js contínuo** (não serverless)
- ✅ **Suporte a WebSockets** (conexão WhatsApp)
- ✅ **Execução de ffmpeg** para conversão de áudio

A Vercel é **serverless** (processo morre após cada request) — incompatível. O **Render.com** oferece um Web Service de processo contínuo gratuitamente.

---

## Arquitetura em Produção

```
[Render.com – Free Web Service]
  └── Docker container (Node.js + ffmpeg)
       └── Express API  →  /api/health, /api/whatsapp, /api/dispatches
       └── Baileys (WhatsApp)  →  sessão salva no Supabase Storage
       └── node-cron  →  verifica disparos agendados a cada minuto

[Supabase Storage]
  └── bucket: baileys-auth  (privado)
       └── session/creds.json  (credenciais do WhatsApp)
       └── session/*.json      (chaves Signal do Baileys)

[Vercel – Frontend]
  └── React/Vite  →  chama /api/* no Render
```

---

## Passo 1 – Criar o Bucket no Supabase Storage

> ⚠️ **Este passo é obrigatório antes do deploy.** Sem o bucket, o WhatsApp não conseguirá salvar a sessão.

1. Acesse o painel do Supabase → **Storage**
2. Clique em **New bucket**
3. Nome do bucket: **`baileys-auth`** (exatamente assim)
4. Marque como **Private** (não público)
5. Clique em **Create bucket**

Não precisa configurar RLS — o backend usa a `SERVICE_ROLE_KEY` que ignora RLS.

---

## Passo 2 – Criar a Conta e o Web Service no Render

1. Acesse [render.com](https://render.com) e clique em **Get Started for Free**
2. Faça login com **GitHub** (mesma conta do repositório)
3. No dashboard, clique em **New +** → **Web Service**
4. Selecione o repositório `mergulho-connect`
5. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `mergulho-backend` |
| **Region** | `Ohio (US East)` ou `São Paulo` (se disponível) |
| **Branch** | `main` (ou `developer` durante testes) |
| **Runtime** | **Docker** |
| **Dockerfile Path** | `./backend/Dockerfile` |
| **Docker Context** | `./backend` |
| **Instance Type** | **Free** |

---

## Passo 3 – Configurar as Variáveis de Ambiente no Render

No painel do Render → aba **Environment**, adicione:

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `TZ` | `America/Sao_Paulo` |
| `SUPABASE_URL` | `https://[seu-project-ref].supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (chave de serviço do Supabase) |
| `FRONTEND_URL` | `https://[seu-app].vercel.app` |

> 🔑 A `SUPABASE_SERVICE_ROLE_KEY` está em: **Supabase → Settings → API → service_role key**

---

## Passo 4 – Atualizar a URL do Backend no Frontend

Após o deploy, o Render fornecerá uma URL como:
```
https://mergulho-backend.onrender.com
```

Atualize a variável de ambiente do frontend na Vercel:

| Variável | Valor |
|----------|-------|
| `VITE_BACKEND_URL` | `https://mergulho-backend.onrender.com` |

> Se o frontend já usa `/api` via proxy do Vite (dev), em produção deve usar a URL completa do Render.

---

## Passo 5 – Deploy e Verificação

1. Clique em **Create Web Service** no Render
2. Aguarde o build do Docker (~3-5 minutos na primeira vez)
3. Verifique o health check:
   ```
   https://mergulho-backend.onrender.com/api/health
   ```
   Deve retornar: `{ "ok": true, "ts": "..." }`

---

## Passo 6 – Conectar o WhatsApp

1. Acesse o painel de administração da plataforma → módulo **WhatsApp**
2. Clique em **Conectar** — o QR Code será gerado
3. Escaneie com o WhatsApp do número que fará os disparos
4. A sessão será salva automaticamente no Supabase Storage (bucket `baileys-auth`)

> ✅ A partir deste ponto, mesmo que o container do Render reinicie, o WhatsApp reconectará automaticamente sem precisar escanear novamente.

---

## Limitações do Plano Gratuito do Render

| Limitação | Impacto |
|-----------|---------|
| **750h/mês de CPU grátis** | Suficiente para 1 serviço rodando 24/7 |
| **512MB RAM** | Suficiente para o backend atual |
| **Sleep por inatividade** | ⚠️ O serviço dorme após 15min sem requests |
| **Disco efêmero** | ✅ Resolvido — sessão está no Supabase Storage |
| **Cold start ~30s** | Após sleep, primeira request demora para responder |

### Como evitar o Sleep:

O Render free tier coloca o serviço para dormir após 15 minutos sem requests. Para manter acordado, use um serviço de ping gratuito:

- **[UptimeRobot](https://uptimerobot.com)** — gratuito, pinga a cada 5 minutos
  1. Crie uma conta gratuita
  2. Adicione monitor do tipo **HTTP(S)**
  3. URL: `https://mergulho-backend.onrender.com/api/health`
  4. Intervalo: **5 minutos**

---

## Atualizações Automáticas

Toda vez que você der `git push` para a branch configurada:
1. O Render detecta o push automaticamente
2. Faz rebuild do Docker
3. Faz deploy sem downtime (zero-downtime deploy)
4. O WhatsApp reconecta automaticamente via Supabase Storage

---

## Troubleshooting

### WhatsApp não conecta após restart
- Verifique se o bucket `baileys-auth` existe no Supabase e tem arquivos dentro
- Se estiver vazio, re-escaneie o QR Code na plataforma

### Erro de CORS
- Verifique se `FRONTEND_URL` está configurado corretamente no Render
- Deve ser a URL exata do Vercel (sem barra final)

### Build falha no Render
- Verifique se o `Dockerfile Path` está como `./backend/Dockerfile`
- Verifique se o `Docker Context` está como `./backend`

### Service sleeping (cold start)
- Configure o UptimeRobot conforme descrito acima
- O `/api/health` é leve e não afeta a sessão do WhatsApp
