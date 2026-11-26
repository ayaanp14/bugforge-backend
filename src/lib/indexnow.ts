/**
 * Tells IndexNow (Bing, Yandex, Naver, Seznam) that a public page changed, so
 * it is recrawled within hours rather than whenever the engine next reads the
 * sitemap. Bing's index is also what ChatGPT's and Copilot's search read much
 * of the web through. Google does not take part and has no equivalent for
 * this kind of page (its sitemap ping was retired in 2023, its Indexing API
 * is for job postings and livestreams): it finds these through the sitemap.
 *
 * Only for pages that change one at a time from a member's action (interview
 * experiences, since 2026-11-04); a deploy that changes many pages runs
 * frontend/scripts/indexnow.mjs. Fire and forget: a failure costs a recrawl's
 * head start and nothing else, so it is logged and never retried or surfaced
 * to the member, and the route never waits on it.
 *
 * The key is public by design, not a secret: the engines fetch it from the
 * site to check the sender owns the host, so it must equal the file
 * frontend/public/<key>.txt.
 */
const KEY = "4e2e16d275b504affc636a9c0453ce32";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const TIMEOUT_MS = 5000;
const ORIGIN = (process.env["SITE_ORIGIN"] ?? "https://codekairo.com").replace(/\/+$/, "");

export function indexNowPayload(paths: readonly string[], origin = ORIGIN): { host: string; key: string; keyLocation: string; urlList: string[] } {
  return { host: new URL(origin).host, key: KEY, keyLocation: `${origin}/${KEY}.txt`, urlList: paths.map((p) => origin + p) };
}

/** Production only, and never when switched off: a dev server must never submit a local address. */
export const indexNowEnabled = (): boolean => process.env["NODE_ENV"] === "production" && process.env["INDEXNOW"] !== "off";

/** One request; the HTTP status, or 0 when it never got an answer. 200 and 202 are accepted. */
export async function submitToIndexNow(paths: readonly string[], timeoutMs = TIMEOUT_MS): Promise<number> {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(indexNowPayload(paths)),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.status;
  } catch (err) {
    console.warn("[indexnow] not sent:", err instanceof Error ? err.message : err);
    return 0;
  }
}

export function announceToSearchEngines(paths: readonly string[]): void {
  if (!indexNowEnabled() || !paths.length) return;
  void submitToIndexNow(paths).then((status) => {
    // A 4xx is the key or the host, worth seeing in the logs.
    if (status && status !== 200 && status !== 202) console.warn(`[indexnow] ${status} for ${paths.join(", ")}`);
  });
}

// ── The daily sitemap sweep (services/search-pings.ts) ─────────────────────
//
// Added 2026-11-26, when the owner turned to the AI assistants after Google's
// November core update halved the indexed pages. ChatGPT search and Copilot
// read the web largely through Bing's index, and Bing only learnt of a new
// problem, note or hunt whenever it next read the sitemap — the per-action
// ping above covered interview experiences alone, and the hand-run
// frontend/scripts/indexnow.mjs was run twice in two months. The sweep sends
// what is new or whose lastmod moved, and what left the sitemaps, once a day.

/** The protocol allows 10,000 URLs a request; one request a day keeps well inside any engine's patience. */
export const INDEXNOW_BATCH = 10_000;
/** The stored key's width (IndexNowPing.path); a longer address is not swept. */
export const PING_PATH_MAX = 191;

export interface SitemapEntry {
  path: string;
  /** yyyy-mm-dd, or "" when the sitemap gives none. */
  lastmod: string;
}

/** The `<url>` entries of one urlset, as site paths. Entries off `origin` are dropped. */
export function parseSitemap(xml: string, origin = ORIGIN): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const block of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const body = block[1] ?? "";
    const loc = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(body)?.[1]?.replace(/&amp;/g, "&");
    if (!loc || !loc.startsWith(origin)) continue;
    const path = loc.slice(origin.length) || "/";
    const lastmod = /<lastmod>\s*(\d{4}-\d{2}-\d{2})/.exec(body)?.[1] ?? "";
    out.push({ path, lastmod });
  }
  return out;
}

export interface PingPlan {
  /** Paths to send, new and changed first, then removed — at most `limit`. */
  send: string[];
  /** What the store should hold for each sent path still in the sitemaps. */
  upsert: SitemapEntry[];
  /** Sent paths that left the sitemaps: their rows go. */
  remove: string[];
  /** Due but over the limit: they go on the next run. */
  deferred: number;
}

/**
 * What to tell the engines, given today's sitemap entries and what was last
 * sent (path → lastmod). A page is due when it was never sent or its lastmod
 * moved; a page that left every sitemap is sent once more, so the engine
 * recrawls it and finds the 404 or the noindex, and is then forgotten.
 */
export function planPings(entries: readonly SitemapEntry[], sent: ReadonlyMap<string, string>, limit = INDEXNOW_BATCH): PingPlan {
  const today = new Map<string, string>();
  for (const e of entries) if (e.path.length <= PING_PATH_MAX && !today.has(e.path)) today.set(e.path, e.lastmod);
  const due: SitemapEntry[] = [];
  for (const [path, lastmod] of today) if (sent.get(path) !== lastmod) due.push({ path, lastmod });
  const gone = [...sent.keys()].filter((p) => !today.has(p));
  const upsert = due.slice(0, limit);
  const remove = gone.slice(0, Math.max(0, limit - upsert.length));
  return { send: [...upsert.map((e) => e.path), ...remove], upsert, remove, deferred: due.length + gone.length - upsert.length - remove.length };
}
