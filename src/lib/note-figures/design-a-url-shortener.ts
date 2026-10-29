import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { along, database, packet, service, wire } from "./sd-kit.js";

/**
 * Design a URL Shortener: the case study's figures (content/notes/
 * system-design/design-a-url-shortener.md). Every figure loops (a points
 * subject), and every value it draws is computed here:
 *
 *  - write-path: three long URLs through an API server, a counter-based ID
 *    generator and the database; each short code is the counter value in
 *    base62 (the same `base62` the next figure runs by hand).
 *  - base62: one counter value turned into a code by repeated division by
 *    62, then checked by decoding it back.
 *  - read-path: six redirects through a two-entry LRU cache in front of the
 *    database, for the codes the write path made.
 *  - capacity: the back-of-the-envelope estimate, each line computed from
 *    the stated assumptions.
 */

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function base62(n: number): string {
  if (n === 0) return "0";
  let s = "";
  while (n > 0) {
    s = ALPHABET[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s;
}

function decode62(s: string): number {
  return [...s].reduce((v, c) => v * 62 + ALPHABET.indexOf(c), 0);
}

/** The counter's value when the figures start: an arbitrary point in a running system's life. */
const START_ID = 2_009_215_674;
const URLS = ["shop.example/item/48213?ref=mail", "blog.example/2026/10/caching-guide", "docs.example/api/v2/auth#tokens"];
const CODES = URLS.map((_, i) => base62(START_ID + i));

const fmt = (n: number) => n.toLocaleString("en-US");

/* ── Write path ───────────────────────────────────────────────────── */

function writePath(): Walkthrough {
  CODES.forEach((c, i) => {
    if (decode62(c) !== START_ID + i) throw new Error("write-path: a code does not decode to its id");
  });
  if (new Set(CODES).size !== CODES.length) throw new Error("write-path: two URLs got the same code");
  const N = URLS.length;
  const frames: Frame[] = [];
  for (let t = 0; t <= N + 1; t++) {
    const atApi = t >= 1 && t <= N ? t - 1 : null;
    const stored = t >= 2 ? t - 2 : null;
    const issued = Math.min(t, N); // ids handed out so far
    const client = service("client", 0, 20, "Client", { w: 80 });
    const api = service("api", 136, 20, "API server", { w: 96, tone: atApi !== null ? "accent" : "plain" });
    const gen = service("gen", 136, 104, "ID generator", { w: 96, tone: atApi !== null ? "accent" : "plain", sub: `next id ${fmt(START_ID + issued)}` });
    const db = database("db", 300, 20, "Database", { w: 96, tone: stored !== null ? "accent" : "plain" });
    const items: Item[] = [...client.items, ...api.items, ...gen.items, ...db.items];
    items.push(wire("c-api", client.right, api.left), wire("api-db", api.right, { x: db.left.x, y: api.right.y }, { tone: stored !== null ? "accent" : "line" }));
    items.push(wire("api-gen", { x: api.bottom.x - 14, y: api.bottom.y }, { x: gen.top.x - 14, y: gen.top.y }, { tone: atApi !== null ? "accent" : "line" }));
    items.push(wire("gen-api", { x: gen.top.x + 14, y: gen.top.y }, { x: api.bottom.x + 14, y: api.bottom.y }, { tone: atApi !== null ? "accent" : "line" }));
    // The table the rows land in.
    const TY = 184;
    items.push(label("th-id", "id", 0, TY, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    items.push(label("th-code", "code", 100, TY, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    items.push(label("th-url", "long URL", 172, TY, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    for (let j = 0; j < N; j++) {
      if (stored === null || j > stored) continue;
      const tone: Tone = j === stored && t <= N ? "accent" : "strong";
      const y = TY + 10 + j * 28;
      items.push(box(`id${j}`, 0, y, fmt(START_ID + j), { w: 94, h: 24, size: 10, tone }));
      items.push(box(`code${j}`, 100, y, CODES[j], { w: 66, h: 24, size: 10, tone }));
      items.push(box(`url${j}`, 172, y, URLS[j], { w: 220, h: 24, size: 10, tone: "plain" }));
    }
    for (let j = 0; j < N; j++) {
      const at = t - j;
      if (at === 0) items.push(packet(`u${j}`, { x: client.mid.x, y: client.top.y - 16 }, { text: j + 1 }));
      else if (at === 1) items.push(packet(`u${j}`, { x: api.mid.x, y: api.top.y - 16 }, { text: j + 1 }));
      else if (at === 2) items.push(packet(`u${j}`, { x: db.right.x + 16, y: db.mid.y }, { text: j + 1, tone: "strong" }));
    }
    let caption: string;
    if (t === 0) caption = "POST /shorten carries a long URL. The API server asks a counter for the next unique id, encodes it in base62 and stores the pair.";
    else if (t === N + 1) caption = `URL ${N} is stored as ${CODES[N - 1]}. Consecutive ids give distinct codes with no collision check; the price is codes that are easy to guess in order.`;
    else {
      const j = t - 1;
      const first = stored === null ? "" : `URL ${stored + 1} is stored under ${CODES[stored]} and the client gets short.example/${CODES[stored]}. `;
      caption = `${first}URL ${j + 1} reaches the API server, which takes id ${fmt(START_ID + j)}${stored === null ? ` and encodes it as ${CODES[j]}` : ""}.`;
    }
    frames.push({ caption, items });
  }
  return finish({ title: "Write path: long URL → unique id → base62 code → database", input: "", frames });
}

/* ── Base62 by hand ───────────────────────────────────────────────── */

function base62Figure(): Walkthrough {
  const id = START_ID;
  // Run the division: each step's remainder is one digit, least significant first.
  const steps: Array<{ n: number; q: number; r: number }> = [];
  for (let n = id; n > 0; n = Math.floor(n / 62)) steps.push({ n, q: Math.floor(n / 62), r: n % 62 });
  const code = steps.map((s) => ALPHABET[s.r]).reverse().join("");
  if (code !== base62(id) || decode62(code) !== id) throw new Error("base62: the hand division disagrees with the encoder");
  const D = steps.length;
  const RH = 28;
  const CODE_Y = 34 + D * RH + 18;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string, done = false) => {
    const items: Item[] = [
      label("h-n", "number", 0, 18, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("h-q", "÷ 62 =", 130, 18, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("h-r", "rem", 240, 18, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
      label("h-c", "char", 290, 18, { anchor: "start", tone: "soft", size: 11, weight: 600 }),
    ];
    steps.slice(0, k).forEach((s, i) => {
      const cur = i === k - 1 && !done;
      const y = 28 + i * RH;
      items.push(box(`n${i}`, 0, y, fmt(s.n), { w: 120, h: 24, size: 10, tone: cur ? "accent" : "plain" }));
      items.push(box(`q${i}`, 130, y, fmt(s.q), { w: 100, h: 24, size: 10, tone: "plain" }));
      items.push(box(`r${i}`, 240, y, s.r, { w: 40, h: 24, size: 10, tone: cur ? "accent" : "plain" }));
      items.push(box(`ch${i}`, 290, y, ALPHABET[s.r], { w: 30, h: 24, size: 11, tone: cur ? "accent" : "strong" }));
    });
    items.push(label("code-h", "code, read bottom-up", 0, CODE_Y, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    for (let p = 0; p < D; p++) {
      // Position p of the code (left to right) is the digit from step D - 1 - p.
      const step = D - 1 - p;
      const has = step < k;
      items.push(box(`cd${p}`, 150 + p * 32, CODE_Y - 14, has ? ALPHABET[steps[step].r] : "", { w: 28, h: 28, size: 12, tone: !has ? "ghost" : done ? "strong" : step === k - 1 ? "accent" : "plain" }));
    }
    frames.push({ caption, items });
  };
  draw(0, `To encode id ${fmt(id)}, divide by 62 again and again. Each remainder, 0–61, picks one character from 0–9, a–z, A–Z.`);
  steps.forEach((s, i) => {
    const c = ALPHABET[s.r];
    const kind = s.r < 10 ? "a digit" : s.r < 36 ? "a lower-case letter" : "an upper-case letter";
    draw(
      i + 1,
      s.q === 0
        ? `${fmt(s.n)} is under 62, so the quotient is 0 and this is the last digit: remainder ${s.r} is "${c}". The division stops.`
        : `${fmt(s.n)} ÷ 62 = ${fmt(s.q)}, remainder ${s.r}, which is "${c}" (${kind}). The quotient is divided next.`,
    );
  });
  draw(D, `Read the characters from the last division to the first: ${fmt(id)} is "${code}". ${D} characters cover every id below 62^${D}, about ${Math.round(62 ** D / 1e9)} billion.`, true);
  return finish({ title: "Base62: turning a numeric id into a short code", input: "", frames });
}

/* ── Read path ────────────────────────────────────────────────────── */

function readPath(): Walkthrough {
  const CAP = 2;
  const reads = [0, 1, 0, 2, 0, 1].map((i) => CODES[i]);
  // Run an LRU cache: index 0 is the most recently used entry.
  let cache: string[] = [];
  const log = reads.map((code) => {
    const hit = cache.includes(code);
    let evicted: string | null = null;
    cache = [code, ...cache.filter((c) => c !== code)];
    if (cache.length > CAP) evicted = cache.pop()!;
    return { code, hit, evicted, cache: [...cache] };
  });
  const hits = log.filter((l) => l.hit).length;
  if (hits === 0 || hits === reads.length) throw new Error("read-path: the example should mix hits and misses");
  const client = service("client", 0, 64, "Browser", { w: 80 });
  const server = service("srv", 130, 64, "App server", { w: 96 });
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const l = k > 0 && k <= log.length ? log[k - 1] : null;
    const shown = k === 0 ? [] : log[Math.min(k, log.length) - 1].cache;
    const cacheBox = service("cache", 290, 10, "Cache", { w: 84, tone: l?.hit ? "accent" : "plain", sub: `LRU · ${CAP} entries` });
    const db = database("db", 290, 120, "Database", { w: 84, tone: l && !l.hit ? "accent" : "plain" });
    const items: Item[] = [...client.items, ...server.items, ...cacheBox.items, ...db.items, wire("c-s", client.right, server.left)];
    items.push(wire("s-cache", server.right, cacheBox.left, { tone: l ? "accent" : "line" }));
    items.push(wire("s-db", server.right, db.left, { tone: l && !l.hit ? "accent" : "line" }));
    for (let i = 0; i < CAP; i++) {
      const c = shown[i];
      items.push(box(`slot${i}`, 390 + i * 62, 14, "", { w: 58, h: 30, tone: "ghost" }));
      if (c) items.push(box(`e-${c}`, 390 + i * 62, 14, c, { w: 58, h: 30, size: 10, tone: l && c === l.code ? "accent" : k > log.length ? "strong" : "plain" }));
    }
    items.push(label("mru", "most recent →  older", 390, 60, { anchor: "start", tone: "faint", size: 10 }));
    if (l) {
      const target = l.hit ? cacheBox.left : db.left;
      items.push(packet(`q${k}`, along(server.right, target, 0.55), { text: l.hit ? "hit" : "miss", r: 13, tone: l.hit ? "strong" : "accent" }));
      items.push(wire("s-c", { x: server.left.x, y: server.left.y + 12 }, { x: client.right.x, y: client.right.y + 12 }, { tone: "accent", dashed: true }));
      items.push(label("resp", "302", (server.left.x + client.right.x) / 2, server.left.y + 26, { tone: "accent", size: 11, mono: true }));
      items.push(label("req", `GET /${l.code}`, client.mid.x, client.top.y - 12, { tone: "ink", size: 11, mono: true }));
    }
    frames.push({ caption, items });
  };
  draw(0, `A browser opens short.example/<code>. The server looks the code up in an LRU cache of ${CAP} entries first and goes to the database only on a miss, then redirects.`);
  log.forEach((l, i) => {
    const caption = l.hit
      ? log.slice(0, i).some((x) => x.hit)
        ? `GET /${l.code}: another hit — popular codes stay at the front of the cache, so the database is not read again for ${l.code}.`
        : `GET /${l.code}: a cache hit. The server answers 302 with the long URL without touching the database, and ${l.code} becomes the most recent entry.`
      : `GET /${l.code}: a miss, so the server reads the database, caches the row${l.evicted ? ` (evicting ${l.evicted}, the least recently used)` : ""} and answers 302.`;
    draw(i + 1, caption);
  });
  draw(log.length + 1, `${hits} of ${reads.length} redirects came from the cache. Real traffic is skewed towards a few popular links, so a cache holding a small share of codes serves most reads.`);
  return finish({ title: "Read path: cache first, database on a miss, then a redirect", input: "", frames });
}

/* ── Capacity estimate ────────────────────────────────────────────── */

function capacity(): Walkthrough {
  const WRITES_PER_MONTH = 100e6;
  const READ_RATIO = 100;
  const ROW_BYTES = 500;
  const YEARS = 5;
  const SECONDS_PER_MONTH = 30 * 86_400;
  const writesPerSec = WRITES_PER_MONTH / SECONDS_PER_MONTH;
  const readsPerSec = writesPerSec * READ_RATIO;
  const rows = WRITES_PER_MONTH * 12 * YEARS;
  const bytes = rows * ROW_BYTES;
  let len = 1;
  while (62 ** len < rows) len++;
  if (62 ** (len - 1) >= rows) throw new Error("capacity: code length is not the smallest that fits");
  const assumptions: Array<[string, string]> = [
    ["new URLs / month", `${WRITES_PER_MONTH / 1e6}M`],
    ["reads per write", `${READ_RATIO}`],
    ["bytes per row", `${ROW_BYTES}`],
    ["kept for", `${YEARS} years`],
  ];
  const results: Array<{ name: string; how: string; value: string; caption: string }> = [
    { name: "writes / second", how: `${WRITES_PER_MONTH / 1e6}M ÷ ${fmt(SECONDS_PER_MONTH)} s`, value: `≈ ${Math.round(writesPerSec)}/s`, caption: `Writes: ${WRITES_PER_MONTH / 1e6} million a month over ${fmt(SECONDS_PER_MONTH)} seconds is about ${writesPerSec.toFixed(1)} a second — small for one database.` },
    { name: "reads / second", how: `${writesPerSec.toFixed(1)} × ${READ_RATIO}`, value: `≈ ${fmt(Math.round(readsPerSec / 100) * 100)}/s`, caption: `Reads: ${READ_RATIO} times that is about ${fmt(Math.round(readsPerSec))} a second on average, more at peaks. Reads dominate, so the design is built around a cache.` },
    { name: `rows in ${YEARS} years`, how: `${WRITES_PER_MONTH / 1e6}M × 12 × ${YEARS}`, value: `${rows / 1e9} billion`, caption: `Rows: ${WRITES_PER_MONTH / 1e6} million a month for ${YEARS} years is ${rows / 1e9} billion short links to keep.` },
    { name: "storage", how: `${rows / 1e9}B × ${ROW_BYTES} B`, value: `${bytes / 1e12} TB`, caption: `Storage: ${rows / 1e9} billion rows at ${ROW_BYTES} bytes is ${bytes / 1e12} TB before replicas — more than one cheap disk, so plan to shard or use a store that does.` },
    { name: "code length", how: `62^${len - 1} < ${rows / 1e9}B ≤ 62^${len}`, value: `${len} chars`, caption: `Code length: 62^${len - 1} is only about ${Math.round(62 ** (len - 1) / 1e6)} million, while 62^${len} is about ${Math.round(62 ** len / 1e9)} billion, so ${len} base62 characters are enough.` },
  ];
  const RH = 44;
  const frames: Frame[] = [];
  const draw = (k: number, caption: string) => {
    const items: Item[] = [label("a-h", "assumptions", 0, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 }), label("r-h", "estimate", 236, 0, { anchor: "start", tone: "soft", size: 11, weight: 600 })];
    assumptions.forEach(([name, v], i) => {
      items.push(label(`an${i}`, name, 0, 26 + i * RH, { anchor: "start", tone: "ink", size: 11 }));
      items.push(box(`av${i}`, 110, 12 + i * RH, v, { w: 84, h: 28, size: 11 }));
    });
    results.forEach((r, i) => {
      if (i >= k) return;
      const cur = i === k - 1 && k <= results.length;
      const y = 12 + i * RH;
      items.push(label(`rn${i}`, r.name, 236, y + 9, { anchor: "start", tone: "ink", size: 11 }));
      items.push(label(`rh${i}`, r.how, 236, y + 25, { anchor: "start", tone: "faint", size: 10, mono: true }));
      items.push(box(`rv${i}`, 392, y, r.value, { w: 92, h: 28, size: 11, tone: cur ? "accent" : "strong" }));
    });
    frames.push({ caption, items });
  };
  draw(0, "Start from stated assumptions, then derive the numbers the design must meet. Say the assumptions out loud; an interviewer may change them.");
  results.forEach((r, i) => draw(i + 1, r.caption));
  draw(results.length + 1, `The design: about ${Math.round(writesPerSec)} writes and ${fmt(Math.round(readsPerSec / 100) * 100)} reads a second, ${bytes / 1e12} TB over ${YEARS} years, and ${len}-character codes — a read-heavy system.`);
  return finish({ title: "Capacity estimate: from assumptions to QPS, storage and code length", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "write-path": writePath,
  base62: base62Figure,
  "read-path": readPath,
  capacity,
};
