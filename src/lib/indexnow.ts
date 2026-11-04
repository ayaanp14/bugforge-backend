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

/** Production only: a dev server must never submit a local post's address. */
export function announceToSearchEngines(paths: readonly string[]): void {
  if (process.env["NODE_ENV"] !== "production" || process.env["INDEXNOW"] === "off" || !paths.length) return;
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(indexNowPayload(paths)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
    .then((res) => {
      // 200 and 202 are accepted; a 4xx is the key or the host, worth seeing in the logs.
      if (!res.ok) console.warn(`[indexnow] ${res.status} for ${paths.join(", ")}`);
    })
    .catch((err: unknown) => console.warn("[indexnow] not sent:", err instanceof Error ? err.message : err));
}
