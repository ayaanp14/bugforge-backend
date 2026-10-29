import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { database, packet, service, wire, type NodeBox, type Pt } from "./sd-kit.js";

/**
 * Introduction to System Design: the note's figures (content/notes/
 * system-design/introduction-to-system-design.md). Every figure loops (a
 * points subject), and every number drawn is computed here:
 *
 *  - request-life: one request's trip — DNS lookup, the app server, the
 *    database and back — as a single packet gliding stop to stop; the round
 *    trips are counted from the route, not typed.
 *  - requirements: a URL shortener's requirements sorted into functional and
 *    non-functional, one a frame; the 99.9% chip's yearly downtime is computed.
 *  - estimate: back-of-the-envelope QPS and storage from stated assumptions,
 *    one line of arithmetic a frame.
 *  - latency-ladder: approximate, widely quoted latencies on a log scale, one
 *    rung a frame, each compared with the rung before it.
 */

/** 1234567 → "1,234,567". */
const commas = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ── A request's life ─────────────────────────────────────────────── */

type Stop = "client" | "dns" | "server" | "db";

function requestLife(): Walkthrough {
  const client = service("client", 0, 120, "Client", { w: 92 });
  const dns = service("dns", 176, 10, "DNS", { w: 92 });
  const server = service("server", 170, 120, "App server", { w: 104 });
  const db = database("db", 360, 120, "Database", { w: 100 });
  const boxes: Record<Stop, NodeBox> = { client, dns, server, db };
  const at: Record<Stop, Pt> = {
    client: { x: client.mid.x, y: client.top.y - 18 },
    dns: { x: dns.right.x + 18, y: dns.mid.y },
    server: { x: server.mid.x, y: server.top.y - 18 },
    db: { x: db.mid.x, y: db.top.y - 18 },
  };
  const wires = { "c-dns": [client.right, dns.left], "c-s": [client.right, server.left], "s-db": [server.right, db.left] } as const;
  type WireId = keyof typeof wires;
  // The route, as the stops the request visits and the wire it crossed to get there.
  const route: Array<{ stop: Stop; via: WireId | null; msg: string; caption: string }> = [
    { stop: "client", via: null, msg: "codekairo.com", caption: "A user opens the site. The browser has a name, not an address, so before anything else it must find which machine answers for that name." },
    { stop: "dns", via: "c-dns", msg: "where is codekairo.com?", caption: "The browser asks DNS, the internet's phone book, for the domain's IP address. Browsers and operating systems cache the answer, so later visits skip this trip." },
    { stop: "client", via: "c-dns", msg: "203.0.113.7", caption: "DNS answers with an IP address. Now the browser knows where to send the real request." },
    { stop: "server", via: "c-s", msg: "GET /problems", caption: "The HTTP request reaches the app server, which runs the business logic — checks the session, decides what data the page needs." },
    { stop: "db", via: "s-db", msg: "SELECT … LIMIT 20", caption: "The server asks the database for the rows. The database is where the state lives; the server itself keeps none." },
    { stop: "server", via: "s-db", msg: "20 rows", caption: "The rows come back and the server turns them into a response — JSON for an API, HTML for a page." },
    { stop: "client", via: "c-s", msg: "200 OK · JSON", caption: "" },
  ];
  // Every wire is crossed once out and once back: that is one round trip each.
  const uses = new Map<WireId, number>();
  for (const s of route) if (s.via) uses.set(s.via, (uses.get(s.via) ?? 0) + 1);
  for (const [w, n] of uses) if (n !== 2) throw new Error(`request-life: wire ${w} crossed ${n} times, not out and back`);
  const trips = uses.size;
  const hops = route.length - 1;
  route[route.length - 1].caption = `The response reaches the browser: ${hops} network hops, ${trips} round trips. Each one costs time, which is why designs cache answers and cut trips.`;

  const frames: Frame[] = route.map((s, i) => {
    const last = i === route.length - 1;
    const items: Item[] = [];
    (Object.keys(wires) as WireId[]).forEach((w) => items.push(wire(w, wires[w][0], wires[w][1], { tone: s.via === w ? "accent" : "line", dashed: w === "c-dns" })));
    (Object.keys(boxes) as Stop[]).forEach((k) => {
      const tone: Tone = k === s.stop ? (last ? "strong" : "accent") : "plain";
      const b = k === "db" ? database("db", 360, 120, "Database", { w: 100, tone }) : k === "client" ? service("client", 0, 120, "Client", { w: 92, tone }) : k === "dns" ? service("dns", 176, 10, "DNS", { w: 92, tone }) : service("server", 170, 120, "App server", { w: 104, tone });
      items.push(...b.items);
    });
    const p = at[s.stop];
    items.push(packet("req", p, { text: i + 1, tone: last ? "strong" : "accent" }));
    // Beside DNS the message rides to the packet's right; everywhere else above it, clear of the boxes.
    const side = s.stop === "dns";
    items.push(label("msg", s.msg, side ? p.x + 16 : p.x, side ? p.y : p.y - 19, { anchor: side ? "start" : "middle", tone: last ? "ink" : "accent", size: 11, mono: true }));
    return { caption: s.caption, items };
  });
  return finish({ title: "A request's life: DNS, the app server, the database and back", input: "", frames });
}

