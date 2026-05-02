import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = 'admin@mergulho.com';
  const newEmail = 'admin@ccmergulho.com';

  const user = await prisma.user.findUnique({ where: { email: oldEmail } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail }
    });
    console.log(`✅ Email atualizado de ${oldEmail} para ${newEmail}`);
  } else {
    // Check if new email already exists
    const newUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (newUser) {
      console.log(`ℹ️ Usuário ${newEmail} já existe.`);
    } else {
      console.log(`❌ Usuário ${oldEmail} não encontrado.`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
