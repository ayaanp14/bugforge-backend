import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * Back-of-the-Envelope Estimation: the note's figures (content/notes/
 * system-design/back-of-the-envelope-estimation.md). Every figure loops (a
 * points subject), and every number it draws is computed here from the
 * worked example's stated assumptions — change one and every figure moves:
 *
 *  - powers-of-two: 2^10 … 2^50 worked out, against the powers of ten they
 *    stand in for, with the error of that shortcut.
 *  - qps: daily users → requests a day → average QPS → peak QPS, for reads
 *    and writes side by side.
 *  - storage: the uploads' bytes added up year by year, then with copies.
 *  - bandwidth: bytes in and out per second from the same QPS, and what a
 *    CDN takes off the origin.
 *  - latency-human: the commonly quoted latency orders of magnitude, scaled
 *    so one nanosecond lasts one second.
 */

/** The worked example: a photo-sharing service. Assumptions, not measurements. */
export const ASSUME = {
  dau: 10_000_000,
  viewsPerUser: 50,
  uploadsPerUser: 0.2,
  peak: 3,
  photoMB: 0.5,
  copies: 3,
  years: 5,
  cdnHit: 0.9,
};

const DAY = 86_400;
const commas = (n: number) => Math.round(n).toLocaleString("en-US");
const short = (n: number) => (n >= 1e9 ? `${+(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${+(n / 1e3).toFixed(1)}K` : commas(n));

function derived() {
  const views = ASSUME.dau * ASSUME.viewsPerUser;
  const uploads = ASSUME.dau * ASSUME.uploadsPerUser;
  const readQps = views / DAY;
  const writeQps = uploads / DAY;
  return { views, uploads, readQps, writeQps, peakRead: readQps * ASSUME.peak, peakWrite: writeQps * ASSUME.peak };
}

/* ── Powers of two ────────────────────────────────────────────────── */

function powersOfTwo(): Walkthrough {
  const rows = [
    { p: 10, ten: 3, word: "thousand", unit: "KB" },
    { p: 20, ten: 6, word: "million", unit: "MB" },
    { p: 30, ten: 9, word: "billion", unit: "GB" },
    { p: 40, ten: 12, word: "trillion", unit: "TB" },
    { p: 50, ten: 15, word: "quadrillion", unit: "PB" },
  ].map((r) => {
    const exact = 2 ** r.p;
    return { ...r, exact, err: ((exact / 10 ** r.ten - 1) * 100).toFixed(1) };
  });
  const frames: Frame[] = [];
  const H = 30;
  for (let t = 1; t <= rows.length; t++) {
    const items: Item[] = [
      label("h0", "power", 0, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h1", "exact value", 62, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h2", "say", 252, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h3", "unit", 360, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h4", "off by", 412, 0, { anchor: "start", size: 11, weight: 600 }),
    ];
    rows.forEach((r, i) => {
      if (i >= t) return;
      const now = i === t - 1 && t < rows.length;
      const y = 14 + i * (H + 6);
      const tone: Tone = t === rows.length ? "plain" : now ? "accent" : "plain";
      items.push(label(`p${i}`, `2^${r.p}`, 0, y + H / 2, { anchor: "start", size: 12, mono: true, tone: "ink" }));
      items.push(box(`e${i}`, 62, y, commas(r.exact), { w: 182, h: H, size: 10, tone }));
      items.push(label(`s${i}`, `≈ 1 ${r.word}`, 252, y + H / 2, { anchor: "start", size: 11, tone: now ? "accent" : "ink" }));
      items.push(box(`u${i}`, 360, y, r.unit, { w: 40, h: H, size: 11, tone: t === rows.length ? "strong" : tone }));
      items.push(label(`r${i}`, `+${r.err}%`, 412, y + H / 2, { anchor: "start", size: 11, mono: true, tone: "soft" }));
    });
    const r = rows[t - 1];
    const caption =
      t === 1
        ? `2^10 is ${commas(r.exact)}, close enough to a thousand to call it a kilobyte. That one shortcut turns powers of two into powers of ten.`
        : t === rows.length
          ? `2^${r.p} is about a ${r.word}: one ${r.unit}. Every ten powers of two is roughly three powers of ten; the shortcut errs by ${rows[0].err}% at KB and ${r.err}% at PB — fine for an estimate.`
          : `2^${r.p} = ${commas(r.exact)}, about a ${r.word}: one ${r.unit}. Saying 10^${r.ten} instead is ${r.err}% low.`;
    frames.push({ caption, items });
  }
  return finish({ title: "Powers of two you can say as powers of ten", input: "", frames });
}