/* ── Functional vs non-functional requirements ────────────────────── */

function requirements(): Walkthrough {
  const AVAILABILITY = 0.999;
  const downHours = (1 - AVAILABILITY) * 365 * 24;
  const reqs: Array<{ text: string; kind: "F" | "N"; why: string }> = [
    { text: "Shorten a long URL", kind: "F", why: "It is something the system does for a user, so it is functional." },
    { text: "99.9% availability", kind: "N", why: `It says how well, not what: 99.9% still allows about ${downHours.toFixed(2)} hours of downtime a year, so it is non-functional.` },
    { text: "Redirect a short link", kind: "F", why: "Following a short link to its target is a feature — another functional requirement." },
    { text: "Redirect in < 100 ms", kind: "N", why: "A latency target constrains the same feature without adding one: non-functional, and it shapes the design." },
    { text: "Links expire on a date", kind: "F", why: "Expiry is behaviour a user can ask for, so it joins the functional list." },
    { text: "10K redirects / second", kind: "N", why: "A throughput target is a scale requirement — non-functional, and the input to the estimate." },
  ];
  const W = 158;
  const COL = [0, 172, 344];
  const rowY = (i: number) => 22 + i * 34;
  const frames: Frame[] = [];
  for (let t = 0; t <= reqs.length; t++) {
    const items: Item[] = [
      label("h0", "To sort", COL[0] + W / 2, 4, { size: 11, weight: 600 }),
      label("h1", "Functional — what it does", COL[1] + W / 2, 4, { size: 11, weight: 600 }),
      label("h2", "Non-functional — how well", COL[2] + W / 2, 4, { size: 11, weight: 600 }),
    ];
    const placed = reqs.slice(0, t);
    const pile = reqs.slice(t);
    pile.forEach((r, i) => items.push(box(`r${reqs.indexOf(r)}`, COL[0], rowY(i), r.text, { w: W, h: 28, size: 11, tone: "plain" })));
    for (const kind of ["F", "N"] as const) {
      placed
        .filter((r) => r.kind === kind)
        .forEach((r, i) => items.push(box(`r${reqs.indexOf(r)}`, COL[kind === "F" ? 1 : 2], rowY(i), r.text, { w: W, h: 28, size: 11, tone: reqs.indexOf(r) === t - 1 ? "accent" : "plain" })));
    }
    const nF = placed.filter((r) => r.kind === "F").length;
    const nN = placed.length - nF;
    const caption =
      t === 0
        ? "A design starts by pinning down requirements. Here are six for a URL shortener, still unsorted."
        : t === reqs.length
          ? `${reqs[t - 1].why} Sorted: ${nF} functional, ${nN} non-functional — the second list is what drives the architecture.`
          : `"${reqs[t - 1].text}": ${reqs[t - 1].why}`;
    frames.push({ caption, items });
  }
  return finish({ title: "Functional vs non-functional requirements, sorted for a URL shortener", input: "", frames });
}

