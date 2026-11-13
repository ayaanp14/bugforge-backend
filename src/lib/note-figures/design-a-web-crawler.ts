import { finish, link, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { lines } from "./kit.js";
import { service, wire } from "./sd-kit.js";

/**
 * Design a Web Crawler: the case study's figures (content/notes/
 * system-design/design-a-web-crawler.md). Every figure loops (a points
 * subject), and every value it draws is computed here:
 *
 *  - bfs: a breadth-first crawl of a six-page link graph from one seed — a
 *    FIFO frontier and a seen-set, so a page linked many times is fetched once.
 *  - politeness: URLs of three hosts in per-host queues; a fetcher that may
 *    hit a host only once every three ticks picks the ready host each tick
 *    (and waits when none is ready).
 *  - robots: one site's robots.txt applied to four URLs by the longest
 *    matching rule, Allow winning a tie (RFC 9309).
 *  - dedup: four discovered URLs normalised (case, fragment, tracking
 *    parameters) and checked against a URL seen-set, then each fetched body
 *    fingerprinted and checked against a content seen-set.
 */

/** FNV-1a folded to 16 bits, as four hex digits: a toy content fingerprint (real crawlers use 64-bit or larger). */
function fingerprint(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (((h >>> 16) ^ (h & 0xffff)) >>> 0).toString(16).padStart(4, "0");
}

/* ── BFS over the link graph ──────────────────────────────────────── */

function bfs(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F"];
  const links: Record<string, string[]> = { A: ["B", "C"], B: ["A", "D"], C: ["D", "E"], D: ["F"], E: ["A", "F"], F: ["C"] };
  const pos: Record<string, { x: number; y: number }> = { A: { x: 180, y: 20 }, B: { x: 90, y: 92 }, C: { x: 270, y: 92 }, D: { x: 140, y: 172 }, E: { x: 300, y: 172 }, F: { x: 220, y: 242 } };
  const edges = names.flatMap((a) => links[a].map((b) => [a, b] as const));
  const both = (a: string, b: string) => links[b].includes(a);
  // Run the crawl.
  const seen = new Set(["A"]);
  const queue = ["A"];
  const log: Array<{ page: string; added: string[]; skipped: string[]; frontier: string[]; fetched: string[] }> = [];
  const fetched: string[] = [];
  while (queue.length) {
    const page = queue.shift()!;
    fetched.push(page);
    const added: string[] = [];
    const skipped: string[] = [];
    for (const l of links[page]) {
      if (seen.has(l)) skipped.push(l);
      else {
        seen.add(l);
        queue.push(l);
        added.push(l);
      }
    }
    log.push({ page, added, skipped, frontier: [...queue], fetched: [...fetched] });
  }
  if (fetched.length !== names.length) throw new Error("bfs: every page should be reached from the seed");
  const skippedTotal = log.reduce((n, l) => n + l.skipped.length, 0);
  const FY = 300;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const l = k > 0 ? log[k - 1] : null;
    const done = new Set(l ? l.fetched : []);
    const frontier = l ? l.frontier : ["A"];
    const items: Item[] = [];
    edges.forEach(([a, b]) => {
      const cur = l?.page === a;
      const tone = cur ? (l!.added.includes(b) ? "accent" : "error") : "line";
      items.push(link(`e${a}${b}`, pos[a], pos[b], 18, { tone, arrow: true, bow: both(a, b) ? 14 : a === "E" && b === "A" ? -40 : undefined, dashed: cur && !l!.added.includes(b) }));
    });
    names.forEach((n) => {
      const tone: Tone = l?.page === n ? "accent" : done.has(n) ? "strong" : frontier.includes(n) ? "plain" : "ghost";
      items.push({ k: "node", id: `n${n}`, x: pos[n].x, y: pos[n].y, r: 18, text: n, tone });
    });
    items.push(label("fh", "frontier (FIFO)", 0, FY - 22, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    frontier.forEach((p) => {
      const isNew = l?.added.includes(p) ?? false;
      items.push(box(`q${p}`, 0 + frontier.indexOf(p) * 40, FY - 10, p, { w: 34, h: 28, size: 12, tone: isNew ? "accent" : "plain" }));
    });
    if (frontier.length === 0) items.push(label("qe", "empty — crawl done", 0, FY + 4, { anchor: "start", tone: "accent", size: 11 }));
    items.push(label("seen", `seen: ${l ? [...new Set([...l.fetched, ...l.frontier])].sort().join(" ") : "A"}`, 230, FY + 4, { anchor: "start", tone: "soft", size: 11, mono: true }));
    frames.push({ caption, items });
  };
  draw(0, "The crawl starts from a seed URL, A, in the frontier — a FIFO queue of pages to fetch — and in the seen-set, which records every URL ever queued.");
  log.forEach((l, i) => {
    const parts = [`Fetch ${l.page} and extract its links (${links[l.page].join(", ")}).`];
    if (l.added.length) parts.push(`${l.added.join(" and ")} ${l.added.length > 1 ? "are" : "is"} new, so ${l.added.length > 1 ? "they join" : "it joins"} the back of the frontier.`);
    if (l.skipped.length) parts.push(`${l.skipped.join(" and ")} ${l.skipped.length > 1 ? "are" : "is"} already seen and skipped.`);
    if (i === log.length - 1) parts.push(`The frontier is empty: ${names.length} pages fetched once each, ${skippedTotal} repeat links ignored.`);
    draw(i + 1, parts.join(" "));
  });
  return finish({ title: "Breadth-first crawl: a FIFO frontier and a seen-set", input: "", frames });
}

/* ── Politeness ───────────────────────────────────────────────────── */

function politeness(): Walkthrough {
  const DELAY = 3; // ticks between two fetches from the same host
  const hosts = [
    { name: "a.com", urls: ["/", "/jobs", "/blog"] },
    { name: "b.org", urls: ["/", "/faq"] },
    { name: "c.net", urls: ["/"] },
  ];
  // Run the scheduler: each tick, fetch from the ready host that has waited longest (ties in host order).
  const queues = hosts.map((h) => [...h.urls]);
  const nextOk = hosts.map(() => 0);
  const log: Array<{ t: number; host: number | null; url: string | null; queues: string[][]; nextOk: number[] }> = [];
  for (let t = 0; queues.some((q) => q.length); t++) {
    let pick: number | null = null;
    queues.forEach((q, i) => {
      if (q.length && nextOk[i] <= t && (pick === null || nextOk[i] < nextOk[pick])) pick = i;
    });
    let url: string | null = null;
    if (pick !== null) {
      url = queues[pick].shift()!;
      nextOk[pick] = t + DELAY;
    }
    log.push({ t, host: pick, url, queues: queues.map((q) => [...q]), nextOk: [...nextOk] });
    if (t > 20) throw new Error("politeness: the scheduler did not finish");
  }
  const idle = log.filter((l) => l.host === null).length;
  if (idle === 0) throw new Error("politeness: the example should show the fetcher waiting");
  // Never two fetches of one host closer than DELAY.
  hosts.forEach((_, i) => {
    const ts = log.filter((l) => l.host === i).map((l) => l.t);
    ts.slice(1).forEach((t, j) => {
      if (t - ts[j] < DELAY) throw new Error("politeness: a host was hit too soon");
    });
  });
  const RH = 46;
  const fetcher = service("fetch", 360, RH, "Fetcher", { w: 90 });
  const LOGY = hosts.length * RH + 40;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const l = k > 0 ? log[k - 1] : null;
    const qs = l ? l.queues : hosts.map((h) => h.urls);
    const ok = l ? l.nextOk : hosts.map(() => 0);
    const items: Item[] = [...fetcher.items, label("clock", l ? `t = ${l.t}` : "t = 0", fetcher.mid.x, fetcher.top.y - 14, { tone: "soft", size: 11, mono: true })];
    hosts.forEach((h, i) => {
      const y = i * RH;
      const hit = l?.host === i;
      items.push(label(`h${i}`, h.name, 0, y + 15, { anchor: "start", tone: hit ? "accent" : "ink", size: 11, mono: true }));
      qs[i].forEach((u, j) => items.push(box(`u${i}-${h.urls.indexOf(u)}`, 56 + j * 56, y, u, { w: 50, h: 28, size: 10, tone: "plain" })));
      const t = l ? l.t : 0;
      const ready = !hit && qs[i].length > 0 && ok[i] <= t;
      items.push(label(`ok${i}`, hit ? "fetching now" : qs[i].length === 0 ? "done" : ready ? "ready" : `wait until t=${ok[i]}`, 230, y + 15, { anchor: "start", tone: ready || hit ? "accent" : "faint", size: 10 }));
      items.push(wire(`w${i}`, { x: 324, y: y + 14 }, fetcher.left, { tone: hit ? "accent" : "faint", head: true }));
    });
    items.push(label("lh", "fetched, in order", 0, LOGY - 14, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    log.slice(0, k).forEach((e, j) => {
      const text = e.host === null ? "idle" : `${hosts[e.host].name[0]}${e.url}`;
      items.push(box(`f${j}`, j * 58, LOGY, text, { w: 54, h: 26, size: 10, tone: e.host === null ? "ghost" : j === k - 1 ? "accent" : "strong" }));
    });
    frames.push({ caption, items });
  };
  draw(0, `The frontier keeps one queue per host. The fetcher may hit a host at most once every ${DELAY} ticks, so a crawler with many workers never floods one small site.`);
  log.forEach((e, i) => {
    let caption: string;
    if (e.host === null) caption = `At t=${e.t} every host with URLs left is still inside its delay, so the fetcher waits. With millions of hosts in a real frontier, some host is almost always ready.`;
    else {
      const name = hosts[e.host].name;
      caption = `At t=${e.t} the fetcher takes ${name}${e.url}, the ready host that has waited longest, and marks ${name} not ready again until t=${e.nextOk[e.host]}.`;
      if (i === log.length - 1) caption += ` Every URL fetched, no host hit twice within ${DELAY} ticks.`;
    }
    draw(i + 1, caption);
  });
  return finish({ title: "Politeness: per-host queues, one fetch per host per delay", input: "", frames });
}

/* ── robots.txt ───────────────────────────────────────────────────── */

function robots(): Walkthrough {
  const rules: Array<{ allow: boolean; path: string }> = [
    { allow: false, path: "/cart" },
    { allow: false, path: "/search" },
    { allow: true, path: "/search/help" },
  ];
  const urls = ["/products/42", "/cart/checkout", "/search?q=tv", "/search/help"];
  // RFC 9309: the most specific (longest) matching rule wins; Allow wins a tie; no match means allowed.
  const decide = (u: string) => {
    let best: { allow: boolean; path: string; i: number } | null = null;
    rules.forEach((r, i) => {
      if (!u.startsWith(r.path)) return;
      if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = { ...r, i };
    });
    const b = best as { allow: boolean; path: string; i: number } | null;
    return { rule: b ? b.i : null, allow: b ? b.allow : true };
  };
  const results = urls.map((u) => ({ u, ...decide(u) }));
  if (results.every((r) => r.allow) || results.every((r) => !r.allow)) throw new Error("robots: the example should both allow and block");
  const text = ["User-agent: *", ...rules.map((r) => `${r.allow ? "Allow" : "Disallow"}: ${r.path}`)];
  const UX = 200;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const cur = k > 0 && k <= results.length ? results[k - 1] : null;
    const items: Item[] = [label("rh", "shop.example/robots.txt", 0, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 })];
    if (cur && cur.rule !== null) items.push({ k: "band", id: "hl", x: -4, y: 14 + (cur.rule + 1) * 20, w: 172, h: 20, tone: cur.allow ? "accent" : "error" });
    items.push(...lines("rl", text, 0, 24, { size: 11, gap: 20, mono: true, tone: (i) => (cur && cur.rule !== null && i === cur.rule + 1 ? "ink" : "soft") }));
    items.push(label("uh", "URL", UX, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    items.push(label("vh", "verdict", UX + 160, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    results.slice(0, k).forEach((r, i) => {
      const now = cur === r;
      items.push(box(`u${i}`, UX, 14 + i * 32, r.u, { w: 150, h: 26, size: 10, tone: now ? "accent" : "plain" }));
      items.push(box(`v${i}`, UX + 160, 14 + i * 32, r.allow ? "fetch" : "skip", { w: 70, h: 26, size: 10, tone: r.allow ? "strong" : "muted" }));
    });
    frames.push({ caption, items });
  };
  draw(0, "Before crawling a host, fetch its robots.txt once and cache it (for up to a day). Each URL is checked against the rules before it enters the frontier.");
  results.forEach((r, i) => {
    let caption: string;
    if (r.rule === null) caption = `${r.u} matches no rule, so it is allowed: robots.txt lists what to avoid, and everything else is open.`;
    else {
      const rule = rules[r.rule];
      const others = rules.filter((x, j) => j !== r.rule && r.u.startsWith(x.path));
      caption = `${r.u} matches ${rule.allow ? "Allow" : "Disallow"}: ${rule.path}${others.length ? `, the longest of ${others.length + 1} matching rules,` : ","} so it is ${rule.allow ? "fetched" : "skipped"}.`;
      if (others.length) caption += " The most specific rule wins.";
    }
    draw(i + 1, caption);
  });
  const blocked = results.filter((r) => !r.allow).length;
  draw(results.length + 1, `${results.length - blocked} of ${results.length} URLs may be fetched. robots.txt is a request, not a lock: a polite crawler obeys it, and many also honour a Crawl-delay line, which is outside the standard.`);
  return finish({ title: "robots.txt: the longest matching rule decides", input: "", frames });
}

/* ── URL and content dedup ────────────────────────────────────────── */

function normalise(raw: string): string {
  const u = new URL(raw); // lower-cases the scheme and host
  u.hash = "";
  for (const k of [...u.searchParams.keys()]) if (k.startsWith("utm_")) u.searchParams.delete(k);
  return u.toString().replace(/\?$/, "");
}

function dedup(): Walkthrough {
  const found = ["HTTPS://News.Example/a?utm_source=mail#top", "https://news.example/a", "https://m.news.example/a", "https://news.example/b"];
  const bodies: Record<string, string> = {
    "https://news.example/a": "<h1>Budget 2026: what changed</h1>",
    "https://m.news.example/a": "<h1>Budget 2026: what changed</h1>",
    "https://news.example/b": "<h1>Monsoon arrives early</h1>",
  };
  const seenUrl = new Set<string>();
  const seenHash = new Set<string>();
  const log = found.map((raw) => {
    const url = normalise(raw);
    if (seenUrl.has(url)) return { raw, url, urlDup: true, hash: null as string | null, bodyDup: false };
    seenUrl.add(url);
    const body = bodies[url];
    if (body === undefined) throw new Error(`dedup: no body for ${url}`);
    const hash = fingerprint(body);
    const bodyDup = seenHash.has(hash);
    seenHash.add(hash);
    return { raw, url, urlDup: false, hash, bodyDup };
  });
  if (!log.some((l) => l.urlDup) || !log.some((l) => l.bodyDup)) throw new Error("dedup: the example should catch one URL and one content duplicate");
  if (new Set(Object.values(bodies)).size !== new Set(Object.values(bodies).map(fingerprint)).size) throw new Error("dedup: toy hash collided");
  const C = [0, 176, 248, 308];
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const cur = k > 0 && k <= log.length ? log[k - 1] : null;
    const items: Item[] = [
      label("rawh", "discovered link", 0, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("raw", cur ? cur.raw : "", 0, 20, { anchor: "start", tone: "accent", size: 11, mono: true }),
      label("c0", "normalised URL", C[0], 50, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("c1", "URL", C[1], 50, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("c2", "hash", C[2], 50, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("c3", "content", C[3], 50, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
    ];
    log.slice(0, k).forEach((l, i) => {
      const y = 62 + i * 32;
      const now = l === cur;
      items.push(box(`n${i}`, C[0], y, l.url, { w: 168, h: 26, size: 10, tone: now ? "accent" : "plain" }));
      items.push(box(`s${i}`, C[1], y, l.urlDup ? "seen" : "new", { w: 64, h: 26, size: 10, tone: l.urlDup ? "muted" : "strong" }));
      items.push(box(`h${i}`, C[2], y, l.hash ?? "—", { w: 52, h: 26, size: 10, tone: l.hash ? "plain" : "ghost" }));
      items.push(box(`b${i}`, C[3], y, l.urlDup ? "—" : l.bodyDup ? "duplicate" : "new", { w: 84, h: 26, size: 10, tone: l.urlDup ? "ghost" : l.bodyDup ? "muted" : "strong" }));
    });
    frames.push({ caption, items });
  };
  draw(0, "Two checks keep the crawl from wasting work: a URL seen-set before fetching, and a content seen-set after. Both compare a normalised form, not the raw text.");
  log.forEach((l, i) => {
    let caption: string;
    if (l.urlDup) caption = `${l.raw} normalises to a URL already in the seen-set, so it is dropped without a fetch.`;
    else if (l.bodyDup) caption = `${l.url} is a new URL, so it is fetched, but its body hashes to ${l.hash}, already seen: a mirror. It is not indexed again and its links are not followed again.`;
    else if (i === 0) caption = `Normalising lower-cases the host, drops the #fragment and the utm_ tracking parameter. The URL is new, so it is fetched; its body hashes to ${l.hash}.`;
    else caption = `${l.url} is new and its body hashes to ${l.hash}, new as well, so the page is stored and its links join the frontier. Four links found, two pages kept.`;
    draw(i + 1, caption);
  });
  return finish({ title: "Dedup: normalise and check URLs, then hash and check content", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  bfs,
  politeness,
  robots,
  dedup,
};
