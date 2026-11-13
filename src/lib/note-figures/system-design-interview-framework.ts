import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";
import { database, service, wire } from "./sd-kit.js";
import { ASSUME } from "./back-of-the-envelope-estimation.js";

/**
 * How to Answer a System Design Interview: the note's figures (content/
 * notes/system-design/system-design-interview-framework.md). Every figure
 * loops (a points subject); the example throughout is the photo app the
 * estimation note works out, and its numbers are taken from the same
 * assumptions (ASSUME), never typed in:
 *
 *  - timeline: a 45-minute interview filled stage by stage, each stage's
 *    start and end summed from the time boxes.
 *  - requirements: statements sorted into functional, non-functional and
 *    out of scope.
 *  - api-data: each functional requirement becomes an endpoint and the
 *    table it reads or writes.
 *  - grows: the design growing from one box, each component added because
 *    a number from the estimate asks for it.
 */

/* ── The timeline ─────────────────────────────────────────────────── */

const STAGES: Array<{ name: string; min: number; say: string }> = [
  { name: "Requirements", min: 5, say: "Ask what the system must do, for whom and at what scale, and agree what is out of scope. Nothing is drawn yet." },
  { name: "Estimates", min: 4, say: "Turn the scale into QPS, storage and bandwidth — only the numbers that will change a decision." },
  { name: "API", min: 4, say: "Write the few endpoints the functional requirements need: method, path, inputs, outputs." },
  { name: "Data model", min: 4, say: "Name the entities, their keys and the store each lives in, chosen by how it is read." },
  { name: "High-level design", min: 10, say: "Draw the boxes end to end so every requirement has a path through them; keep it simple first." },
  { name: "Deep dives", min: 13, say: "Go deep on the one or two parts the interviewer cares about: the hot path, the hard data problem." },
  { name: "Wrap-up", min: 5, say: "Name bottlenecks, failure modes and trade-offs, and what you would do with more time." },
];

function timeline(): Walkthrough {
  const total = STAGES.reduce((s, x) => s + x.min, 0);
  if (total !== 45) throw new Error(`timeline: stages add to ${total} minutes, not 45`);
  const starts = STAGES.map((_, i) => STAGES.slice(0, i).reduce((s, x) => s + x.min, 0));
  const X0 = 124;
  const U = 8;
  const RH = 26;
  const frames: Frame[] = [];
  for (let t = 1; t <= STAGES.length; t++) {
    const items: Item[] = [{ k: "path", id: "axis", pts: [[X0, STAGES.length * RH + 6], [X0 + total * U, STAGES.length * RH + 6]], tone: "ink", width: 1.2 }];
    for (let m = 0; m <= total; m += 15) items.push(label(`m${m}`, `${m} min`, X0 + m * U, STAGES.length * RH + 20, { size: 10, mono: true, tone: "faint" }));
    STAGES.forEach((s, i) => {
      const y = i * RH;
      const now = i === t - 1;
      items.push(label(`n${i}`, s.name, 0, y + 10, { anchor: "start", size: 11.5, tone: i < t ? "ink" : "faint" }));
      if (i >= t) return;
      const tone: Tone = t === STAGES.length ? (now ? "strong" : "plain") : now ? "accent" : "plain";
      items.push({ k: "cell", id: `b${i}`, x: X0 + starts[i] * U, y, w: s.min * U, h: 20, text: `${s.min}`, tone, size: 10.5 });
    });
    const s = STAGES[t - 1];
    const end = starts[t - 1] + s.min;
    const caption = `${s.name}, minutes ${starts[t - 1]}–${end}: ${s.say}`;
    frames.push({ caption, items });
  }
  return finish({ title: "A 45-minute system design interview, stage by stage", input: "", frames });
}

/* ── Requirements ─────────────────────────────────────────────────── */

type Bin = 0 | 1 | 2;
const REQS: Array<{ text: string; bin: Bin; why: string }> = [
  { text: "Upload a photo", bin: 0, why: "It is something a user does, so it is functional." },
  { text: "Feed loads < 200 ms", bin: 1, why: "A latency target says how well, not what: non-functional, and it will call for caching." },
  { text: "Follow another user", bin: 0, why: "Following is a feature, so it joins the functional list." },
  { text: "Comments and DMs", bin: 2, why: "Agreed out of scope for this interview, written down so the design does not drift into it." },
  { text: "Photos are never lost", bin: 1, why: "Durability is a quality, not a feature: it will mean replicated storage." },
  { text: "See a feed of follows", bin: 0, why: "The feed is the core read, the third functional requirement." },
  { text: "Highly available reads", bin: 1, why: "Availability over strict freshness for the feed: a non-functional choice that shapes replication." },
];

