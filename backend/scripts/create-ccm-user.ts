import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@ccmergulho.com';
  const password = 'admin'; // Senha padrão: admin
  const fullName = 'Administrador CCM';

  console.log(`Configurando usuário admin master: ${email}...`);

  const hashedPassword = await bcrypt.hash(password, 10);

  // Busca ou cria o usuário
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: {
      email,
      password: hashedPassword,
    },
  });

  // Cria ou atualiza o perfil
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { fullName },
    create: {
      userId: user.id,
      fullName,
      username: 'admin',
    },
  });

  // Garante que o cargo seja admin_ccm (Master)
  await prisma.userRole.upsert({
    where: { userId: user.id },
    update: { role: 'admin_ccm' },
    create: {
      userId: user.id,
      role: 'admin_ccm',
    },
  });

  console.log('-----------------------------------------');
  console.log('✅ SUCESSO: Usuário configurado como admin_ccm!');
  console.log(`📧 E-mail: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log('-----------------------------------------');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao configurar usuário:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
