const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: 'Administrador', slug: 'admin' },
    { name: 'Líder', slug: 'lider' },
    { name: 'Membro', slug: 'membro' },
  ];

  for (const role of roles) {
    const existing = await prisma.group.findFirst({ where: { name: role.name } });
    if (!existing) {
      const created = await prisma.group.create({
        data: {
          name: role.name,
          description: `Grupo base para permissões de ${role.name}`,
          icon: 'shield'
        }
      });
      console.log(`Created group: ${role.name} with ID: ${created.id}`);
    } else {
      console.log(`Existing group: ${role.name} with ID: ${existing.id}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
