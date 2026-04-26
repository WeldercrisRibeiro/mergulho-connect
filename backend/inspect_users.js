const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      userRole: true,
      profile: true
    }
  });
  console.log('USERS AND ROLES:');
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`Role: ${u.userRole?.role || 'NONE'}`);
    console.log(`Name: ${u.profile?.fullName || 'NONE'}`);
    console.log('---');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
