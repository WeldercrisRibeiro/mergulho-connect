const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'mergulho-connect';
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

async function uploadFile(localPath, fileName) {
  const fileBuffer = fs.readFileSync(localPath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, fileBuffer, {
      upsert: true,
      contentType: 'image/jpeg' // Default, will be improved if needed
    });

  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

async function migrate() {
  console.log('🚀 Iniciando migração de imagens para Supabase...');

  // 1. Perfil (Avatares)
  const profiles = await prisma.profile.findMany({
    where: {
      avatarUrl: {
        not: null,
        startsWith: 'api/uploads' // Filter those that look like local paths
      }
    }
  });
  
  console.log(`Encontrados ${profiles.length} perfis com avatares locais.`);
  
  for (const profile of profiles) {
    try {
      const fileName = profile.avatarUrl.split('/').pop();
      const localPath = path.join(UPLOADS_DIR, fileName);
      
      if (fs.existsSync(localPath)) {
        const publicUrl = await uploadFile(localPath, fileName);
        await prisma.profile.update({
          where: { id: profile.id },
          data: { avatarUrl: publicUrl }
        });
        console.log(`✅ Avatar migrado para ${profile.fullName}: ${publicUrl}`);
      } else {
        console.warn(`⚠️ Arquivo não encontrado localmente: ${localPath}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao migrar avatar de ${profile.fullName}:`, err.message);
    }
  }

  // 2. Landing Photos
  const photos = await prisma.landingPhoto.findMany({
    where: {
      url: {
        contains: 'uploads'
      }
    }
  });

  console.log(`Encontradas ${photos.length} fotos da landing page locais.`);

  for (const photo of photos) {
    try {
      const fileName = photo.url.split('/').pop();
      const localPath = path.join(UPLOADS_DIR, fileName);

      if (fs.existsSync(localPath)) {
        const publicUrl = await uploadFile(localPath, fileName);
        await prisma.landingPhoto.update({
          where: { id: photo.id },
          data: { url: publicUrl }
        });
        console.log(`✅ Foto migrada: ${publicUrl}`);
      } else {
        console.warn(`⚠️ Arquivo não encontrado localmente: ${localPath}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao migrar foto ${photo.id}:`, err.message);
    }
  }

  // 3. Eventos (Banners)
  const events = await prisma.event.findMany({
    where: {
      bannerUrl: {
        contains: 'uploads'
      }
    }
  });

  console.log(`Encontrados ${events.length} eventos com banners locais.`);

  for (const event of events) {
    try {
      const fileName = event.bannerUrl.split('/').pop();
      const localPath = path.join(UPLOADS_DIR, fileName);

      if (fs.existsSync(localPath)) {
        const publicUrl = await uploadFile(localPath, fileName);
        await prisma.event.update({
          where: { id: event.id },
          data: { bannerUrl: publicUrl }
        });
        console.log(`✅ Banner migrado para ${event.title}: ${publicUrl}`);
      } else {
        console.warn(`⚠️ Arquivo não encontrado localmente: ${localPath}`);
      }
    } catch (err) {
      console.error(`❌ Erro ao migrar banner do evento ${event.title}:`, err.message);
    }
  }

  console.log('🏁 Migração concluída!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
