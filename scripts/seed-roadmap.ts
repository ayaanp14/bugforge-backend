/**
 * Seeds the DSA roadmap.
 *
 *   npx tsx scripts/seed-roadmap.ts --validate
 *   npx tsx scripts/seed-roadmap.ts --seed [--prune]
 *
 * --validate checks scripts/roadmap-data.ts on its own terms (keys, tiers,
 * `required`, no slug in two stages) and then against the catalogue: every
 * slug must be a published problem. A stage that quietly lost a problem is
 * the failure this exists to catch before it reaches a learner.
 *
 * --seed upserts the tiers and stages by key and replaces each stage's
 * problem list, so editing the data and re-running is safe; positions are
 * renumbered from the file's order. Nothing about progress lives in these
 * tables (it is derived from submissions), so a re-seed never touches what
 * anyone has cleared. --prune also removes stages and tiers the file no
 * longer names.
 */
import { prisma } from "../src/lib/prisma.js";
import { ROADMAP, ROADMAP_TIERS, validateRoadmap } from "./roadmap-data.js";

const mode = process.argv.includes("--seed") ? "seed" : "validate";
const prune = process.argv.includes("--prune");

async function main() {
  const slugs = validateRoadmap();
  const rows = await prisma.problem.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, isPublished: true, difficulty: true } });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  const unpublished = slugs.filter((s) => bySlug.get(s) && !bySlug.get(s)!.isPublished);

  console.log(`${ROADMAP_TIERS.length} tiers · ${ROADMAP.length} stages · ${slugs.length} problems`);
  console.log(`  chests: ${ROADMAP_TIERS.map((t) => `${t.key} +${t.rewardXp} XP, ${t.interviewCredits} interview${t.interviewCredits === 1 ? "" : "s"}`).join(" · ")}`);
  for (const stage of ROADMAP) {
    const ramp = stage.problems.map((p) => bySlug.get(p)?.difficulty?.[0] ?? "?").join("");
    console.log(`  ${stage.key.padEnd(16)} ${ramp}  ${stage.required} of ${stage.problems.length} to clear`);
  }
  if (missing.length) console.error(`\nMISSING from the catalogue: ${missing.join(", ")}`);
  if (unpublished.length) console.error(`\nUNPUBLISHED: ${unpublished.join(", ")}`);
  if (missing.length || unpublished.length) {
    process.exitCode = 1;
    return;
  }
  console.log("\nEvery slug is a published problem.");
  if (mode !== "seed") return;

  // Tiers first: stages point at them.
  const tierIds = new Map<string, string>();
  for (const [position, tier] of ROADMAP_TIERS.entries()) {
    const row = await prisma.roadmapTier.upsert({
      where: { key: tier.key },
      create: { key: tier.key, title: tier.title, blurb: tier.blurb, position, rewardXp: tier.rewardXp, interviewCredits: tier.interviewCredits },
      update: { title: tier.title, blurb: tier.blurb, position, rewardXp: tier.rewardXp, interviewCredits: tier.interviewCredits },
      select: { id: true },
    });
    tierIds.set(tier.key, row.id);
  }

  for (const [position, stage] of ROADMAP.entries()) {
    const tierId = tierIds.get(stage.tier)!;
    const row = await prisma.roadmapStage.upsert({
      where: { key: stage.key },
      create: { key: stage.key, title: stage.title, blurb: stage.blurb, icon: stage.icon, position, required: stage.required, tierId, isPublished: true },
      update: { title: stage.title, blurb: stage.blurb, icon: stage.icon, position, required: stage.required, tierId },
      select: { id: true },
    });
    // The list is replaced wholesale: a problem moved between stages must
    // leave the old one (problemId is unique across the road) before it
    // can be written to the new one, so both stages' rows go first.
    await prisma.$transaction([
      prisma.roadmapStageProblem.deleteMany({ where: { OR: [{ stageId: row.id }, { problemId: { in: stage.problems.map((s) => bySlug.get(s)!.id) } }] } }),
      prisma.roadmapStageProblem.createMany({
        data: stage.problems.map((slug, index) => ({ stageId: row.id, problemId: bySlug.get(slug)!.id, position: index })),
      }),
    ]);
  }
  console.log(`Seeded ${ROADMAP_TIERS.length} tiers and ${ROADMAP.length} stages.`);

  if (prune) {
    const stages = await prisma.roadmapStage.deleteMany({ where: { key: { notIn: ROADMAP.map((s) => s.key) } } });
    const tiers = await prisma.roadmapTier.deleteMany({ where: { key: { notIn: ROADMAP_TIERS.map((t) => t.key) } } });
    console.log(`Pruned ${stages.count} stage(s) and ${tiers.count} tier(s) the file no longer names.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
