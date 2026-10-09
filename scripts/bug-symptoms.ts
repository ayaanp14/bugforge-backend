/**
 * Records what each published hunt's shipped build does on its visible tests
 * (BugChallenge.symptoms — the incident's "failing checks", Phase 6), for
 * every hunt that has none yet. The API also does this by itself the first
 * time a hunt is read without them (services/bug-coach.ts ensureSymptoms);
 * this fills the whole catalogue at once, so the edge's article for every
 * hunt carries its failing checks from the start. One engine run per hunt,
 * one at a time. Idempotent: a hunt with symptoms is skipped.
 *
 *   npx tsx scripts/bug-symptoms.ts            # dry run: how many need it
 *   npx tsx scripts/bug-symptoms.ts --apply    # run them
 *   npx tsx scripts/bug-symptoms.ts --apply --redo   # run every hunt again
 */
import "dotenv/config";
process.env["TELEMETRY_DISABLED"] = "true";
const { prisma } = await import("../src/lib/prisma.js");
const { fillSymptoms } = await import("../src/services/bug-coach.js");
const { Prisma } = await import("@prisma/client");

const apply = process.argv.includes("--apply");
const redo = process.argv.includes("--redo");
const rows = await prisma.bugChallenge.findMany({
  where: { isPublished: true, ...(redo ? {} : { symptoms: { equals: Prisma.DbNull } }) },
  select: { id: true, title: true },
  orderBy: { createdAt: "asc" },
});
console.log(`${rows.length} hunt(s) ${redo ? "to run again" : "without symptoms"}${apply ? "" : " (dry run — pass --apply)"}`);
if (apply) {
  if (redo) await prisma.bugChallenge.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { symptoms: Prisma.DbNull } });
  let done = 0;
  for (const r of rows) {
    try {
      await fillSymptoms(r.id);
      done++;
    } catch (err) {
      console.error(`  ${r.title}: ${(err as Error).message}`);
    }
    if (done % 20 === 0) console.log(`  ${done}/${rows.length}`);
  }
  console.log(`recorded ${done}/${rows.length}`);
}
await prisma.$disconnect();