/* ── QPS ──────────────────────────────────────────────────────────── */

function qps(): Walkthrough {
  const d = derived();
  if (Math.abs(d.peakRead - d.readQps * ASSUME.peak) > 1e-6) throw new Error("qps: peak is not average × factor");
  const ratio = Math.round(d.readQps / d.writeQps);
  const W = 150;
  const H = 34;
  const RX = 0;
  const WX = 230;
  const steps = [
    { col: RX, row: 1, text: `${short(d.views)} views / day`, op: `× ${ASSUME.viewsPerUser}`, say: `Each of ${short(ASSUME.dau)} daily users views ${ASSUME.viewsPerUser} photos: ${short(d.views)} reads a day.` },
    { col: WX, row: 1, text: `${short(d.uploads)} uploads / day`, op: `× ${ASSUME.uploadsPerUser}`, say: `One user in ${1 / ASSUME.uploadsPerUser} uploads a photo a day: ${short(d.uploads)} writes a day.` },
    { col: RX, row: 2, text: `≈ ${commas(d.readQps)} reads/s`, op: "÷ 86,400", say: `A day is 86,400 seconds, so reads average ${commas(d.readQps)} per second. Rounding the day to 10^5 seconds gives ${commas(d.views / 1e5)} — the same order of magnitude.` },
    { col: WX, row: 2, text: `≈ ${commas(d.writeQps)} writes/s`, op: "÷ 86,400", say: `Writes average only ${commas(d.writeQps)} per second: about ${ratio} reads for every write, so this design is read-heavy.` },
    { col: RX, row: 3, text: `≈ ${short(d.peakRead)} reads/s`, op: `× ${ASSUME.peak} peak`, say: `Traffic bunches into evenings. With an assumed peak of ${ASSUME.peak}× the average, the read path must carry about ${short(d.peakRead)} per second.` },
    { col: WX, row: 3, text: `≈ ${commas(d.peakWrite)} writes/s`, op: `× ${ASSUME.peak} peak`, say: `Peak writes are about ${commas(d.peakWrite)} per second — one database takes that easily; the reads are what need caches and replicas.` },
  ];
  const rowY = (r: number) => r * 66;
  const frames: Frame[] = [];
  for (let t = 0; t <= steps.length; t++) {
    const top = box("dau", 115, rowY(0), `${short(ASSUME.dau)} daily users`, { w: W, h: H, size: 12, tone: t === 0 ? "accent" : "plain" });
    const items: Item[] = [top];
    steps.forEach((s, i) => {
      const shown = i < t;
      const now = i === t - 1;
      const final = t === steps.length && s.row === 3;
      const y = rowY(s.row);
      const from = s.row === 1 ? { x: 115 + W / 2 + (s.col === RX ? -30 : 30), y: rowY(0) + H } : { x: s.col + W / 2, y: rowY(s.row - 1) + H };
      items.push(arrow(`a${i}`, from, { x: s.col + W / 2, y }, { tone: now ? "accent" : shown ? "ink" : "faint", label: s.op }));
      items.push(box(`b${i}`, s.col, y, shown ? s.text : "?", { w: W, h: H, size: 11.5, tone: final ? "strong" : now ? "accent" : shown ? "plain" : "muted" }));
    });
    const caption = t === 0 ? `Start from assumptions said out loud: ${short(ASSUME.dau)} daily users of a photo app, ${ASSUME.viewsPerUser} views and ${ASSUME.uploadsPerUser} uploads each a day.` : steps[t - 1].say;
    frames.push({ caption, items });
  }
  return finish({ title: "From daily users to peak QPS, reads and writes", input: "", frames });
}

/* ── Storage ──────────────────────────────────────────────────────── */

