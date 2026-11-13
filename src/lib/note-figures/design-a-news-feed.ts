import { bandOver, finish, spanOver, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { database, packet, service, wire } from "./sd-kit.js";

/**
 * Design a News Feed: the case study's figures (content/notes/
 * system-design/design-a-news-feed.md). Every figure loops (a points
 * subject), and every value it draws is computed by running the strategy
 * it names over a small follow graph:
 *
 *  - fan-out-write: a new post is pushed into every follower's feed cache,
 *    one write per follower, so reading a feed is one cache read.
 *  - fan-out-read: nothing is precomputed; opening the feed pulls each
 *    followed account's recent posts and merges them by time.
 *  - hybrid: ordinary accounts fan out on write, an account over the
 *    follower threshold does not, and its posts are pulled and merged at
 *    read time — the write counts are the rule applied to each account.
 *  - cursor: page 2 by offset repeats a post when a new one lands on top;
 *    page 2 by cursor ("older than the last one I saw") does not.
 */

/* ── Fan-out on write ─────────────────────────────────────────────── */

function fanOutWrite(): Walkthrough {
  const followers: Record<string, string[]> = { Asha: ["Ben", "Chen", "Dev", "Eli"] };
  const feeds: Record<string, string[]> = { Ben: ["p7", "p5"], Chen: ["p6"], Dev: ["p7", "p4"], Eli: [] };
  const author = "Asha";
  const post = "p9";
  const fs = followers[author];
  const RY = (i: number) => i * 44;
  const frames: Frame[] = [];
  let writes = 0;
  const draw = (stage: "post" | "worker" | number, caption: string) => {
    const a = service("author", 0, 58, `${author} posts`, { w: 92, tone: stage === "post" ? "accent" : "plain" });
    const w = service("worker", 128, 58, "Fan-out worker", { w: 108, tone: typeof stage === "number" || stage === "worker" ? "accent" : "plain", sub: `writes: ${writes}` });
    const items: Item[] = [...a.items, ...w.items, wire("aw", a.right, w.left, { tone: stage === "worker" ? "accent" : "line" })];
    fs.forEach((f, i) => {
      const y = RY(i);
      items.push(label(`n${i}`, f, 280, y + 13, { anchor: "start", size: 12, tone: stage === i ? "accent" : "soft" }));
      items.push(wire(`wf${i}`, w.right, { x: 274, y: y + 13 }, { tone: stage === i ? "accent" : "faint" }));
      feeds[f].forEach((p, k) => items.push(box(`${f}-${p}`, 322 + k * 40, y, p, { w: 34, h: 26, size: 11, tone: p === post && stage === i ? "accent" : p === post ? "strong" : "plain" })));
    });
    items.push(label("cap", "feed caches, newest first", 280, RY(fs.length) + 4, { anchor: "start", size: 11, tone: "faint" }));
    if (stage === "post") items.push(packet(post, { x: a.mid.x, y: a.top.y - 16 }, { text: post }));
    if (stage === "worker") items.push(packet(post, { x: w.mid.x, y: w.top.y - 16 }, { text: post }));
    frames.push({ caption, items });
  };
  draw("post", `${author} publishes ${post}. With fan-out on write, the work of building feeds happens now, at post time.`);
  draw("worker", `A fan-out worker takes the post from a queue and reads ${author}'s follower list: ${fs.length} followers.`);
  fs.forEach((f, i) => {
    feeds[f].unshift(post);
    writes += 1;
    draw(i, i === 0 ? `${post} is prepended to ${f}'s feed cache, a short list of post ids kept in memory (Redis, for example).` : i === fs.length - 1 ? `${f} gets it too: ${writes} writes for ${writes} followers. Reading any of these feeds is now a single cache read.` : `Then ${f}'s feed: write number ${writes}. The cost of a post grows with its author's follower count.`);
  });
  if (writes !== fs.length || fs.some((f) => feeds[f][0] !== post)) throw new Error("fan-out-write: every follower's feed should start with the post");
  return finish({ title: "Fan-out on write: push the post into every follower's feed", input: "", frames });
}

/* ── Fan-out on read ──────────────────────────────────────────────── */

interface Post {
  id: string;
  at: string; // HH:MM, sortable as text
}

function fanOutRead(): Walkthrough {
  const follows = ["Asha", "Chen", "Dev"];
  const recent: Record<string, Post[]> = {
    Asha: [{ id: "a9", at: "10:05" }, { id: "a8", at: "08:40" }],
    Chen: [{ id: "c4", at: "09:30" }],
    Dev: [{ id: "d7", at: "10:12" }, { id: "d6", at: "07:15" }],
  };
  const LIMIT = 3;
  const candidates: Post[] = [];
  const frames: Frame[] = [];
  const CW = 76;
  const draw = (pulling: number | null, merged: Post[] | null, caption: string) => {
    const ben = service("ben", 0, 50, "Ben opens feed", { w: 112, tone: pulling === null && !merged ? "accent" : "plain" });
    const items: Item[] = [...ben.items];
    follows.forEach((f, i) => {
      const y = i * 40;
      items.push(label(`n${i}`, f, 168, y + 14, { anchor: "start", size: 12, tone: pulling === i ? "accent" : "soft" }));
      items.push(wire(`w${i}`, ben.right, { x: 160, y: y + 14 }, { tone: pulling === i ? "accent" : "faint" }));
      recent[f].forEach((p, k) => {
        const took = candidates.includes(p);
        if (!took) items.push(box(p.id, 210 + k * (CW + 6), y, `${p.id} ${p.at}`, { w: CW, h: 28, size: 11, tone: "plain" }));
      });
    });
    const rowY = 150;
    const order = merged ?? candidates;
    order.forEach((p, k) => {
      const tone: Tone = merged ? (k < LIMIT ? "strong" : "muted") : candidates.indexOf(p) >= candidates.length - recent[follows[pulling ?? 0]].length ? "accent" : "plain";
      items.push(box(p.id, k * (CW + 6), rowY, `${p.id} ${p.at}`, { w: CW, h: 28, size: 11, tone }));
    });
    items.push(label("rl", merged ? `merged newest first; the top ${LIMIT} are the page` : "gathered at read time", 0, rowY + 44, { anchor: "start", size: 11, tone: "faint" }));
    frames.push({ caption, items });
  };
  draw(null, null, `Nothing was precomputed. When Ben opens his feed, the feed service reads who he follows: ${follows.join(", ")}.`);
  follows.forEach((f, i) => {
    candidates.push(...recent[f]);
    draw(i, null, i === 0 ? `It queries ${f}'s recent posts. Each followed account costs a query on every feed load.` : `Then ${f}'s: ${candidates.length} candidates so far. Posting was free, but reading does all the work.`);
  });
  const merged = [...candidates].sort((a, b) => (a.at < b.at ? 1 : -1));
  const page = merged.slice(0, LIMIT);
  if (page[0].id !== "d7" || page.length !== LIMIT) throw new Error("fan-out-read: the newest post should lead the page");
  draw(null, merged, `The ${candidates.length} candidates are merged by time and the newest ${LIMIT} returned: ${page.map((p) => p.id).join(", ")}. Fine for a few hundred follows, slow for thousands.`);
  return finish({ title: "Fan-out on read: pull from everyone you follow, then merge", input: "", frames });
}

/* ── Hybrid ───────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString("en-US");

function hybrid(): Walkthrough {
  const THRESHOLD = 10_000;
  const authors = [
    { name: "Asha", followers: 120, post: { id: "a1", at: "09:50" } },
    { name: "Ravi", followers: 2_000_000, post: { id: "r1", at: "10:02" } },
  ];
  const pushes = (followers: number) => (followers > THRESHOLD ? 0 : followers);
  const cached = [{ id: "c3", at: "09:10" }]; // already in Ben's feed cache
  const frames: Frame[] = [];
  let cacheWrites = 0;
  const draw = (step: number, caption: string) => {
    const items: Item[] = [];
    authors.forEach((a, i) => {
      const s = service(`au${i}`, 0, i * 70, a.name, { w: 84, tone: step === i + 1 ? "accent" : "plain", sub: `${fmt(a.followers)} followers` });
      items.push(...s.items);
    });
    const cache = service("cache", 230, 0, "Feed caches", { w: 112, tone: step === 1 || step === 3 ? "accent" : "plain", sub: `writes: ${fmt(cacheWrites)}` });
    const posts = database("posts", 230, 76, "Celebrity posts", { w: 112, tone: step === 2 || step === 3 ? "accent" : "plain" });
    items.push(...cache.items, ...posts.items);
    items.push(wire("w0", { x: 84, y: 19 }, cache.left, { tone: step === 1 ? "accent" : "line", label: "push" }));
    items.push(wire("w1", { x: 84, y: 89 }, posts.left, { tone: step === 2 ? "accent" : "line", label: "store once" }));
    items.push(label("rule", `celebrity = more than ${fmt(THRESHOLD)} followers`, 0, -26, { anchor: "start", size: 11, tone: "soft" }));
    // Ben's feed as he reads it.
    const rowY = 170;
    items.push(label("ben", "Ben's feed:", 0, rowY + 14, { anchor: "start", size: 12, tone: step >= 3 ? "accent" : "faint" }));
    const fromCache = step >= 1 ? [authors[0].post, ...cached] : cached;
    const shown = step >= 4 ? [authors[1].post, ...fromCache].sort((a, b) => (a.at < b.at ? 1 : -1)) : fromCache;
    shown.forEach((p, k) => items.push(box(p.id, 90 + k * 82, rowY, `${p.id} ${p.at}`, { w: 76, h: 28, size: 11, tone: step >= 4 ? "strong" : step === 3 && p.id !== "r1" ? "accent" : "plain" })));
    if (step === 3) items.push(box(authors[1].post.id, 268, 116, `${authors[1].post.id} ${authors[1].post.at}`, { w: 76, h: 28, size: 11, tone: "accent" }));
    if (step === 2) items.push(box(authors[1].post.id, 248, 128, `${authors[1].post.id} ${authors[1].post.at}`, { w: 76, h: 28, size: 11, tone: "plain" }));
    frames.push({ caption, items });
  };
  draw(0, `The hybrid: fan out on write for ordinary accounts, but not for celebrities, whose posts would cost millions of writes each.`);
  cacheWrites += pushes(authors[0].followers);
  draw(1, `${authors[0].name} has ${authors[0].followers} followers, under the threshold, so her post is pushed: ${fmt(cacheWrites)} cache writes, cheap.`);
  const saved = authors[1].followers - pushes(authors[1].followers);
  cacheWrites += pushes(authors[1].followers);
  draw(2, `${authors[1].name} has ${fmt(authors[1].followers)} followers, so his post is stored once and not pushed: ${fmt(saved)} feed writes avoided.`);
  draw(3, `When Ben opens his feed, the service reads his precomputed cache and pulls the recent posts of the few celebrities he follows.`);
  draw(4, `The two are merged by time. Writes stay bounded for every author, and each read adds only a handful of celebrity lookups.`);
  if (cacheWrites !== 120) throw new Error("hybrid: only the ordinary account should be pushed");
  return finish({ title: "Hybrid fan-out: push for most accounts, pull for celebrities", input: "", frames });
}

/* ── Cursor pagination ────────────────────────────────────────────── */

function cursor(): Walkthrough {
  const PAGE = 3;
  let feed = [20, 19, 18, 17, 16, 15, 14, 13]; // post ids, newest first
  const page1 = feed.slice(0, PAGE);
  const cursorId = page1[page1.length - 1];
  const frames: Frame[] = [];
  const S = 40;
  const G = 6;
  const draw = (o: { band?: [number, number, string, Tone]; marks?: Map<number, Tone>; note?: string }, caption: string) => {
    const items: Item[] = [];
    if (o.band) {
      const [from, to, text, tone] = o.band;
      items.push(bandOver("band", from, to, { y: 30, size: S, gap: G, tone }));
      items.push(spanOver("span", from, to, text, { y: 30, size: S, gap: G, lift: 14, tone: tone === "error" ? "error" : "accent" }));
    }
    feed.forEach((id, i) => items.push(box(`p${id}`, i * (S + G), 30, `p${id}`, { w: S, h: S, size: 11, tone: o.marks?.get(id) ?? (page1.includes(id) ? "muted" : "plain") })));
    items.push(label("dir", "newest → older", 0, 92, { anchor: "start", size: 11, tone: "faint" }));
    if (o.note) items.push(label("note", o.note, 0, 116, { anchor: "start", size: 12, tone: "ink", mono: true }));
    frames.push({ caption, items });
  };
  draw({ band: [0, PAGE - 1, "page 1", "accent"], marks: new Map(page1.map((id) => [id, "accent" as Tone])), note: `next cursor = p${cursorId}` }, `Page 1 returns the newest ${PAGE} posts, ${page1.map((p) => `p${p}`).join(", ")}, and a cursor naming the last one shown, p${cursorId}.`);
  feed = [21, ...feed];
  draw({ marks: new Map([[21, "accent" as Tone]]) }, `While the reader scrolls, p21 is posted and lands at the top. Every older post shifts down one place.`);
  const byOffset = feed.slice(PAGE, PAGE * 2);
  const dupes = byOffset.filter((id) => page1.includes(id));
  draw({ band: [PAGE, PAGE * 2 - 1, "offset 3", "error"], marks: new Map(byOffset.map((id) => [id, (dupes.includes(id) ? "error" : "plain") as Tone])), note: `LIMIT 3 OFFSET 3` }, `Page 2 by offset skips 3 rows and takes ${byOffset.map((p) => `p${p}`).join(", ")}: p${dupes[0]} is shown twice, because the list moved under the offset.`);
  const byCursor = feed.filter((id) => id < cursorId).slice(0, PAGE);
  const start = feed.indexOf(byCursor[0]);
  draw({ band: [start, start + PAGE - 1, `after p${cursorId}`, "accent"], marks: new Map(byCursor.map((id) => [id, "strong" as Tone])), note: `WHERE id < ${cursorId} LIMIT 3` }, `Page 2 by cursor asks for posts older than p${cursorId}: ${byCursor.map((p) => `p${p}`).join(", ")}. No repeats, no gaps, and an index seek instead of skipping rows.`);
  if (dupes.length !== 1 || byCursor.some((id) => page1.includes(id))) throw new Error("cursor: offset should repeat one post and the cursor none");
  return finish({ title: "Cursor pagination: no repeats when new posts arrive", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "fan-out-write": fanOutWrite,
  "fan-out-read": fanOutRead,
  hybrid: hybrid,
  cursor: cursor,
};
