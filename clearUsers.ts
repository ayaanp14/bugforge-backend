import { prisma } from './src/lib/prisma.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current users before wipe:', users.map(u => u.email));
  await prisma.user.deleteMany({});
  console.log('Deleted all users.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
