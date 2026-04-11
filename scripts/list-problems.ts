import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const problems = await prisma.problem.findMany({
    select: { id: true, title: true, slug: true }
  });
  console.log(JSON.stringify(problems, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