/* ── Back-of-the-envelope estimate ────────────────────────────────── */

function estimate(): Walkthrough {
  const A = { dau: 10_000_000, perUser: 10, peak: 3, writeShare: 0.1, bytesPerWrite: 1_000, years: 5 };
  const perDay = A.dau * A.perUser;
  const avgQps = perDay / 86_400;
  const peakQps = avgQps * A.peak;
  const writesPerDay = perDay * A.writeShare;
  const bytesPerDay = writesPerDay * A.bytesPerWrite;
  const bytesTotal = bytesPerDay * 365 * A.years;
  const short = (n: number) => (n >= 1e6 ? `${commas(n / 1e6)}M` : commas(n));
  const bytes = (n: number) => (n >= 1e12 ? `${(n / 1e12).toFixed(1)} TB` : `${commas(n / 1e9)} GB`);
  const rows = [
    { name: "Requests / day", how: `${short(A.dau)} users × ${A.perUser}`, out: short(perDay), say: `${short(A.dau)} daily users making ${A.perUser} requests each is ${short(perDay)} requests a day.` },
    { name: "Average QPS", how: `${short(perDay)} ÷ 86,400 s`, out: `≈ ${commas(avgQps)}`, say: `A day has 86,400 seconds, so the average load is about ${commas(avgQps)} queries per second — call it ${(avgQps / 1000).toFixed(1)}K.` },
    { name: "Peak QPS", how: `${commas(avgQps)} × ${A.peak}`, out: `≈ ${commas(peakQps)}`, say: `Traffic is not flat. With an assumed peak of ${A.peak}× the average, the system must serve about ${commas(peakQps)} QPS.` },
    { name: "Writes / day", how: `${short(perDay)} × ${A.writeShare * 100}%`, out: short(writesPerDay), say: `If ${A.writeShare * 100}% of requests write data, that is ${short(writesPerDay)} writes a day; the rest are reads, so this is read-heavy.` },
    { name: "Storage / day", how: `${short(writesPerDay)} × 1 KB`, out: bytes(bytesPerDay), say: `At about 1 KB per write, storage grows by ${bytes(bytesPerDay)} a day (decimal units keep the arithmetic easy).` },
    { name: `Storage, ${A.years} years`, how: `${bytes(bytesPerDay)} × 365 × ${A.years}`, out: bytes(bytesTotal), say: `Over ${A.years} years that is about ${bytes(bytesTotal)} before replicas and indexes — enough that how to copy and split the data becomes part of the design.` },
  ];
  const frames: Frame[] = [];
  for (let t = 0; t <= rows.length; t++) {
    const items: Item[] = [
      label("a0", `Assume: ${short(A.dau)} daily users, ${A.perUser} requests each,`, 0, 0, { anchor: "start", size: 11.5, tone: t === 0 ? "accent" : "soft" }),
      label("a1", `peak = ${A.peak}× average, ${A.writeShare * 100}% writes of about 1 KB.`, 0, 17, { anchor: "start", size: 11.5, tone: t === 0 ? "accent" : "soft" }),
    ];
    rows.forEach((r, i) => {
      const y = 40 + i * 34;
      const done = i < t;
      const now = i === t - 1;
      const answer = (i === 2 || i === 5) && t === rows.length;
      items.push(label(`n${i}`, r.name, 0, y + 13, { anchor: "start", size: 12, tone: done ? "ink" : "faint" }));
      items.push(label(`f${i}`, r.how, 128, y + 13, { anchor: "start", size: 11, mono: true, tone: now ? "accent" : done ? "soft" : "faint" }));
      items.push(box(`o${i}`, 318, y, done ? r.out : "?", { w: 100, h: 26, size: 12, tone: now && !answer ? "accent" : answer ? "strong" : done ? "plain" : "muted" }));
    });
    const caption = t === 0 ? "An estimate starts from stated assumptions. Say them out loud — the interviewer cares about the reasoning more than the digits." : rows[t - 1].say;
    frames.push({ caption, items });
  }
  if (Math.round(peakQps) !== Math.round(avgQps * 3)) throw new Error("estimate: peak QPS is not the average times the peak factor");
  return finish({ title: "Back-of-the-envelope: QPS and storage from four assumptions", input: "", frames });
}

