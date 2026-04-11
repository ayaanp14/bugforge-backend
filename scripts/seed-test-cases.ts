import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TestCaseData {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

const PROBLEM_DATA: Record<string, TestCaseData[]> = {
  "summary-ranges": [
    { input: "[0,1,2,4,5,7]", expectedOutput: '["0->2","4->5","7"]', isHidden: false },
    { input: "[0,2,3,4,6,8,9]", expectedOutput: '["0","2->4","6","8->9"]', isHidden: false },
    { input: "[]", expectedOutput: "[]", isHidden: true },
    { input: "[-1]", expectedOutput: '["-1"]', isHidden: true },
    { input: "[0,1,2,3,4,5]", expectedOutput: '["0->5"]', isHidden: true }
  ],
  "contains-duplicate": [
    { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
    { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
    { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: true },
    { input: "[]", expectedOutput: "false", isHidden: true },
    { input: "[1]", expectedOutput: "false", isHidden: true }
  ],
  "contains-duplicate-ii": [
    { input: "[1,2,3,1], k=3", expectedOutput: "true", isHidden: false },
    { input: "[1,0,1,1], k=1", expectedOutput: "true", isHidden: false },
    { input: "[1,2,3,1,2,3], k=2", expectedOutput: "false", isHidden: true },
    { input: "[], k=0", expectedOutput: "false", isHidden: true },
    { input: "[1,2], k=2", expectedOutput: "false", isHidden: true }
  ],
  "isomorphic-strings": [
    { input: 's="egg", t="add"', expectedOutput: "true", isHidden: false },
    { input: 's="foo", t="bar"', expectedOutput: "false", isHidden: false },
    { input: 's="paper", t="title"', expectedOutput: "true", isHidden: true },
    { input: 's="", t=""', expectedOutput: "true", isHidden: true },
    { input: 's="badc", t="baba"', expectedOutput: "false", isHidden: true }
  ],
  "two-sum": [
    { input: "nums=[2,7,11,15], target=9", expectedOutput: "[0,1]", isHidden: false },
    { input: "nums=[3,2,4], target=6", expectedOutput: "[1,2]", isHidden: false },
    { input: "nums=[3,3], target=6", expectedOutput: "[0,1]", isHidden: true },
    { input: "nums=[2,5,5,11], target=10", expectedOutput: "[1,2]", isHidden: true },
    { input: "nums=[-1,-2,-3,-4,-5], target=-8", expectedOutput: "[2,4]", isHidden: true }
  ]
};

async function main() {
  const problems = await prisma.problem.findMany({
    select: { id: true, title: true, slug: true }
  });

  console.log(`Found ${problems.length} problems to seed.`);

  for (const problem of problems) {
    console.log(`- Seeding: ${problem.title} (${problem.slug})`);

    // Reset existing test cases
    await prisma.testCase.deleteMany({ where: { problemId: problem.id } });

    const specificData = PROBLEM_DATA[problem.slug];

    if (specificData) {
      await prisma.testCase.createMany({
        data: specificData.map((tc, index) => ({
          problemId: problem.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden,
          orderIndex: index
        }))
      });
    } else {
      // Fallback for generic problems
      await prisma.testCase.createMany({
        data: [
          { problemId: problem.id, input: "Example Input 1", expectedOutput: "Example Output 1", isHidden: false, orderIndex: 0 },
          { problemId: problem.id, input: "Example Input 2", expectedOutput: "Example Output 2", isHidden: false, orderIndex: 1 },
          { problemId: problem.id, input: "Private Input 3", expectedOutput: "Private Output 3", isHidden: true, orderIndex: 2 },
          { problemId: problem.id, input: "Private Input 4", expectedOutput: "Private Output 4", isHidden: true, orderIndex: 3 },
          { problemId: problem.id, input: "Private Input 5", expectedOutput: "Private Output 5", isHidden: true, orderIndex: 4 }
        ]
      });
    }
  }

  console.log("\n✅ All test cases have been seeded successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Error seeding test cases:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
