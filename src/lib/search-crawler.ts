import { promises as dns } from "node:dns";
import { isIP } from "node:net";

/**
 * Whether a request comes from a search engine's crawler, proven by DNS.
 *
 * Why it matters: Google renders the SPA, and every rendered problem page
 * reads the API (the problem, its editorial, its hints). Googlebot renders
 * from a few shared addresses — and since the API answered on IPv6
 * (2026-10-03) the rate limiter keys IPv6 by /64, so a whole Google crawl
 * subnet shared one 300-a-minute bucket. A render whose read came back 429
 * drew "Could not load this problem" with no h1, and Search Console filed it
 * as a soft 404: 37 pages, then 90 from 2026-10-05, every one a real problem
 * or study lesson that renders fine for a person. The SPA's one retry
 * (store/api/apiSlice.ts) waits ≤ 3 s; the limiter's window is 60 s.
 *
 * A User-Agent alone proves nothing — any scraper can say "Googlebot" — so a
 * claim is checked the way the engines document it: the address's PTR record
 * must end in one of the engine's domains, and that name must resolve back to
 * the same address. Results are cached per address (a day when proven, an
 * hour when not), so DNS is asked once per crawler host, not per request.
 *
 * https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot
 * https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26
 * https://support.apple.com/en-us/119829 (Applebot)
 */

/** A UA naming a crawler we verify, and the domains its PTR must end in. */
const ENGINES: { ua: RegExp; domains: string[] }[] = [
  { ua: /googlebot|google-inspectiontool|googleother|storebot-google/i, domains: ["googlebot.com", "google.com"] },
  { ua: /bingbot|bingpreview|msnbot/i, domains: ["search.msn.com"] },
  { ua: /applebot/i, domains: ["applebot.apple.com"] },
  { ua: /yandex/i, domains: ["yandex.ru", "yandex.net", "yandex.com"] },
];

export function claimedEngine(userAgent: string | string[] | undefined | null): string[] | null {
  const ua = Array.isArray(userAgent) ? userAgent.join(" ") : userAgent;
  if (!ua) return null;
  return ENGINES.find((e) => e.ua.test(ua))?.domains ?? null;
}

export interface Resolver {
  reverse(ip: string): Promise<string[]>;
  lookup(host: string): Promise<string[]>;
}

const systemResolver: Resolver = {
  reverse: (ip) => dns.reverse(ip),
  lookup: async (host) => (await dns.lookup(host, { all: true })).map((a) => a.address),
};

const PROVEN_MS = 24 * 60 * 60 * 1000;
const REFUSED_MS = 60 * 60 * 1000;
/** A slow resolver must not hold a request: past this the claim is unproven (and not cached). */
const DNS_TIMEOUT_MS = 2000;
const MAX_ENTRIES = 5000;

/** Canonical text of an address, so ::ffff:1.2.3.4 and expanded IPv6 compare equal. */
function canonical(ip: string): string {
  const bare = ip.split("%")[0] ?? ip;
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(bare);
  if (mapped?.[1]) return mapped[1];
  if (isIP(bare) !== 6) return bare;
  // Expand to eight groups without leading zeros.
  const [head, tail] = bare.toLowerCase().split("::");
  const front = head ? head.split(":") : [];
  const back = tail === undefined ? [] : tail ? tail.split(":") : [];
  const groups = tail === undefined ? front : [...front, ...Array<string>(8 - front.length - back.length).fill("0"), ...back];
  return groups.map((g) => parseInt(g, 16).toString(16)).join(":");
}

const withTimeout = <T,>(p: Promise<T>): Promise<T> =>
  Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("dns timeout")), DNS_TIMEOUT_MS).unref())]);

export function createCrawlerVerifier(resolver: Resolver = systemResolver, now: () => number = Date.now) {
  const cache = new Map<string, { ok: boolean; until: number }>();
  const inFlight = new Map<string, Promise<boolean>>();

  async function check(given: string, ip: string, domains: string[]): Promise<boolean> {
    // An IPv4-mapped address is asked as its IPv4 address; IPv6 as given.
    const names = await withTimeout(resolver.reverse(isIP(ip) === 4 ? ip : given));
    for (const raw of names) {
      const name = raw.toLowerCase().replace(/\.$/, "");
      if (!domains.some((d) => name.endsWith(`.${d}`))) continue;
      const addresses = await withTimeout(resolver.lookup(name));
      if (addresses.some((a) => canonical(a) === ip)) return true;
    }
    return false;
  }

  return function verified(ipRaw: string | undefined, domains: string[]): Promise<boolean> {
    if (!ipRaw) return Promise.resolve(false);
    const given = ipRaw.split("%")[0] ?? ipRaw;
    if (!isIP(given)) return Promise.resolve(false);
    const ip = canonical(given);
    const key = `${ip}|${domains[0]}`;
    const hit = cache.get(key);
    if (hit && hit.until > now()) return Promise.resolve(hit.ok);
    const pending = inFlight.get(key);
    if (pending) return pending;
    const run = check(given, ip, domains)
      .then((ok) => {
        if (cache.size >= MAX_ENTRIES) cache.clear();
        cache.set(key, { ok, until: now() + (ok ? PROVEN_MS : REFUSED_MS) });
        return ok;
      })
      // NXDOMAIN is a definite no; a timeout or SERVFAIL is not cached, so the next request asks again.
      .catch((err: NodeJS.ErrnoException) => {
        if (err?.code === "ENOTFOUND") cache.set(key, { ok: false, until: now() + REFUSED_MS });
        return false;
      })
      .finally(() => inFlight.delete(key));
    inFlight.set(key, run);
    return run;
  };
}

export const isVerifiedCrawler = createCrawlerVerifier();
