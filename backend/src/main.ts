import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .replace(/["]/g, '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  console.log('🔒 CORS Origins permitidas:', corsOrigins.length > 0 ? corsOrigins : 'TODAS (Dev mode)');

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: (origin, callback) => {
      // Em desenvolvimento, permite tudo
      if (!origin || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Adicionando a URL da Vercel explicitamente para garantir que não dê erro de CORS
      const allowedOrigins = [
        ...corsOrigins,
        'https://ccmmanager.vercel.app',
        'https://mergulho-connect.vercel.app' // caso tenha outro frontend
      ];

      const isAllowed = allowedOrigins.includes(origin);
      if (!isAllowed) {
        console.warn(`⚠️ CORS bloqueado para a origem: ${origin}`);
      }
      return callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  // ─── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Static uploads ───────────────────────────────────────────────────────
  const uploadsDir = process.env.UPLOADS_DIR || './uploads';
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), uploadsDir), {
    prefix: '/api/uploads',
  });

  // ─── Prefix global ────────────────────────────────────────────────────────
  // DEVE ser definido ANTES do Swagger para que os paths sejam gerados corretamente
  app.setGlobalPrefix('api');

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Mergulho Connect API')
    .setDescription('Backend NestJS completo — Prisma + PostgreSQL + Baileys')
    .setVersion('1.0')
    .addServer(`http://localhost:${process.env.PORT || 3001}/api`, 'Local (com prefixo /api)')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API rodando em: http://localhost:${port}/api`);
  console.log(`📚 Swagger em:     http://localhost:${port}/docs`);
}

bootstrap();
