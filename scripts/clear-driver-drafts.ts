/**
 * One-time migration when driver templates change: deletes saved code drafts
 * in "driver languages" (everything except javascript/python). With server-side
 * driver application, drafts hold only solution stubs — but drafts saved under
 * OLD full-driver starters would double-wrap or mis-judge, so clear them.
 *
 * javascript/python drafts are untouched — their harness is applied
 * server-side, so old drafts still work.
 *
 *   npx tsx scripts/clear-driver-drafts.ts --run
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

(async () => {
  if (!process.argv.includes("--run")) {
    const count = await prisma.codeDraft.count({
      where: { language: { notIn: ["javascript", "python"] } },
    });
    console.log(`${count} driver-language drafts would be deleted. Pass --run to do it.`);
  } else {
    const result = await prisma.codeDraft.deleteMany({
      where: { language: { notIn: ["javascript", "python"] } },
    });
    console.log(`deleted ${result.count} stale driver-language drafts`);
  }
  await prisma.$disconnect();
})();
