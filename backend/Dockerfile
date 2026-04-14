# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

# ffmpeg é necessário para conversão de áudio (OGG/Opus)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production=false

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: Produção ──────────────────────────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Copia apenas o build compilado
COPY --from=builder /app/dist ./dist

# Cria pasta uploads (arquivos temporários de mídia)
RUN mkdir -p uploads

# Variáveis de ambiente padrão (serão sobrescritas pelo Render)
ENV NODE_ENV=production
ENV PORT=3001
ENV TZ=America/Sao_Paulo

EXPOSE 3001

CMD ["node", "dist/index.js"]