function requirements(): Walkthrough {
  const W = 150;
  const COL = [0, 162, 324];
  const HEAD = ["Functional", "Non-functional", "Out of scope"];
  const rowY = (i: number) => 92 + i * 34;
  const frames: Frame[] = [];
  for (let t = 0; t <= REQS.length; t++) {
    const items: Item[] = HEAD.map((h, c) => label(`h${c}`, h, COL[c] + W / 2, 76, { size: 11, weight: 600 }));
    items.push(label("in", "next requirement", 237, 0, { size: 10.5, tone: "faint" }));
    REQS.forEach((r, i) => {
      if (i > t) return;
      if (i === t) {
        if (t < REQS.length) items.push(box(`r${i}`, 162, 12, r.text, { w: W, h: 28, size: 11, tone: "accent" }));
        return;
      }
      const k = REQS.slice(0, i).filter((x) => x.bin === r.bin).length;
      items.push(box(`r${i}`, COL[r.bin], rowY(k), r.text, { w: W, h: 28, size: 11, tone: i === t - 1 ? "accent" : r.bin === 2 ? "muted" : "plain" }));
    });
    const counts = [0, 1, 2].map((b) => REQS.slice(0, t).filter((r) => r.bin === b).length);
    const caption =
      t === 0
        ? `Interview: "Design a photo-sharing app." Requirements come first; here is the first one heard: "${REQS[0].text}".`
        : t === REQS.length
          ? `${REQS[t - 1].why} Sorted: ${counts[0]} functional, ${counts[1]} non-functional, ${counts[2]} out of scope — confirm the list before drawing.`
          : `"${REQS[t - 1].text}": ${REQS[t - 1].why}`;
    frames.push({ caption, items });
  }
  return finish({ title: "Requirements sorted: functional, non-functional, out of scope", input: "", frames });
}

/* ── API and data model ───────────────────────────────────────────── */

function apiData(): Walkthrough {
  const rows = REQS.filter((r) => r.bin === 0).map((r) => {
    if (r.text.startsWith("Upload")) return { req: r.text, api: "POST /photos", table: "photos(id, owner, url)", kind: "writes" };
    if (r.text.startsWith("Follow")) return { req: r.text, api: "POST /follows", table: "follows(follower, followee)", kind: "writes" };
    return { req: r.text, api: "GET /feed?cursor=", table: "reads follows → photos", kind: "reads" };
  });
  if (rows.length !== 3) throw new Error("api-data: expected three functional requirements");
  const X = [0, 150, 300];
  const W = [138, 138, 186];
  const frames: Frame[] = [];
  for (let t = 0; t <= rows.length; t++) {
    const items: Item[] = [
      label("h0", "requirement", X[0] + W[0] / 2, 0, { size: 11, weight: 600 }),
      label("h1", "endpoint", X[1] + W[1] / 2, 0, { size: 11, weight: 600 }),
      label("h2", "data", X[2] + W[2] / 2, 0, { size: 11, weight: 600 }),
    ];
    rows.forEach((r, i) => {
      const y = 14 + i * 50;
      const now = i === t - 1;
      const shown = i < t;
      items.push(box(`q${i}`, X[0], y, r.req, { w: W[0], h: 30, size: 11, tone: now ? "accent" : "plain" }));
      items.push(box(`a${i}`, X[1], y, shown ? r.api : "", { w: W[1], h: 30, size: 10.5, tone: now ? "accent" : shown ? "plain" : "muted" }));
      items.push(box(`d${i}`, X[2], y, shown ? r.table : "", { w: W[2], h: 30, size: 10.5, tone: t === rows.length && shown ? "strong" : now ? "accent" : shown ? "plain" : "muted" }));
      if (shown) {
        items.push(arrow(`x${i}`, { x: X[0] + W[0], y: y + 15 }, { x: X[1], y: y + 15 }, { tone: now ? "accent" : "line" }));
        items.push(arrow(`y${i}`, { x: X[1] + W[1], y: y + 15 }, { x: X[2], y: y + 15 }, { tone: now ? "accent" : "line" }));
      }
    });
    const caption =
      t === 0
        ? "Each functional requirement becomes one endpoint, and each endpoint names the data it reads or writes. Nothing else is invented."
        : t === rows.length
          ? `"${rows[t - 1].req}" is GET /feed, paged by a cursor; it ${rows[t - 1].kind} the other two tables. Two tables answer all three requirements.`
          : `"${rows[t - 1].req}" becomes ${rows[t - 1].api}, which ${rows[t - 1].kind} ${rows[t - 1].table.split("(")[0]}.`;
    frames.push({ caption, items });
  }
  return finish({ title: "From requirements to endpoints to tables", input: "", frames });
}