/* ── Latency ladder ───────────────────────────────────────────────── */

function latencyLadder(): Walkthrough {
  // Approximate orders of magnitude, as commonly quoted; real hardware and networks vary.
  const rungs: Array<[string, number, string]> = [
    ["L1 cache reference", 1, ""],
    ["Main memory reference", 100, "Missing the CPU cache and going to RAM."],
    ["SSD random read", 100_000, "Leaving memory for storage is the first big jump."],
    ["Round trip in a datacenter", 500_000, "One network hop to a cache or database nearby."],
    ["Disk seek (spinning HDD)", 10_000_000, "A moving head, which is why random reads on spinning disks hurt."],
    ["Round trip across an ocean", 150_000_000, "Light in fibre takes time, which is why CDNs keep copies near users."],
  ];
  const dur = (ns: number) => (ns < 1e3 ? `~${ns} ns` : ns < 1e6 ? `~${ns / 1e3} µs` : `~${ns / 1e6} ms`);
  const X0 = 176;
  const UNIT = 30;
  const widthOf = (ns: number) => Math.round((Math.log10(ns) + 1) * UNIT);
  const frames: Frame[] = [];
  const span = Math.round(Math.log10(rungs[rungs.length - 1][1] / rungs[0][1]));
  for (let t = 0; t <= rungs.length; t++) {
    const items: Item[] = [label("scale", "log scale — each step right is 10× slower (approximate)", X0, rungs.length * 32 + 8, { anchor: "start", size: 10.5, tone: "faint" })];
    rungs.forEach(([name, ns], i) => {
      if (i > t || (t < rungs.length && i > t)) return;
      const y = i * 32;
      const tone: Tone = t === rungs.length ? (i < 2 ? "strong" : "plain") : i === t ? "accent" : "plain";
      items.push(label(`l${i}`, name, 0, y + 11, { anchor: "start", size: 11.5, tone: "ink" }));
      items.push(box(`b${i}`, X0, y, "", { w: widthOf(ns), h: 22, tone }));
      items.push(label(`v${i}`, dur(ns), X0 + widthOf(ns) + 8, y + 11, { anchor: "start", size: 11, mono: true, tone: i === t ? "accent" : "soft" }));
    });
    let caption: string;
    if (t === rungs.length) caption = `From the top rung to the bottom spans about ${span} orders of magnitude. Memory answers in nanoseconds, disks and networks in micro- to milliseconds: keep hot data in memory and avoid round trips.`;
    else if (t === 0) caption = `A reference to the CPU's L1 cache takes about a nanosecond. The numbers here are rough, widely quoted orders of magnitude — hardware varies.`;
    else caption = `${rungs[t][0]}: ${dur(rungs[t][1])}, roughly ${commas(rungs[t][1] / rungs[t - 1][1])}× the rung above. ${rungs[t][2]}`;
    frames.push({ caption, items });
  }
  return finish({ title: "Latency numbers: orders of magnitude every design leans on", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "request-life": requestLife,
  requirements,
  estimate,
  "latency-ladder": latencyLadder,
};
