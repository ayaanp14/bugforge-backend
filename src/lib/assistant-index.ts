/**
 * The assistant's briefing, split up so a question is answered from the
 * parts of it that matter (services/assistant.ts).
 *
 * The whole briefing — the handbook, the plan table and every stage of the
 * road, ~81 KB, ~21k tokens — used to go into every message. Most questions
 * turn on one section of it; the free-tier model got slower and less
 * accurate with the answer somewhere in the middle of 21k tokens (asked what
 * the roadmap's first chest holds, it answered "19 stages. 19 stages 2. +30
 * XP"), and a prompt that size is what the provider sheds first when it is
 * overloaded (2026-09-24). So the briefing is cut into chunks here — each a
 * few consecutive bullets under its section's heading, small enough to be
 * about one thing and labelled well enough to stand alone — and a question
 * picks the few that score best against it.
 *
 * Scoring is BM25 over words, in process: no embedding model, no second
 * provider, no round trip. The handbook is written in the product's own
 * words, and a question about the product mostly uses them; the gaps
 * ("cost" for a plan, "leave" for a forfeit) are the alias table's job.
 * A section's heading counts three times, so "duels" lands on the Duels
 * section before a passing mention elsewhere.
 */

export interface BriefingChunk {
  /** Stable id: `<section slug>#<n>`. */
  id: string;
  /** The section heading it belongs to, e.g. "Duels — `/duels`". */
  section: string;
  /** Rendered text: the heading, then the chunk's own lines. */
  text: string;
  /** Position in the briefing, so picked chunks are shown in reading order. */
  order: number;
}

/** A chunk grows until the next piece would take it past this. */
const CHUNK_CHARS = 1100;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/`[^`]*`/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Split a markdown briefing at its `## ` headings, then pack each section's
 * pieces (a bullet with its continuation lines, a paragraph, a `###` block's
 * heading with what follows) into chunks of up to CHUNK_CHARS. A piece larger
 * than that is a chunk of its own rather than being cut mid-sentence. Text
 * before the first `## ` is its own section under the document's title.
 */
