import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.USER_EMAIL;
  const newPassword = process.env.NEW_PASSWORD;

  if (!email) {
    console.error('❌ Erro: USER_EMAIL não definido. Use: USER_EMAIL=email@exemplo.com npm run change-password');
    process.exit(1);
  }

  if (!newPassword) {
    console.error('❌ Erro: NEW_PASSWORD não definido. Use: NEW_PASSWORD=novaSenha npm run change-password');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('❌ Erro: A senha deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      console.error(`❌ Erro: Usuário com e-mail ${email} não encontrado.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Senha alterada com sucesso!');
    console.log(`👤 Usuário: ${user.profile?.fullName || 'N/A'} (${email})`);
    console.log(`🆔 ID: ${user.id}`);
    console.log('🔒 Nova senha definida.');

  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();