function storage(): Walkthrough {
  const d = derived();
  const tbPerDay = (d.uploads * ASSUME.photoMB) / 1e6;
  const tbPerYear = tbPerDay * 365;
  const totals = Array.from({ length: ASSUME.years }, (_, i) => tbPerYear * (i + 1));
  const withCopies = totals[totals.length - 1] * ASSUME.copies;
  const BASE = 230;
  const UNIT = 200 / withCopies;
  const BW = 54;
  const tb = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(2)} PB` : `${commas(n)} TB`);
  const frames: Frame[] = [];
  for (let t = 0; t <= ASSUME.years + 1; t++) {
    const copies = t === ASSUME.years + 1;
    const items: Item[] = [{ k: "path", id: "axis", pts: [[0, BASE], [ASSUME.years * (BW + 14) + 4, BASE]], tone: "ink", width: 1.2 }];
    items.push(label("rate", `${short(d.uploads)} photos/day × ${ASSUME.photoMB * 1000} KB = ${commas(tbPerDay)} TB/day`, 0, -6, { anchor: "start", size: 11, tone: t === 0 ? "accent" : "soft" }));
    totals.forEach((v, i) => {
      const x = 4 + i * (BW + 14);
      items.push(label(`y${i}`, `year ${i + 1}`, x + BW / 2, BASE + 13, { size: 10.5, tone: "soft" }));
      if (i >= t && !copies) return;
      const val = copies ? v * ASSUME.copies : v;
      const h = Math.max(2, val * UNIT);
      const tone: Tone = copies ? (i === ASSUME.years - 1 ? "strong" : "plain") : i === t - 1 ? "accent" : "plain";
      items.push({ k: "cell", id: `bar${i}`, x, y: BASE - h, w: BW, h, text: "", tone });
      items.push(label(`v${i}`, tb(val), x + BW / 2, BASE - h - 9, { size: 10.5, mono: true, tone: i === t - 1 || (copies && i === ASSUME.years - 1) ? "accent" : "soft" }));
    });
    let caption: string;
    if (t === 0) caption = `Storage is writes × size × time. ${short(d.uploads)} photos a day at about ${ASSUME.photoMB * 1000} KB each add ${commas(tbPerDay)} TB every day.`;
    else if (copies) caption = `Keep ${ASSUME.copies} copies for durability and ${ASSUME.years} years becomes about ${tb(withCopies)}. Numbers this size decide the store: object storage, not a database row.`;
    else if (t === 1) caption = `After one year: ${commas(tbPerDay)} TB a day × 365 days = ${tb(totals[0])}.`;
    else caption = `Year ${t} adds another ${tb(tbPerYear)}, since photos are rarely deleted: ${tb(totals[t - 1])} kept so far.`;
    frames.push({ caption, items });
  }
  return finish({ title: `Photo storage added up over ${ASSUME.years} years`, input: "", frames });
}

/* ── Bandwidth ────────────────────────────────────────────────────── */

function bandwidth(): Walkthrough {
  const d = derived();
  const rows = [
    { name: "In: uploads", mbs: d.writeQps * ASSUME.photoMB, how: `${commas(d.writeQps)}/s × ${ASSUME.photoMB * 1000} KB` },
    { name: "Out: views", mbs: d.readQps * ASSUME.photoMB, how: `${commas(d.readQps)}/s × ${ASSUME.photoMB * 1000} KB` },
    { name: "Out at peak", mbs: d.peakRead * ASSUME.photoMB, how: `× ${ASSUME.peak}` },
    { name: "Origin, CDN 90%", mbs: d.peakRead * ASSUME.photoMB * (1 - ASSUME.cdnHit), how: `× ${+(1 - ASSUME.cdnHit).toFixed(1)}` },
  ];
  const max = Math.max(...rows.map((r) => r.mbs));
  const X0 = 112;
  const LEN = 250;
  const rate = (mbs: number) => (mbs >= 1000 ? `${+(mbs / 1000).toFixed(1)} GB/s` : `${+mbs.toFixed(1)} MB/s`);
  const frames: Frame[] = [];
  for (let t = 1; t <= rows.length; t++) {
    const items: Item[] = [];
    rows.forEach((r, i) => {
      const y = i * 46;
      items.push(label(`n${i}`, r.name, 0, y + 12, { anchor: "start", size: 11.5, tone: "ink" }));
      items.push(label(`h${i}`, r.how, 0, y + 28, { anchor: "start", size: 10, mono: true, tone: "faint" }));
      if (i >= t) return;
      const w = Math.max(3, (r.mbs / max) * LEN);
      const now = i === t - 1;
      items.push({ k: "cell", id: `bar${i}`, x: X0, y: y + 4, w, h: 24, text: "", tone: now ? (i === rows.length - 1 ? "strong" : "accent") : "plain" });
      items.push(label(`v${i}`, rate(r.mbs), X0 + w + 8, y + 16, { anchor: "start", size: 11, mono: true, tone: now ? "accent" : "soft" }));
    });
    const r = rows[t - 1];
    const caption =
      t === 1
        ? `Bandwidth is QPS × bytes per request. Uploads bring in about ${rate(r.mbs)} — a thin line next to what goes out.`
        : t === 2
          ? `Views send out about ${rate(r.mbs)} on average, ${Math.round(r.mbs / rows[0].mbs)}× the inbound rate, because every photo is seen many times.`
          : t === 3
            ? `At the assumed ${ASSUME.peak}× peak that is ${rate(r.mbs)}, roughly ${Math.round((r.mbs * 8) / 1000)} Gbit/s — more than a server's network card can send.`
            : `If a CDN answers ${ASSUME.cdnHit * 100}% of views from its edges, the origin sends only ${rate(r.mbs)}. The estimate is what tells you the CDN is required.`;
    frames.push({ caption, items });
  }
  return finish({ title: "Bandwidth in and out, and what a CDN takes away", input: "", frames });
}

