/**
 * Real pages on codekairo.com a video can send people to. Claude used to guess a
 * practice path and fell back to /challenges when unsure, so the Container With
 * Most Water video (2026-11-09) linked the catalogue while
 * /problems/container-with-most-water existed. Now it picks from the site's own
 * sitemaps: the pages whose address shares words with the topic.
 */
export const SITE = "https://codekairo.com";

/** The sitemaps worth linking from a video: problems, hubs, lessons, notes, SQL, aptitude. */
const SITEMAPS = ["problems", "categories", "roadmap", "notes", "sql", "aptitude"];

/** Always offered: the pages any video can point at. */
const CORE = ["/challenges", "/roadmap", "/notes", "/sql", "/aptitude", "/mock-interview", "/tests"];

const STOP = new Set(["a", "an", "the", "and", "or", "of", "in", "on", "to", "for", "with", "how", "what", "why", "explain", "explained", "vs", "is", "it", "problem", "leetcode"]);
const words = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)));

let cache: string[] | null = null;

async function allPaths(): Promise<string[]> {
  if (cache) return cache;
  const lists = await Promise.all(
    SITEMAPS.map((name) =>
      fetch(`${SITE}/sitemaps/${name}.xml`)
        .then((r) => (r.ok ? r.text() : ""))
        .catch(() => ""),
    ),
  );
  cache = [...new Set(lists.flatMap((xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(SITE, ""))))];
  return cache;
}

/**
 * Up to `limit` real paths for the topic, best first: the share of the path's words
 * the topic names, with a problem page ahead of a hub on a tie. Then the core pages.
 */
export async function candidatePages(topic: string, limit = 30): Promise<string[]> {
  const want = words(topic);
  const scored = (await allPaths())
    .map((p) => {
      const have = words(p.split("/").slice(2).join(" ") || p);
      const hits = [...have].filter((w) => want.has(w)).length;
      return { p, score: hits ? hits / have.size + hits + (p.startsWith("/problems/") ? 0.1 : 0) : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
  return [...scored, ...CORE.filter((c) => !scored.includes(c))];
}

/** A path as a full URL if the site answers it, else the fallback (null for none). */
export async function livePage(path: string, fallback: string | null): Promise<string | null> {
  const wanted = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (!wanted || wanted === "/") return fallback;
  const good = await fetch(SITE + wanted, { redirect: "follow" }).then((r) => r.ok).catch(() => false);
  return good ? SITE + wanted : fallback;
}
