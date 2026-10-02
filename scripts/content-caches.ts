/**
 * Tell the running API that seeded content changed.
 *
 *   await flushContentCaches("catalog");   // at the end of a successful --seed
 *
 * The API caches seeded content for 5 minutes to an hour (L1 + Redis), and
 * nothing a script wrote ever reached those caches: a reseed showed up when
 * each key's TTL ran out, and the Redis copies outlived an API redeploy. A
 * script runs against the same database and Redis as the API (locally, and
 * on the box through `docker compose run … api`), so it can delete the Redis
 * copies itself and broadcast on the invalidation channel the API already
 * listens to (lib/cache.ts) — the API then drops its in-memory copies too.
 *
 * Without REDIS_URL there is nothing shared to clear and no channel to reach
 * the API on; a local dev server picks the change up at its TTL (or restart).
 *
 * The families are prefixes, so they also clear keys a newer API version may
 * have added under the same family. Prefixes are deliberately whole segments
 * ("problem:" never matches "problem-state:…", which is per-user).
 */
import { invalidateAndWait } from "../src/lib/cache.js";
import { closeRedis } from "../src/lib/redis.js";
import { EVERY_JUDGE_SUITE, forgetJudgeSuite } from "../src/lib/test-suite-cache.js";

export type ContentKind = "catalog" | "bugs" | "aptitude" | "mock-tests" | "skill-tests" | "roadmap" | "study-plans";

const PLANS: Record<ContentKind, { keys: string[]; prefixes: string[] }> = {
  catalog: {
    keys: ["catalogue:published", "duels:published:problem", "problems:draw-pool:v1", "seo:problem-descriptions:v1"],
    prefixes: ["problem:", "duel-problem:", "seo:head:problem:", "seo:sitemap:", "contest:daily:"],
  },
  bugs: {
    keys: ["bug-insights", "duels:published:bug"],
    prefixes: ["bug:", "seo:head:bug:", "seo:sitemap:"],
  },
  aptitude: {
    keys: ["seo:aptitude:counts", "problems:draw-pool:v1"],
    prefixes: ["aptitude:", "seo:head:aptitude", "seo:sitemap:"],
  },
  "mock-tests": {
    keys: ["hubs:patterns:v1"],
    prefixes: ["mock:", "tests:samples:", "seo:head:test:", "seo:sitemap:"],
  },
  "skill-tests": {
    keys: [],
    prefixes: ["skill:", "seo:head:skill-test:", "seo:sitemap:"],
  },
  roadmap: {
    // The assistant's briefing quotes the road (one section per tier).
    keys: ["assistant:briefing:v2"],
    prefixes: ["roadmap:", "seo:sitemap:"],
  },
  "study-plans": {
    keys: [],
    prefixes: ["study:", "seo:sitemap:"],
  },
};

/** Clear what `kinds` of seeded content the API holds. Never throws: a failed flush only means waiting out the TTLs. */
export async function flushContentCaches(...kinds: ContentKind[]): Promise<void> {
  if (!process.env["REDIS_URL"]) {
    console.log("[caches] REDIS_URL not set — the API picks the change up when its caches expire");
    return;
  }
  const keys = [...new Set(kinds.flatMap((k) => PLANS[k].keys))];
  const prefixes = [...new Set(kinds.flatMap((k) => PLANS[k].prefixes))];
  try {
    await invalidateAndWait(keys, prefixes);
    // The judge's copy of every suite lives outside the key/value cache.
    if (kinds.includes("catalog")) forgetJudgeSuite(EVERY_JUDGE_SUITE);
    console.log(`[caches] cleared ${kinds.join(", ")}: ${keys.length} keys, ${prefixes.length} families`);
  } catch (err) {
    console.warn("[caches] could not clear the API's caches:", (err as Error).message);
  } finally {
    await closeRedis();
  }
}