/* ── The design grows ─────────────────────────────────────────────── */

function grows(): Walkthrough {
  const DAY = 86_400;
  const peakRead = ((ASSUME.dau * ASSUME.viewsPerUser) / DAY) * ASSUME.peak;
  const PER_SERVER = 2_000; // assumed requests per second one app server handles
  const HIT = 0.8; // assumed cache hit ratio
  const servers = Math.ceil(peakRead / PER_SERVER);
  const dbReads = peakRead * (1 - HIT);
  const egressGB = (peakRead * ASSUME.photoMB) / 1000;
  const k = (n: number) => `${+(n / 1000).toFixed(1)}K`;
  const captions = [
    "Start with the simplest design that meets the functional requirements: a client, one app server, one database.",
    `The estimate says about ${k(peakRead)} reads a second at peak. At an assumed ${k(PER_SERVER)} per server that is ${servers} app servers behind a load balancer.`,
    `Reads repeat, so a cache goes in front of the database. At an assumed ${HIT * 100}% hit ratio the database sees about ${k(dbReads)} reads a second instead of ${k(peakRead)}.`,
    `Photo bytes leave the database: they go to object storage, and a CDN serves the ${+egressGB.toFixed(1)} GB/s of peak views from its edges.`,
    "Thumbnails need not hold up an upload, so the app queues the work and a worker does it. Every box now traces back to a requirement or a number.",
  ];
  const frames: Frame[] = [];
  for (let t = 0; t < captions.length; t++) {
    const on = (step: number): Tone => (t === step ? "accent" : "plain");
    const client = service("client", 0, 90, "Client", { w: 80 });
    const app = service("app", 236, 90, "App server", { w: 96, tone: t === 0 ? "accent" : on(1), sub: t >= 1 ? `× ${servers}` : undefined });
    const db = database("db", 384, 90, "Database", { w: 96, tone: t === 0 ? "accent" : "plain", sub: t >= 2 ? `≈ ${k(dbReads)} reads/s` : undefined });
    const items: Item[] = [...client.items, ...app.items, ...db.items, wire("app-db", app.right, { x: db.left.x, y: app.right.y })];
    if (t >= 1) {
      const lb = service("lb", 112, 90, "Load balancer", { w: 96, tone: on(1), size: 11 });
      items.push(...lb.items, wire("c-lb", client.right, lb.left), wire("lb-app", lb.right, app.left));
    } else items.push(wire("c-lb", client.right, app.left));
    if (t >= 2) {
      const cache = service("cache", 384, 0, "Cache", { w: 96, tone: on(2) });
      items.push(...cache.items, wire("app-cache", { x: app.right.x, y: app.top.y + 8 }, cache.left, { tone: t === 2 ? "accent" : "line" }));
    }
    if (t >= 3) {
      const obj = service("obj", 236, 0, "Object store", { w: 96, tone: on(3), size: 11 });
      const cdn = service("cdn", 0, 0, "CDN", { w: 80, tone: on(3) });
      items.push(...obj.items, ...cdn.items, wire("cdn-obj", cdn.right, obj.left, { tone: t === 3 ? "accent" : "line", label: "pull" }), wire("c-cdn", client.top, cdn.bottom, { tone: t === 3 ? "accent" : "line" }), wire("app-obj", app.top, obj.bottom, { tone: t === 3 ? "accent" : "line" }));
    }
    if (t >= 4) {
      const q = service("queue", 236, 186, "Queue", { w: 96, tone: on(4) });
      const w = service("worker", 384, 186, "Worker", { w: 96, tone: on(4) });
      items.push(...q.items, ...w.items, wire("app-q", { x: app.bottom.x + 30, y: app.bottom.y }, { x: q.top.x + 30, y: q.top.y }, { tone: "accent" }), wire("q-w", q.right, w.left, { tone: "accent" }));
    }
    frames.push({ caption: captions[t], items });
  }
  return finish({ title: "The design grows from one box, one reason at a time", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  timeline,
  requirements,
  "api-data": apiData,
  grows,
};
