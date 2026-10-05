/**
 * Writes the company tags of scripts/catalog/company-coverage.ts to a
 * database that already holds the problems — only `Problem.tags`, nothing
 * else: re-seeding the whole catalogue would rewrite ~5,000 hidden cases a
 * problem to add a word to its tags.
 *
 *   npx tsx scripts/apply-company-coverage.ts            # dry run: what would change
 *   npx tsx scripts/apply-company-coverage.ts --apply    # write it
 *
 * Idempotent: a tag already present is left alone, and the stored order of
 * the existing tags is kept (the companies are appended). A slug the
 * database does not hold is reported and skipped. With REDIS_URL set, the
 * catalogue and each changed problem are invalidated on every API instance
 * (lib/cache broadcasts the invalidation); without it the API's 2- and
 * 10-minute caches pick the tags up on their own.
 */
import { prisma } from "../src/lib/prisma.js";
import { invalidateAndWait } from "../src/lib/cache.js";
import { COMPANY_COVERAGE } from "./catalog/company-coverage.js";

const apply = process.argv.includes("--apply");

const wanted = new Map<string, string[]>();
for (const [company, slugs] of Object.entries(COMPANY_COVERAGE)) {
  for (const slug of slugs) wanted.set(slug, [...(wanted.get(slug) ?? []), company]);
}

const rows = await prisma.problem.findMany({ where: { slug: { in: [...wanted.keys()] } }, select: { id: true, slug: true, tags: true } });
const bySlug = new Map(rows.map((r) => [r.slug, r]));
const touched: string[] = [];
let changed = 0;
let tagsAdded = 0;
const missing: string[] = [];
for (const [slug, companies] of wanted) {
  const row = bySlug.get(slug);
  if (!row) {
    missing.push(slug);
    continue;
  }
  const tags = Array.isArray(row.tags) ? (row.tags as unknown[]).filter((t): t is string => typeof t === "string") : [];
  const add = companies.filter((c) => !tags.includes(c));
  if (!add.length) continue;
  changed++;
  tagsAdded += add.length;
  if (apply) {
    await prisma.problem.update({ where: { id: row.id }, data: { tags: [...tags, ...add] } });
    touched.push(`problem:v3:${slug}`);
  }
}
// A script exits right after; invalidateAndWait connects and waits so the
// running API instances actually receive the invalidations (lib/cache.ts).
if (apply && changed) await invalidateAndWait([...touched, "catalogue:published", "duels:published:problem", "problems:draw-pool:v1"]);
console.log(`${apply ? "Updated" : "Would update"} ${changed} problem${changed === 1 ? "" : "s"} (+${tagsAdded} company tags).`);
if (missing.length) console.log(`Not in this database (skipped): ${missing.join(", ")}`);
if (!apply) console.log("Dry run — pass --apply to write.");
await prisma.$disconnect();
process.exit(0);