/* ── Latency at human scale ───────────────────────────────────────── */

function human(sec: number): string {
  const n = (v: number) => `${+v.toFixed(1)}`;
  if (sec < 60) return `${n(sec)} s`;
  if (sec < 3600) return `${n(sec / 60)} min`;
  if (sec < DAY) return `${n(sec / 3600)} hours`;
  if (sec < DAY * 60) return `${n(sec / DAY)} days`;
  if (sec < DAY * 365) return `${n(sec / (DAY * 30.4))} months`;
  return `${n(sec / (DAY * 365))} years`;
}

function latencyHuman(): Walkthrough {
  // Commonly quoted orders of magnitude, not benchmarks.
  const rungs: Array<[string, number]> = [
    ["L1 cache read", 1],
    ["Main memory read", 100],
    ["SSD random read", 100_000],
    ["Datacenter round trip", 500_000],
    ["Spinning-disk seek", 10_000_000],
    ["Round trip across an ocean", 150_000_000],
  ];
  const real = (ns: number) => (ns < 1e3 ? `${ns} ns` : ns < 1e6 ? `${ns / 1e3} µs` : `${ns / 1e6} ms`);
  const frames: Frame[] = [];
  for (let t = 0; t < rungs.length; t++) {
    const items: Item[] = [
      label("h0", "operation (approx.)", 0, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h1", "real", 196, 0, { anchor: "start", size: 11, weight: 600 }),
      label("h2", "if 1 ns were 1 second", 270, 0, { anchor: "start", size: 11, weight: 600 }),
    ];
    rungs.forEach(([name, ns], i) => {
      const y = 14 + i * 34;
      const now = i === t;
      const shown = i <= t;
      items.push(label(`n${i}`, name, 0, y + 14, { anchor: "start", size: 11.5, tone: shown ? "ink" : "faint" }));
      items.push(label(`r${i}`, shown ? real(ns) : "", 196, y + 14, { anchor: "start", size: 11, mono: true, tone: now ? "accent" : "soft" }));
      items.push(box(`hb${i}`, 270, y, shown ? human(ns) : "", { w: 120, h: 28, size: 11.5, tone: now ? (t === rungs.length - 1 ? "strong" : "accent") : shown ? "plain" : "muted" }));
    });
    const [name, ns] = rungs[t];
    const caption =
      t === 0
        ? "Stretch time so an L1 cache read takes one second. The real figures are rough, widely quoted orders of magnitude; hardware varies."
        : t === rungs.length - 1
          ? `${name}: ${real(ns)}, or ${human(ns)} on this scale. Memory is instant, a network hop is days, a disk seek months — cache hot data and avoid round trips.`
          : `${name}: about ${real(ns)}. On the stretched clock that is ${human(ns)}, ${commas(ns / rungs[t - 1][1])}× the line above.`;
    frames.push({ caption, items });
  }
  return finish({ title: "Latency numbers on a human clock", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "powers-of-two": powersOfTwo,
  qps,
  storage,
  bandwidth,
  "latency-human": latencyHuman,
};
