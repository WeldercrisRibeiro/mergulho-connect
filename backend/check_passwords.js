const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS PASSWORDS:');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Password Hash starts with: ${u.password.substring(0, 10)}...`);
    console.log('---');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
