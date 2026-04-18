import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'welder@ccmergulho.com';
  const plainPassword = '123';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      profile: {
        create: {
          fullName: 'Welder (Admin)',
        }
      },
      userRole: {
        create: {
          role: 'admin'
        }
      }
    }
  });

  console.log('User created:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
