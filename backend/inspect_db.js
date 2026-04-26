const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.group.findMany();
  console.log('GROUPS:');
  groups.forEach(g => console.log(`${g.id} - ${g.name}`));
  
  const routines = await prisma.groupRoutine.findMany();
  console.log('\nROUTINES:');
  routines.forEach(r => console.log(`${r.groupId} - ${r.routineKey}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
