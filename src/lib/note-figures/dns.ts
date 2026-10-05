import { finish, treeLayout, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { message } from "./kit.js";

/**
 * Domain Name System (DNS): the note's figures (content/notes/
 * computer-networks/dns.md places each with "@figure <name>").
 *
 * A miniature DNS runs underneath: three zones (the root, com and
 * example.com) holding the delegations and records of the note's example,
 * and a resolver that starts at the root, follows referrals and caches
 * what it learns with each record's TTL. The figures draw what it did.
 *
 *  - hierarchy: the name tree built by splitting names into labels right to
 *    left, the path to www.example.com marked.
 *  - resolution: the cold lookup of www.example.com as a sequence diagram —
 *    one recursive query from the stub, three iterative ones from the
 *    resolver — checked against the note's step table.
 *  - query-kinds: who sends what in a recursive chain and an iterative one,
 *    the messages counted by walking each.
 *  - caching: four lookups over 4,000 seconds against the resolver's cache;
 *    the queries each one needed and every record's remaining TTL are read
 *    off the simulated cache.
 */

/* ── A miniature DNS ──────────────────────────────────────────────── */

interface Rr {
  name: string;
  type: "NS" | "A";
  value: string;
  ttl: number;
}
interface Zone {
  apex: string;
  server: string;
  records: Rr[];
}

// The root zone's delegation of com and com's delegation of example.com use the
// two-day TTL those zones publish; example.com's own records use its $TTL, 3600.
const ZONES: Zone[] = [
  { apex: "", server: "root", records: [{ name: "com", type: "NS", value: "com TLD", ttl: 172800 }] },
  { apex: "com", server: "com TLD", records: [{ name: "example.com", type: "NS", value: "ns1.example.com", ttl: 172800 }] },
  {
    apex: "example.com",
    server: "ns1.example.com",
    records: [
      { name: "www.example.com", type: "A", value: "203.0.113.10", ttl: 3600 },
      { name: "mail.example.com", type: "A", value: "203.0.113.25", ttl: 3600 },
    ],
  },
];

const inZone = (name: string, apex: string) => apex === "" || name === apex || name.endsWith(`.${apex}`);

/** A server's answer: the record itself if it is authoritative for it, else the closest delegation it holds. */
function ask(server: string, name: string): { answer?: Rr; referral?: Rr } {
  const zone = ZONES.find((z) => z.server === server);
  if (!zone) throw new Error(`dns: no server ${server}`);
  const a = zone.records.find((r) => r.type === "A" && r.name === name);
  if (a) return { answer: a };
  const cut = zone.records.filter((r) => r.type === "NS" && inZone(name, r.name)).sort((x, y) => y.name.length - x.name.length)[0];
  if (!cut) throw new Error(`dns: ${server} knows nothing of ${name}`);
  return { referral: cut };
}

interface CacheEntry {
  rr: Rr;
  expires: number;
}

/** A recursive resolver with a cache: starts from the closest delegation it still holds. */
class Resolver {
  cache = new Map<string, CacheEntry>();
  resolve(name: string, now: number): { rr: Rr; asked: Array<{ server: string; reply: { answer?: Rr; referral?: Rr } }>; hit: boolean; from?: string } {
    const live = (k: string) => {
      const e = this.cache.get(k);
      return e && e.expires > now ? e : undefined;
    };
    const cached = live(`${name} A`);
    if (cached) return { rr: cached.rr, asked: [], hit: true };
    // The deepest delegation still cached decides where to start; the root is always known (its hints file).
    let server = "root";
    let best = -1;
    let from: string | undefined;
    for (const [k, e] of this.cache) {
      if (!k.endsWith(" NS") || e.expires <= now || !inZone(name, e.rr.name)) continue;
      if (e.rr.name.length > best) {
        best = e.rr.name.length;
        server = e.rr.value;
        from = k;
      }
    }
    const asked: Array<{ server: string; reply: { answer?: Rr; referral?: Rr } }> = [];
    for (let hop = 0; hop < 8; hop++) {
      const reply = ask(server, name);
      asked.push({ server, reply });
      const rr = reply.answer ?? reply.referral!;
      this.cache.set(`${rr.name} ${rr.type}`, { rr, expires: now + rr.ttl });
      if (reply.answer) return { rr: reply.answer, asked, hit: false, from };
      server = reply.referral!.value;
    }
    throw new Error("dns: too many referrals");
  }
}

const n = (v: number) => v.toLocaleString("en-GB");

/* ── The name tree ────────────────────────────────────────────────── */

function hierarchy(): Walkthrough {
  const names = ["www.example.com", "mail.example.com", "en.wikipedia.org", "india.gov.in"];
  const TARGET = "www.example.com";
  // Build the tree from labels, right to left: a node's key is its full name ("" for the root).
  const kids = new Map<string, string[]>([["", []]]);
  for (const name of names) {
    const labels = name.split(".");
    for (let i = labels.length - 1; i >= 0; i--) {
      const key = labels.slice(i).join(".");
      const parent = labels.slice(i + 1).join(".");
      if (!kids.has(key)) {
        kids.set(key, []);
        kids.get(parent)!.push(key);
      }
    }
  }
  const DX = 84;
  const DY = 60;
  const at = treeLayout<string>("", (k) => kids.get(k) ?? [], { dx: DX, dy: DY });
  const onPath = new Set(TARGET.split(".").map((_, i, ls) => ls.slice(i).join(".")).concat(""));
  const BW = 74;
  const BH = 26;
  const items: Item[] = [];
  const levels = ["root", "top level", "second level", "hosts"];
  levels.forEach((t, d) => items.push(label(`lv${d}`, t, -BW / 2 - 14, d * DY, { anchor: "end", tone: "soft", size: 11 })));
  for (const [k, p] of at) {
    for (const c of kids.get(k) ?? []) {
      const q = at.get(c)!;
      items.push({ k: "edge", id: `e${c}`, x1: p.x, y1: p.y + BH / 2, x2: q.x, y2: q.y - BH / 2, tone: onPath.has(c) ? "accent" : "line" });
    }
  }
  for (const [k, p] of at) {
    const text = k === "" ? "." : k.split(".")[0];
    const tone: Tone = k === TARGET ? "strong" : onPath.has(k) ? "accent" : "plain";
    items.push(box(`n${k || "root"}`, p.x - BW / 2, p.y - BH / 2, text, { w: BW, h: BH, size: 12, tone }));
  }
  const leaf = at.get(TARGET)!;
  const path = [".", ...TARGET.split(".").reverse()];
  items.push(label("fq", `${TARGET}. from the right: ${path.join(" → ")}`, leaf.x - BW / 2, leaf.y + 40, { anchor: "start", tone: "ink", size: 11.5 }));
  const tlds = kids.get("")!.length;
  return finish({
    title: "The DNS namespace is a tree",
    input: names.join(", "),
    frames: [
      {
        caption: `Each label of a name is one level of the tree, read from the right: the unnamed root, then ${tlds} top-level domains here, then the names under them. Each level delegates the one below, so the root only knows who runs com, and com only who runs example.com.`,
        items,
      },
    ],
  });
}

/* ── One cold lookup ──────────────────────────────────────────────── */

function resolution(): Walkthrough {
  const NAME = "www.example.com";
  const resolver = new Resolver();
  const r = resolver.resolve(NAME, 0);
  // The note's step table: root and com refer, example.com answers 203.0.113.10 with TTL 3600.
  const servers = r.asked.map((a) => a.server);
  if (servers.join() !== "root,com TLD,ns1.example.com") throw new Error(`resolution: the note asks root, com, then example.com's server; computed ${servers.join(", ")}`);
  if (r.rr.value !== "203.0.113.10" || r.rr.ttl !== 3600) throw new Error("resolution: the answer must be 203.0.113.10 with TTL 3600");

  const actors = ["Your PC", "Resolver", "Root", "com TLD", "example.com"];
  const ACTOR_OF: Record<string, number> = { root: 2, "com TLD": 3, "ns1.example.com": 4 };
  const xs = [0, 124, 222, 320, 424];
  const PITCH = 38;
  const top = 28;
  const yOf = (k: number) => top + 22 + k * PITCH;
  // Lifelines at uneven spacing: the stub's query label needs the widest gap.
  const placed: Item[] = actors.flatMap((name, i): Item[] => {
    const w = name.length > 9 ? 92 : 80;
    return [
      { k: "edge", id: `ll${i}`, x1: xs[i], y1: top, x2: xs[i], y2: yOf(7) + 22, tone: "faint", dashed: true },
      box(`lb${i}`, xs[i] - w / 2, 0, name, { w, h: top, size: 12 }),
    ];
  });
  type Msg = { from: number; to: number; text: string; reply?: boolean };
  const msgs: Msg[] = [{ from: 0, to: 1, text: `A? ${NAME}` }];
  r.asked.forEach((a) => {
    const to = ACTOR_OF[a.server];
    if (to === undefined) throw new Error(`resolution: no lifeline for ${a.server}`);
    msgs.push({ from: 1, to, text: "same query" });
    msgs.push({ from: to, to: 1, text: a.reply.answer ? `A ${a.reply.answer.value}` : `NS for ${a.reply.referral!.name}`, reply: true });
  });
  msgs.push({ from: 1, to: 0, text: `A ${r.rr.value}`, reply: true });
  const ends = [1, 3, 5, 7, 8]; // messages shown by each frame
  const draw = (f: number): Item[] => {
    const items: Item[] = [...placed];
    const upto = ends[f];
    const fresh = f === 0 ? 0 : ends[f - 1];
    msgs.slice(0, upto).forEach((m, k) => {
      const tone = k >= fresh ? "accent" : "ink";
      items.push(...message(`m${k}`, xs[m.from], xs[m.to], yOf(k), m.text, { drop: 10, tone, dashed: m.reply }));
    });
    items.push(label("rec", "recursive", (xs[0] + xs[1]) / 2, yOf(0) + 22, { tone: f === 0 ? "accent" : "faint", size: 10.5, weight: 600 }));
    if (f >= 1) {
      // A bracket beside the resolver over the queries it chases itself.
      const y1 = yOf(1) - 4;
      const y2 = yOf(Math.min(ends[f], 7) - 1) + 14;
      const bx = xs[1] - 10;
      const tone = f <= 3 ? "accent" : "faint";
      items.push({ k: "path", id: "itb", pts: [[bx + 5, y1], [bx, y1], [bx, y2], [bx + 5, y2]], tone: tone === "accent" ? "accent" : "faint", width: 1.4 });
      items.push(label("it", "iterative", bx - 6, (y1 + y2) / 2, { anchor: "end", tone: tone === "accent" ? "accent" : "faint", size: 10.5, weight: 600 }));
    }
    return items;
  };
  const [root, tld, auth] = r.asked;
  const frames: Frame[] = [
    { caption: `Every cache is empty. Your computer's stub resolver sends one recursive query, recursion desired, to its resolver: give me the A record for ${NAME}, the final answer and nothing less.`, items: draw(0) },
    { caption: `The resolver starts at a root server. The root does not know the answer but returns a referral: the name servers for ${root.reply.referral!.name}, with their addresses (glue).`, items: draw(1) },
    { caption: `It asks a ${tld.server} server the same question and gets another referral, to the servers for ${tld.reply.referral!.name}. Each of these queries is iterative: the server answers from what it holds and the resolver does the chasing.`, items: draw(2) },
    { caption: `The zone's authoritative server, ${auth.server}, answers: ${NAME} A ${auth.reply.answer!.value}, TTL ${auth.reply.answer!.ttl}.`, items: draw(3) },
    { caption: `The resolver caches the answer and both referrals, and returns the address to your computer, which caches it too: one question from your computer cost ${r.asked.length} queries upstream.`, items: draw(4) },
  ];
  return finish({ title: "Resolving www.example.com from empty caches", input: `${NAME}, every cache empty`, frames });
}

/* ── Recursive vs iterative ───────────────────────────────────────── */

function queryKinds(): Walkthrough {
  const SERVERS = 3;
  // Recursive: each server asks the next and the answer comes back the same way.
  const recursive: Array<[number, number]> = [];
  for (let i = 0; i < SERVERS; i++) recursive.push([i, i + 1]);
  for (let i = SERVERS; i > 0; i--) recursive.push([i, i - 1]);
  // Iterative: the asker goes to each server in turn and each one replies to it.
  const iterative: Array<[number, number]> = [];
  for (let i = 1; i <= SERVERS; i++) iterative.push([0, i], [i, 0]);
  const sentBy = (ms: Array<[number, number]>, who: number) => ms.filter(([a]) => a === who).length;
  if (sentBy(recursive, 0) !== 1 || sentBy(iterative, 0) !== SERVERS) throw new Error("query-kinds: a recursive asker sends one query, an iterative one sends one per server");

  const names = ["asker", "server 1", "server 2", "server 3"];
  const BW = 70;
  const BH = 26;
  const items: Item[] = [];
  // Recursive: one row, each query arcing over to the next server and each answer back under.
  // (An edge's positive bow curves to the right of its direction, so a negative one lifts a rightward arrow and drops a leftward one.)
  const X = (i: number) => i * 96;
  const RY = 60;
  items.push(label("rt", "Recursive: each server chases for you", X(0) - BW / 2, RY - 50, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  names.forEach((nm, i) => items.push(box(`r${i}`, X(i) - BW / 2, RY, nm, { w: BW, h: BH, size: 11, tone: i === 0 ? "accent" : "plain" })));
  recursive.forEach(([a, b], k) => {
    const out = b > a;
    const ey = out ? RY - 3 : RY + BH + 3;
    const x1 = X(a) + (out ? 8 : -8);
    const x2 = X(b) + (out ? -8 : 8);
    items.push(arrow(`ra${k}`, { x: x1, y: ey }, { x: x2, y: ey }, { tone: a === 0 ? "accent" : "ink", bow: -10 }));
    items.push(label(`rn${k}`, String(k + 1), (x1 + x2) / 2, out ? ey - 14 : ey + 14, { tone: "soft", size: 10.5, mono: true }));
  });
  // Iterative: the asker on the left, a query to each server above its line and the reply below.
  const IY = 228;
  const SX = 220;
  const SDY = 60;
  items.push(label("it", "Iterative: the asker chases, step by step", X(0) - BW / 2, IY - SDY - 40, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  items.push(box("i0", -BW / 2, IY - BH / 2, names[0], { w: BW, h: BH, size: 11, tone: "accent" }));
  iterative.forEach(([a, b], k) => {
    const s = a === 0 ? b : a;
    const dy = (s - 2) * SDY;
    const near = { x: BW / 2 + 4, y: IY + dy * 0.2 };
    const far = { x: SX - BW / 2 - 4, y: IY + dy };
    const off = a === 0 ? -5 : 5;
    const from = a === 0 ? near : far;
    const to = a === 0 ? far : near;
    items.push(arrow(`ia${k}`, { x: from.x, y: from.y + off }, { x: to.x, y: to.y + off }, { tone: a === 0 ? "accent" : "ink" }));
    items.push(label(`in${k}`, String(k + 1), far.x - 22, far.y - (far.y - near.y) * (22 / (far.x - near.x)) + off + (a === 0 ? -9 : 10), { tone: "soft", size: 10.5, mono: true }));
  });
  for (let i = 1; i <= SERVERS; i++) items.push(box(`i${i}`, SX - BW / 2, IY + (i - 2) * SDY - BH / 2, names[i], { w: BW, h: BH, size: 11 }));
  return finish({
    title: "Recursive and iterative queries",
    input: "",
    frames: [
      {
        caption: `In a recursive query the asker sends ${sentBy(recursive, 0)} message and waits while each server asks the next, ${recursive.length} messages in all. In an iterative one each server only refers, so the asker sends ${sentBy(iterative, 0)} queries itself. Your stub asks recursively; resolvers ask iteratively.`,
        items,
      },
    ],
  });
}

/* ── Caching and TTL ──────────────────────────────────────────────── */

function caching(): Walkthrough {
  const resolver = new Resolver();
  const lookups = [
    { t: 0, name: "www.example.com" },
    { t: 600, name: "mail.example.com" },
    { t: 1800, name: "www.example.com" },
    { t: 4000, name: "www.example.com" },
  ];
  const runs = lookups.map((l) => ({ ...l, ...resolver.resolve(l.name, l.t), cache: [...resolver.cache.values()].map((e) => ({ ...e })) }));
  const counts = runs.map((r) => r.asked.length);
  if (counts.join() !== "3,1,0,1") throw new Error(`caching: expected 3, 1, 0 and 1 queries; computed ${counts.join(", ")}`);

  const TW = 430;
  const TMAX = 4400;
  const tx = (t: number) => (t / TMAX) * TW;
  const ROWS = ["com NS", "example.com NS", "www.example.com A", "mail.example.com A"];
  const keyOf = (row: string) => {
    const [name, type] = row.split(" ");
    return `${name} ${type}`;
  };
  const TY = 120;
  const RH = 26;
  const draw = (k: number): Item[] => {
    const run = runs[k];
    const items: Item[] = [{ k: "path", id: "ax", pts: [[0, 40], [TW, 40]], tone: "ink", width: 1.2 }];
    for (const t of [0, 1000, 2000, 3000, 4000]) items.push(label(`t${t}`, `${n(t)} s`, tx(t), 54, { tone: "faint", size: 10, mono: true }));
    runs.forEach((r, i) => {
      if (i > k) return;
      const tone: TextTone = i === k ? "accent" : "soft";
      items.push({ k: "ptr", id: `lk${i}`, x: tx(r.t), y: 34, label: "", tone: i === k ? "accent" : "ink", up: false });
      items.push(label(`lkt${i}`, `${r.name.split(".")[0]}: ${r.asked.length} ${r.asked.length === 1 ? "query" : "queries"}`, tx(r.t), i % 2 === 0 ? 4 : -12, { tone, size: 11, weight: i === k ? 600 : undefined }));
    });
    // The cache as the resolver holds it right after this lookup.
    items.push(label("ch1", "resolver's cache", 0, TY - 16, { anchor: "start", tone: "soft", size: 11, weight: 600 }));
    items.push(label("ch2", "TTL (s)", 268, TY - 16, { anchor: "middle", tone: "soft", size: 11, weight: 600 }));
    items.push(label("ch3", `left at ${n(run.t)} s`, 370, TY - 16, { anchor: "middle", tone: "soft", size: 11, weight: 600 }));
    const touched = new Set(run.asked.map((a) => (a.reply.answer ? `${a.reply.answer.name} A` : `${a.reply.referral!.name} NS`)));
    if (run.hit) touched.add(`${run.name} A`);
    if (run.from) touched.add(run.from);
    ROWS.forEach((row, i) => {
      const e = run.cache.find((c) => `${c.rr.name} ${c.rr.type}` === keyOf(row));
      const y = TY + i * (RH + 4);
      if (!e) {
        items.push(box(`c${i}`, 0, y, row, { w: 216, h: RH, size: 11, tone: "ghost" }));
        return;
      }
      const left = e.expires - run.t;
      const tone: Tone = touched.has(keyOf(row)) ? "accent" : left <= 0 ? "muted" : "plain";
      items.push(box(`c${i}`, 0, y, row, { w: 216, h: RH, size: 11, tone }));
      items.push(box(`cv${i}`, 224, y, n(e.rr.ttl), { w: 88, h: RH, size: 11, tone: "plain" }));
      items.push(box(`cl${i}`, 320, y, left > 0 ? `${n(left)} s` : "expired", { w: 100, h: RH, size: 11, tone: left > 0 ? "plain" : "muted" }));
    });
    return items;
  };
  const [cold, mail, hit, stale] = runs;
  const wwwOf = (r: (typeof runs)[number]) => r.cache.find((c) => c.rr.name === "www.example.com")!;
  const leftAtHit = wwwOf(hit).expires - hit.t;
  const expiredAt = wwwOf(cold).expires;
  if (leftAtHit <= 0 || stale.t <= expiredAt) throw new Error("caching: the third lookup must hit and the fourth find it expired");
  const frames: Frame[] = [
    { caption: `At 0 s the cache is empty, so looking up www.example.com takes ${cold.asked.length} queries: root, com and example.com. The answer and both referrals are cached, each with its own TTL.`, items: draw(0) },
    { caption: `At ${n(mail.t)} s mail.example.com is new, but the referral to example.com's servers is still cached, so the resolver goes straight there: ${mail.asked.length} query instead of three.`, items: draw(1) },
    { caption: `At ${n(hit.t)} s www.example.com is asked again. Its A record has ${n(leftAtHit)} of its ${n(wwwOf(hit).rr.ttl)} seconds left, so the resolver answers from memory without sending a query.`, items: draw(2) },
    { caption: `At ${n(stale.t)} s the record expired ${n(stale.t - expiredAt)} seconds ago, so the resolver asks example.com's server again, still holding the referral, and the fresh answer starts a new hour.`, items: draw(3) },
  ];
  return finish({ title: "A resolver's cache over an hour and more", input: "lookups at 0 s, 600 s, 1,800 s and 4,000 s; www and mail have TTL 3600", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  hierarchy,
  resolution,
  "query-kinds": queryKinds,
  caching,
};
