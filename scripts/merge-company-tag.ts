/**
 * Renames a company tag on every problem that carries it, per
 * COMPANY_RENAMED in src/lib/companies.ts ("Facebook" → "Meta"): the old
 * name is replaced by the new one in Problem.tags, and dropped instead where
 * the problem already has the new one.
 *
 *   npx tsx scripts/merge-company-tag.ts            # report what would change
 *   npx tsx scripts/merge-company-tag.ts --apply    # write the tags
 *
 * Run once per database; re-running is harmless (nothing carries the old
 * name any more). scripts/catalog already uses the new names, so a later
 * seed does not bring the old one back. The catalogue cache (two minutes)
 * and each problem's cached payload (ten) pick the change up on their own.
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { COMPANY_RENAMED } from "../src/lib/companies.js";

const apply = process.argv.includes("--apply");

async function main() {
  for (const [from, to] of Object.entries(COMPANY_RENAMED)) {
    const rows = await prisma.problem.findMany({ where: { tags: { array_contains: [from] } }, select: { id: true, slug: true, tags: true } });
    console.log(`${rows.length} problem(s) tagged "${from}"`);
    for (const row of rows) {
      const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
      const next = tags.includes(to) ? tags.filter((t) => t !== from) : tags.map((t) => (t === from ? to : t));
      console.log(`${apply ? "set" : "would set"} ${row.slug}: ${JSON.stringify(tags)} → ${JSON.stringify(next)}`);
      if (apply) await prisma.problem.update({ where: { id: row.id }, data: { tags: next } });
    }
  }
  if (!apply) console.log("\nDry run. Add --apply to write.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