export function chunkBriefing(markdown: string, startOrder = 0): BriefingChunk[] {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const sections: Array<{ title: string; body: string[] }> = [];
  let current: { title: string; body: string[] } = { title: (lines[0] ?? "").replace(/^#\s*/, "") || "Overview", body: [] };
  for (const line of lines.slice(lines[0]?.startsWith("# ") ? 1 : 0)) {
    if (line.startsWith("## ")) {
      if (current.body.some((l) => l.trim())) sections.push(current);
      current = { title: line.slice(3).trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.body.some((l) => l.trim())) sections.push(current);

  const chunks: BriefingChunk[] = [];
  let order = startOrder;
  for (const section of sections) {
    // Pieces: a blank line ends one; a new bullet or a ### heading starts one.
    const pieces: string[] = [];
    let piece: string[] = [];
    let sub = "";
    const flush = () => {
      const text = piece.join("\n").trim();
      if (text) pieces.push(text);
      piece = [];
    };
    for (const line of section.body) {
      if (!line.trim()) {
        flush();
        continue;
      }
      if (line.startsWith("### ")) {
        flush();
        sub = line.slice(4).trim();
        continue;
      }
      if (/^\s{0,1}[-*] /.test(line) || /^\d+\. /.test(line)) flush();
      // A piece under a ### carries its subheading, so it still says what it is about.
      if (!piece.length && sub) piece.push(`(${sub})`);
      piece.push(line);
    }
    flush();

    const heading = `## ${section.title}`;
    const base = slug(section.title) || "section";
    let packed: string[] = [];
    let size = 0;
    let n = 0;
    const emit = () => {
      if (!packed.length) return;
      chunks.push({ id: `${base}#${n++}`, section: section.title, text: `${heading}\n\n${packed.join("\n")}`, order: order++ });
      packed = [];
      size = 0;
    };
    for (const p of pieces) {
      if (size && size + p.length > CHUNK_CHARS) emit();
      packed.push(p);
      size += p.length + 1;
    }
    emit();
  }
  return chunks;
}

/* ── scoring ─────────────────────────────────────────────────────── */

const STOP = new Set(
  "a an and are as at be but by can do does for from how i if in is it its me my of on or so that the this to was what when where which who why will with you your yours am im i'm there their them they we our us get got have has had".split(
    " ",
  ),
);

/** Lower-case words, a crude stem (plural, -ing, -ed), stop words dropped. */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (raw.length < 2 || STOP.has(raw)) continue;
    let w = raw;
    if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
    else if (w.length > 4 && w.endsWith("ies")) w = `${w.slice(0, -3)}y`;
    else if (w.length > 3 && w.endsWith("es") && /(ch|sh|x|ss)es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    out.push(w);
  }
  return out;
}

/**
 * Words people use that the handbook does not, mapped to words it does.
 * Plain words; stemmed once below. Kept short on purpose: each entry is a
 * phrasing a question uses for a section that says it differently.
 */
const ALIASES: Record<string, string[]> = {
  cost: ["price", "plan", "month"],
  price: ["plan", "month"],
  pricing: ["plan", "price"],
  pay: ["plan", "billing", "payment"],
  paid: ["plan", "billing"],
  subscription: ["plan", "billing"],
  subscribe: ["plan", "billing"],
  upgrade: ["plan", "billing"],
  refund: ["billing", "payment", "support"],
  cancel: ["billing", "plan"],
  premium: ["plan", "pro"],
  free: ["plan"],
  leave: ["forfeit", "left", "claim"],
  left: ["claim", "forfeit"],
  quit: ["forfeit"],
  abandon: ["claim", "left"],
  opponent: ["duel"],
  battle: ["duel"],
  versu: ["duel"],
  "1v1": ["duel"],
  compete: ["duel", "contest", "leaderboard"],
  cheat: ["strike", "disqualified"],
  screenshot: ["strike", "capture"],
  copy: ["clipboard", "strike"],
  paste: ["clipboard", "strike"],
  roadmap: ["road", "stage", "tier"],
  chest: ["tier", "road"],
  stage: ["road", "roadmap"],
  course: ["study", "plan", "track", "lesson"],
  learn: ["study", "lesson"],
  certificate: ["certificate", "study", "roadmap"],
  cv: ["resume"],
  ats: ["resume"],
  job: ["resume"],
  interview: ["mock", "interview"],
  voice: ["interview", "voice"],
  aptitude: ["aptitude", "quantitative"],
  placement: ["test", "placement"],
  mock: ["interview", "test"],
  bug: ["hunt"],
  debug: ["bug", "hunt"],
  streak: ["streak", "daily"],
  daily: ["contest", "streak"],
  xp: ["xp", "rating", "rank"],
  level: ["rank", "xp"],
  rank: ["rank", "xp", "rating"],
  login: ["sign", "account", "password"],
  signup: ["register", "account"],
  password: ["password", "reset", "account"],
  email: ["email", "verification", "account"],
  delete: ["account", "privacy"],
  friend: ["pair", "room", "private"],
  pair: ["pair", "room"],
  collaborate: ["pair", "room"],
  post: ["community"],
  notification: ["notification", "reminder"],
  support: ["support", "help", "contact"],
  contact: ["support", "contact"],
  help: ["support", "help"],
  dark: ["theme"],
  mobile: ["device", "phone"],
  language: ["language"],
  limit: ["allowance", "plan"],
  quota: ["allowance", "plan"],
};

/** The table in stems, as `tokens` produces them — written in plain words above so it reads. */
const STEMMED_ALIASES: Map<string, string[]> = (() => {
  const out = new Map<string, string[]>();
  for (const [key, values] of Object.entries(ALIASES)) {
    const k = tokens(key)[0] ?? key;
    const vs = values.flatMap((v) => tokens(v));
    out.set(k, [...new Set([...(out.get(k) ?? []), ...vs])]);
  }
  return out;
})();

export interface BriefingIndex {
  chunks: BriefingChunk[];
  search(query: string, opts?: { maxChars?: number; minScore?: number; max?: number; relative?: number }): BriefingChunk[];
}

export function buildIndex(chunks: BriefingChunk[]): BriefingIndex {
  const k1 = 1.4;
  const b = 0.75;
  // A section's heading is weighted by repeating its words.
  const docs = chunks.map((c) => {
    const words = [...tokens(c.section), ...tokens(c.section), ...tokens(c.section), ...tokens(c.text)];
    const tf = new Map<string, number>();
    for (const w of words) tf.set(w, (tf.get(w) ?? 0) + 1);
    return { tf, len: words.length };
  });
  const avg = docs.reduce((n, d) => n + d.len, 0) / Math.max(1, docs.length);
  const df = new Map<string, number>();
  for (const d of docs) for (const w of d.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  const idf = (w: string) => {
    const n = df.get(w) ?? 0;
    return Math.log(1 + (chunks.length - n + 0.5) / (n + 0.5));
  };

  return {
    chunks,
    search(query, { maxChars = 9000, minScore = 1.2, max = 10, relative = 0.4 } = {}) {
      const base = tokens(query);
      if (!base.length) return [];
      // Aliases count half: they widen a question, they do not outvote it.
      const weights = new Map<string, number>();
      for (const w of base) weights.set(w, (weights.get(w) ?? 0) + 1);
      for (const w of base) for (const a of STEMMED_ALIASES.get(w) ?? []) if (!weights.has(a)) weights.set(a, 0.5);

      const scored = docs
        .map((d, i) => {
          let s = 0;
          for (const [w, weight] of weights) {
            const f = d.tf.get(w);
            if (!f) continue;
            s += weight * idf(w) * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg)));
          }
          return { i, s };
        })
        .filter((x) => x.s >= minScore)
        .sort((x, y) => y.s - x.s);
      // Only what is in reach of the best match: a section that merely
      // mentions a word of the question is noise the model has to read past.
      const floor = (scored[0]?.s ?? 0) * relative;
      const strong = scored.filter((x) => x.s >= floor);

      const picked: BriefingChunk[] = [];
      let used = 0;
      for (const { i } of strong) {
        const c = chunks[i];
        if (used + c.text.length > maxChars) continue;
        picked.push(c);
        used += c.text.length;
        if (picked.length >= max) break;
      }
      return picked.sort((x, y) => x.order - y.order);
    },
  };
}

/**
 * Picked chunks as one briefing: consecutive chunks of a section share one
 * heading instead of repeating it.
 */
export function renderChunks(chunks: BriefingChunk[]): string {
  const out: string[] = [];
  let section = "";
  for (const c of chunks) {
    const body = c.text.slice(c.text.indexOf("\n\n") + 2);
    if (c.section !== section) {
      out.push(`## ${c.section}\n\n${body}`);
      section = c.section;
    } else {
      out.push(body);
    }
  }
  return out.join("\n\n");
}
