/**
 * Gives every bug hunt that has none a public slug (/bug-hunts/<slug>),
 * derived from its title exactly as scripts/seed-bugs.ts does for new rows.
 *
 *   npx tsx scripts/backfill-bug-slugs.ts            # report what would change
 *   npx tsx scripts/backfill-bug-slugs.ts --apply    # write the slugs
 *   node scripts/run-prod.mjs scripts/backfill-bug-slugs.ts --apply
 *
 * Run once per database after `prisma db push` adds the column; re-running
 * is harmless (rows with a slug are left alone). Until it has run, the
 * hunts stay reachable by id and the sitemap lists the id addresses.
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { uniqueSlug } from "../src/lib/slug.js";
import { BUG_HUB_IDS } from "../src/lib/bug-hubs.js";

const apply = process.argv.includes("--apply");

async function main() {
  const rows = await prisma.bugChallenge.findMany({ where: { slug: null }, select: { id: true, title: true }, orderBy: { createdAt: "asc" } });
  console.log(`${rows.length} bug hunt(s) without a slug`);
  const taken = new Set((await prisma.bugChallenge.findMany({ where: { NOT: { slug: null } }, select: { slug: true } })).map((r) => r.slug!));
  for (const row of rows) {
    const slug = await uniqueSlug(row.title, async (candidate) => taken.has(candidate), BUG_HUB_IDS);
    taken.add(slug);
    console.log(`${apply ? "set" : "would set"} ${row.id} → /bug-hunts/${slug}  (${row.title})`);
    if (apply) await prisma.bugChallenge.update({ where: { id: row.id }, data: { slug } });
  }
  if (!apply && rows.length) console.log("\nDry run. Add --apply to write.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
