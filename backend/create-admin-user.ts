import { PrismaClient, AppRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@mergulho.com';
  const password = process.env.ADMIN_PASSWORD || '123456';
  const fullName = process.env.ADMIN_FULL_NAME || 'Administrador';
  const username = process.env.ADMIN_USERNAME || 'admin';
  const whatsappPhone = process.env.ADMIN_WHATSAPP_PHONE || null;
  const role = (process.env.ADMIN_ROLE || 'admin') as AppRole;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log(`Usuário com e-mail ${email} já existe. ID: ${existingUser.id}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      fullName,
      username,
      whatsappPhone,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      role: role as any,
    },
  });

  console.log('Usuário admin criado com sucesso!');
  console.log(`ID: ${user.id}`);
  console.log(`E-mail: ${email}`);
  console.log(`Senha: ${password}`);
}

main()
  .catch((error) => {
    console.error('Erro ao criar usuário admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
