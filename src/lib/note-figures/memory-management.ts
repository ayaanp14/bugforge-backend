import { and, finish, round, type Frame, type Item, type LineTone, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow } from "../lesson-figures/kit.js";
import { diamond } from "./kit.js";

/**
 * Memory Management: the note's figures
 * (content/notes/operating-systems/memory-management.md places each with
 * "@figure <name>").
 *
 * Each figure runs the mechanism it draws on the note's own numbers: the
 * MMU's limit check and relocation on three logical addresses, first, best
 * and worst fit placing the same four requests into the same five holes,
 * the fragmentation those placements leave, a paged address split into bits
 * and translated through the page table, and a segmented address checked
 * against its segment's limit. Each generator throws when a computed value
 * disagrees with what the note states.
 */

/* ── Lean items ───────────────────────────────────────────────────── */

function cell(id: string, x: number, y: number, w: number, h: number, text: string | number, tone: Tone = "plain", size?: number): Item {
  const it: Item = { k: "cell", id, x, y, w, h, text: String(text) };
  if (tone !== "plain") it.tone = tone;
  if (size) it.size = size;
  return it;
}

function txt(id: string, x: number, y: number, text: string, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  const it: Item = { k: "text", id, x, y, text, anchor: o.anchor ?? "middle", size: o.size ?? 12 };
  if (o.tone && o.tone !== "ink") it.tone = o.tone;
  if (o.mono === false) it.mono = false;
  if (o.weight) it.weight = o.weight;
  return it;
}

function line(id: string, x1: number, y1: number, x2: number, y2: number, tone: LineTone = "ink", o: { head?: boolean; dashed?: boolean; label?: string } = {}): Item {
  const it: Item = { k: "edge", id, x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2), tone };
  if (o.head !== false) it.arrow = true;
  if (o.dashed) it.dashed = true;
  if (o.label) it.label = o.label;
  return it;
}

const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/* ── Base and limit registers ─────────────────────────────────────── */

function baseLimit(): Walkthrough {
  const BASE = 30000;
  const LIMIT = 12000;
  const translate = (a: number) => (a < LIMIT ? { ok: true as const, phys: BASE + a } : { ok: false as const });
  const cases = [4500, 0, 12500];
  const expect = ["34500", "30000", "trap"];
  cases.forEach((a, i) => {
    const r = translate(a);
    if ((r.ok ? String(r.phys) : "trap") !== expect[i]) throw new Error(`base-limit: ${a} gives ${r.ok ? r.phys : "trap"}, the note says ${expect[i]}`);
  });

  // Physical memory as a column on the right: 0 at the top, MEM_TOP bytes at the bottom.
  const MEM_TOP = 48000;
  const MX = 400;
  const MY = 0;
  const MH = 240;
  const my = (addr: number) => round(MY + (addr / MEM_TOP) * MH);

  const frames: Frame[] = cases.map((a, i) => {
    const r = translate(a);
    const on = (ok: boolean): LineTone => (ok ? "accent" : "faint");
    const items: Item[] = [];
    // Memory: the process's region [base, base + limit) shaded, the rest plain.
    items.push(cell("mem", MX, MY, 64, MH, ""));
    items.push(cell("proc", MX, my(BASE), 64, my(BASE + LIMIT) - my(BASE), "process", "accent", 11));
    items.push(txt("m0", MX + 70, MY + 4, "0", { anchor: "start", tone: "faint", size: 11 }));
    items.push(txt("mb", MX + 70, my(BASE), commas(BASE), { anchor: "start", tone: "soft", size: 11 }));
    items.push(txt("me", MX + 70, my(BASE + LIMIT), commas(BASE + LIMIT), { anchor: "start", tone: "soft", size: 11 }));
    items.push(txt("mt", MX + 32, MY + MH + 14, "physical memory", { tone: "soft", size: 11, mono: false }));
    // CPU -> logical address -> limit check.
    items.push(cell("cpu", 0, 92, 56, 40, "CPU", "plain", 13));
    items.push(line("a1", 58, 112, 118, 112, "accent"));
    items.push(txt("la", 88, 100, String(a), { weight: 700, tone: "accent" }));
    items.push(txt("lal", 88, 128, "logical", { tone: "soft", size: 11, mono: false }));
    // The limit register feeds the comparison.
    items.push(cell("lim", 136, 8, 104, 30, `limit ${LIMIT}`, "plain", 12));
    items.push(line("a2", 188, 40, 188, 82, "ink"));
    items.push(diamond("cmp", 188, 112, 132, 58, { tone: r.ok ? "accent" : "error" }));
    items.push(txt("cmpt", 188, 112, `${a} < ${LIMIT}?`, { size: 11.5, weight: 600, tone: r.ok ? "ink" : "error" }));
    // Yes: add the base register.
    items.push(line("yes", 254, 112, 296, 112, on(r.ok), { label: "yes" }));
    items.push(cell("bas", 262, 8, 104, 30, `base ${BASE}`, "plain", 12));
    items.push(line("a3", 314, 40, 314, 94, "ink"));
    items.push({ k: "node", id: "add", x: 314, y: 112, r: 16, text: "+", tone: r.ok ? "accent" : "plain", size: 16 });
    // The physical address lands in the process's region.
    if (r.ok) {
      items.push(line("a4", 331, 112, MX - 4, my(r.phys), "accent"));
      items.push(txt("pa", 362, 96, String(r.phys), { weight: 700, tone: "accent" }));
      items.push(txt("pal", 362, 80, "physical", { tone: "soft", size: 11, mono: false }));
      items.push({ k: "ptr", id: "hit", x: MX + 64 + 2, y: my(r.phys), label: "", tone: "accent", up: true });
    }
    // No: trap to the operating system.
    items.push(line("no", 188, 141, 188, 196, r.ok ? "faint" : "error", { label: "no" }));
    items.push(cell("trap", 128, 200, 120, 36, "trap to the OS", r.ok ? "muted" : "error", 12));
    const caption = r.ok
      ? i === 0
        ? `The CPU issues logical address ${a}. The MMU checks it against the limit register: ${a} < ${LIMIT}, so it is inside the process. It adds the base register: ${BASE} + ${a} = ${r.phys}.`
        : `Logical address ${a} is the first byte of the process: it passes the check and maps to ${r.phys}, the base itself. The process never learns where in memory it sits.`
      : `Logical address ${a} fails the check, ${a} ≥ ${LIMIT}: it lies outside the process's space, so no memory is touched and the MMU traps to the operating system with an addressing error.`;
    return { caption, items };
  });
  return finish({ title: "Relocation and limit registers in the MMU", input: `base ${BASE}, limit ${LIMIT}; logical addresses ${cases.join(", ")}`, frames });
}

/* ── First, best and worst fit ────────────────────────────────────── */

const HOLES = [150, 400, 250, 600, 300];
const REQUESTS = [220, 380, 130, 560];
type Fit = "first" | "best" | "worst";

/** The hole a strategy picks for `req`, or -1: first fit scans in memory order, best takes the smallest that fits, worst the largest. */
function pick(holes: readonly number[], req: number, fit: Fit): number {
  let at = -1;
  holes.forEach((h, i) => {
    if (h < req) return;
    // Ties keep the earlier hole, so best and worst fit also scan in memory order.
    if (at === -1 || (fit === "best" && h < holes[at]) || (fit === "worst" && h > holes[at])) at = i;
  });
  return fit === "first" ? holes.findIndex((h) => h >= req) : at;
}

interface FitRun {
  /** Hole sizes after each request (index 0 = before any). */
  sizes: number[][];
  /** The hole each request went into, or -1. */
  chosen: number[];
  /** What each hole has received so far, per step. */
  placed: string[][];
}

function runFit(fit: Fit): FitRun {
  const holes = [...HOLES];
  const sizes = [[...holes]];
  const chosen: number[] = [];
  const got: number[][] = HOLES.map(() => []);
  const placed = [got.map((g) => g.join("+"))];
  for (const req of REQUESTS) {
    const i = pick(holes, req, fit);
    chosen.push(i);
    if (i !== -1) {
      holes[i] -= req;
      got[i].push(req);
    }
    sizes.push([...holes]);
    placed.push(got.map((g) => g.join("+")));
  }
  return { sizes, chosen, placed };
}

const FITS: Fit[] = ["first", "best", "worst"];
const FIT_NAME: Record<Fit, string> = { first: "First fit", best: "Best fit", worst: "Worst fit" };

function fitRuns(): Record<Fit, FitRun> {
  const runs = { first: runFit("first"), best: runFit("best"), worst: runFit("worst") };
  // The note's tables: holes chosen (1-based, 0 = none) for 220, 380, 130, 560.
  const note: Record<Fit, number[]> = { first: [2, 4, 1, 0], best: [3, 2, 1, 4], worst: [4, 2, 4, 0] };
  for (const f of FITS) {
    const got = runs[f].chosen.map((i) => i + 1);
    if (got.join() !== note[f].join()) throw new Error(`fit: ${f} chose ${got.join()}, the note says ${note[f].join()}`);
  }
  const free = runs.first.sizes[REQUESTS.length].reduce((a, b) => a + b, 0);
  if (free !== 970) throw new Error(`fit: first fit leaves ${free} KB free, the note says 970`);
  if (Math.max(...runs.worst.sizes[REQUESTS.length]) !== 300) throw new Error("fit: worst fit's largest hole should be 300");
  return runs;
}

function fitStrategies(): Walkthrough {
  const runs = fitRuns();
  const CW = 56;
  const STEP = CW + 8;
  const ROW = 58;
  const RX = 5 * STEP + 10;
  const frames: Frame[] = [];
  const draw = (step: number): Item[] => {
    const items: Item[] = [];
    HOLES.forEach((_, i) => items.push(txt(`h${i}`, i * STEP + CW / 2, -12, `H${i + 1}`, { tone: "faint", size: 11 })));
    if (step > 0) items.push(txt("req", 0, -40, `request ${step} of ${REQUESTS.length}: ${REQUESTS[step - 1]} KB`, { anchor: "start", size: 13, weight: 700, tone: "accent" }));
    else items.push(txt("req", 0, -40, `free holes, in memory order (KB)`, { anchor: "start", size: 13, weight: 700 }));
    FITS.forEach((f, r) => {
      const y = r * ROW;
      const run = runs[f];
      items.push(txt(`f${r}`, -10, y + 15, FIT_NAME[f], { anchor: "end", size: 12, mono: false, weight: 600, tone: "soft" }));
      const at = step > 0 ? run.chosen[step - 1] : -2;
      run.sizes[step].forEach((size, i) => {
        items.push(cell(`c${r}-${i}`, i * STEP, y, CW, 30, size, i === at ? "accent" : "plain", 13));
        const p = run.placed[step][i];
        if (p) items.push(txt(`p${r}-${i}`, i * STEP + CW / 2, y + 41, `−${p.replace(/\+/g, " −")}`, { tone: "faint", size: 11 }));
      });
      if (step > 0) {
        const req = REQUESTS[step - 1];
        const before = run.sizes[step - 1];
        items.push(
          at === -1
            ? txt(`o${r}`, RX, y + 15, `no hole ≥ ${req}`, { anchor: "start", size: 12, weight: 600, tone: "error" })
            : txt(`o${r}`, RX, y + 15, `H${at + 1}: ${before[at]} → ${before[at] - req}`, { anchor: "start", size: 12, weight: 600, tone: "accent" }),
        );
      }
    });
    return items;
  };
  frames.push({
    caption: `Five free holes sit between processes, and requests of ${REQUESTS.join(", ")} KB arrive in that order. Each strategy places the same requests; the leftover of a hole stays where it was as a smaller hole.`,
    items: draw(0),
  });
  REQUESTS.forEach((req, k) => {
    const c = (f: Fit) => runs[f].chosen[k];
    const name = (f: Fit) => (c(f) === -1 ? "nothing" : `H${c(f) + 1}`);
    let caption: string;
    if (k === 0) caption = `${req} KB: first fit stops at the first hole big enough, ${name("first")}; best fit takes the smallest that fits, ${name("best")}; worst fit the largest, ${name("worst")}.`;
    else if (k < REQUESTS.length - 1) caption = `${req} KB goes to ${name("first")} under first fit, ${name("best")} under best fit and ${name("worst")} under worst fit. Best fit's leftovers are already tiny: ${and(runs.best.sizes[k + 1].filter((s) => s < 50).map(String))} KB.`;
    else {
      const free = runs.first.sizes[k].reduce((a, b) => a + b, 0);
      caption = `${req} KB: first fit has ${free} KB free in five holes but none of ${req}, so the request waits — external fragmentation. Best fit still has ${HOLES[c("best")]} KB in ${name("best")}; worst fit's largest hole is ${Math.max(...runs.worst.sizes[k])} KB.`;
    }
    frames.push({ caption, items: draw(k + 1) });
  });
  return finish({ title: "First, best and worst fit placing the same requests", input: `holes ${HOLES.join(", ")} KB; requests ${REQUESTS.join(", ")} KB`, frames });
}

/* ── Internal and external fragmentation ──────────────────────────── */

function fragmentation(): Walkthrough {
  const PAGE = 4096;
  const SIZE = 10500;
  const pages = Math.ceil(SIZE / PAGE);
  const lastUsed = SIZE - (pages - 1) * PAGE;
  const waste = PAGE - lastUsed;
  if (pages !== 3 || lastUsed !== 2308 || waste !== 1788) throw new Error(`fragmentation: ${pages} pages, ${lastUsed} used, ${waste} wasted; the note says 3, 2308, 1788`);
  const run = fitRuns().first;
  const holes = run.sizes[REQUESTS.length];
  const free = holes.reduce((a, b) => a + b, 0);
  const want = REQUESTS[REQUESTS.length - 1];
  if (run.chosen[REQUESTS.length - 1] !== -1 || free < want) throw new Error("fragmentation: the 560 KB request should fail with enough free space in total");

  const items: Item[] = [];
  // Internal: three pages, the last one partly used.
  const PW = 120;
  const pu = PW / PAGE;
  items.push(txt("t1", 0, -24, `Internal: a ${commas(SIZE)}-byte process in 4 KB pages`, { anchor: "start", size: 12.5, mono: false, weight: 600 }));
  for (let p = 0; p < pages; p++) {
    const used = p < pages - 1 ? PAGE : lastUsed;
    items.push(cell(`pg${p}`, p * (PW + 6), 0, round(used * pu), 34, commas(used), "plain", 12));
    items.push(txt(`pl${p}`, p * (PW + 6) + PW / 2, 46, `page ${p}`, { tone: "faint", size: 11, mono: false }));
  }
  const wx = (pages - 1) * (PW + 6) + round(lastUsed * pu);
  items.push(cell("waste", wx, 0, round(waste * pu), 34, commas(waste), "accent", 12));
  items.push(txt("wl", wx + round((waste * pu) / 2), -10, "wasted", { tone: "accent", size: 11, mono: false, weight: 600 }));

  // External: first fit's memory after the three placements — holes between blocks in use.
  const Y = 108;
  const K = 0.34; // px per KB
  const USED = 16;
  items.push(txt("t2", 0, Y - 24, `External: first fit's holes after placing ${REQUESTS.slice(0, 3).join(", ")} KB`, { anchor: "start", size: 12.5, mono: false, weight: 600 }));
  let x = 0;
  holes.forEach((h, i) => {
    items.push(cell(`u${i}`, x, Y, USED, 34, "", "muted"));
    x += USED;
    items.push(cell(`hole${i}`, x, Y, Math.max(3, round(h * K)), 34, h * K >= 24 ? String(h) : "", "ghost", 12));
    if (h * K < 24) items.push(txt(`hl${i}`, x + (h * K) / 2, Y + 44, String(h), { tone: "soft", size: 11 }));
    x += round(h * K);
  });
  items.push(cell("uEnd", x, Y, USED, 34, "", "muted"));
  items.push(txt("leg", x + USED, Y + 44, "grey: in use, dashed: free", { anchor: "end", tone: "faint", size: 11, mono: false }));
  // The request against the largest hole, and against all the holes added up.
  const Y2 = Y + 78;
  const biggest = Math.max(...holes);
  items.push(txt("rq", -8, Y2 + 13, `${want} KB`, { anchor: "end", size: 12, weight: 600, tone: "accent" }));
  items.push(cell("want", 0, Y2, round(want * K), 26, "the request", "accent", 11));
  items.push(txt("bg", -8, Y2 + 45, `${biggest} KB`, { anchor: "end", size: 12, tone: "error" }));
  items.push(cell("big", 0, Y2 + 32, round(biggest * K), 26, "largest hole", "error", 11));
  items.push(txt("sm", -8, Y2 + 77, `${free} KB`, { anchor: "end", size: 12, weight: 600 }));
  let sx = 0;
  holes.forEach((h, i) => {
    items.push(cell(`sum${i}`, sx, Y2 + 64, Math.max(3, round(h * K)), 26, "", "ghost"));
    sx += round(h * K);
  });
  items.push(txt("sml", sx + 8, Y2 + 77, "all holes added up", { anchor: "start", tone: "soft", size: 11, mono: false }));
  return finish({
    title: "Internal and external fragmentation",
    input: "",
    frames: [
      {
        caption: `Internal: the last page holds only ${commas(lastUsed)} bytes, so ${commas(waste)} bytes inside an allocated block are lost. External: ${free} KB is free, more than the ${want} KB request, but it is split into holes of at most ${biggest} KB, so the request cannot be placed.`,
        items,
      },
    ],
  });
}

/* ── Paging: splitting and translating an address ─────────────────── */

function pagingTranslation(): Walkthrough {
  const PAGE_BITS = 12;
  const BITS = 16;
  const LOGICAL = 13000;
  const TABLE = [5, 2, 7, 6];
  const p = LOGICAL >> PAGE_BITS;
  const d = LOGICAL & ((1 << PAGE_BITS) - 1);
  const f = TABLE[p];
  const phys = (f << PAGE_BITS) | d;
  if (p !== 3 || d !== 712 || f !== 6 || phys !== 25288 || phys !== f * 4096 + d) throw new Error(`paging: ${LOGICAL} → p ${p}, d ${d}, f ${f}, ${phys}; the note says 3, 712, 6, 25288`);
  const bits = (n: number) => n.toString(2).padStart(BITS, "0").split("");
  const BW = 20;
  const BG = 2;
  const SPLIT = 10; // extra gap between page/frame bits and offset bits
  const bx = (i: number) => i * (BW + BG) + (i >= BITS - PAGE_BITS ? SPLIT : 0);
  const HI = BITS - PAGE_BITS;
  const Y1 = 0;
  const TY = 64;
  const RH = 24;
  const Y3 = TY + TABLE.length * RH + 44;
  const TX = 128;
  const hex = (n: number) => `0x${n.toString(16).toUpperCase()}`;

  const draw = (stage: number): Item[] => {
    const items: Item[] = [];
    items.push(txt("ll", -10, Y1 + 12, "logical", { anchor: "end", tone: "soft", size: 12, mono: false, weight: 600 }));
    bits(LOGICAL).forEach((b, i) => items.push(cell(`l${i}`, bx(i), Y1, BW, 24, b, i < HI ? (stage === 1 ? "strong" : "accent") : "plain", 13)));
    items.push({ k: "span", id: "sp", x1: bx(0) + 1, x2: bx(HI - 1) + BW - 1, y: Y1 - 8, label: `p = ${p}`, tone: "accent" });
    items.push({ k: "span", id: "sd", x1: bx(HI) + 1, x2: bx(BITS - 1) + BW - 1, y: Y1 - 8, label: `d = ${d}`, tone: "ink" });
    items.push(txt("lv", bx(BITS - 1) + BW + 10, Y1 + 12, String(LOGICAL), { anchor: "start", size: 12, weight: 600 }));
    // The page table.
    items.push(txt("th1", TX + 22, TY - 12, "page", { tone: "faint", size: 11, mono: false }));
    items.push(txt("th2", TX + 70, TY - 12, "frame", { tone: "faint", size: 11, mono: false }));
    TABLE.forEach((fr, r) => {
      const hot = stage >= 1 && r === p;
      items.push(cell(`tp${r}`, TX, TY + r * RH, 44, RH - 2, r, hot ? "accent" : "plain", 12));
      items.push(cell(`tf${r}`, TX + 48, TY + r * RH, 44, RH - 2, fr, hot ? "strong" : "plain", 12));
    });
    items.push(txt("tl", TX - 10, TY + 10, "page table", { anchor: "end", tone: "soft", size: 11, mono: false, weight: 600 }));
    if (stage >= 1) items.push(arrow("ap", { x: bx(1), y: Y1 + 26 }, { x: TX - 3, y: TY + p * RH + 11 }, { tone: "accent", bow: 18 }));
    // The physical address.
    items.push(txt("pl", -10, Y3 + 12, "physical", { anchor: "end", tone: "soft", size: 12, mono: false, weight: 600 }));
    if (stage >= 2) {
      bits(phys).forEach((b, i) => items.push(cell(`ph${i}`, bx(i), Y3, BW, 24, b, i < HI ? "strong" : "plain", 13)));
      items.push(arrow("af", { x: TX + 70, y: TY + p * RH + 24 }, { x: bx(2), y: Y3 - 3 }, { tone: "accent" }));
      items.push(arrow("ad", { x: bx(HI + 9) + BW / 2, y: Y1 + 27 }, { x: bx(HI + 9) + BW / 2, y: Y3 - 3 }, { tone: "ink", label: "copied" }));
      items.push({ k: "span", id: "sf", x1: bx(0) + 1, x2: bx(HI - 1) + BW - 1, y: Y3 + 32, label: `f = ${f}`, tone: "accent", down: true });
      items.push({ k: "span", id: "sd2", x1: bx(HI) + 1, x2: bx(BITS - 1) + BW - 1, y: Y3 + 32, label: `d = ${d}`, tone: "ink", down: true });
      items.push(txt("pv", bx(BITS - 1) + BW + 10, Y3 + 12, String(phys), { anchor: "start", size: 12, weight: 700, tone: "accent" }));
    } else {
      for (let i = 0; i < BITS; i++) items.push(cell(`ph${i}`, bx(i), Y3, BW, 24, "", "ghost"));
    }
    return items;
  };
  return finish({
    title: "Paging: a logical address split into page and offset, then translated",
    input: `page size 4 KB (12 offset bits); logical address ${LOGICAL}; page table ${TABLE.map((fr, i) => `${i}→${fr}`).join(", ")}`,
    frames: [
      { caption: `${LOGICAL} in binary (its low 16 bits; the rest are 0). A 4 KB page is 2¹² bytes, so the low 12 bits are the offset, d = ${d}, and the bits above them the page number, p = ${p}.`, items: draw(0) },
      { caption: `The page number indexes the process's page table: entry ${p} says page ${p} is in frame ${f}. The offset is not looked up at all.`, items: draw(1) },
      { caption: `The frame number replaces the page number and the offset is copied unchanged: ${f} × 4096 + ${d} = ${phys}, or ${hex(phys)}. Translation is a table look-up and a bit substitution, with no addition.`, items: draw(2) },
    ],
  });
}

/* ── Segmentation ─────────────────────────────────────────────────── */

function segmentation(): Walkthrough {
  const SEGS = [
    { name: "code", base: 2000, limit: 1200 },
    { name: "stack", base: 6000, limit: 500 },
    { name: "data", base: 4000, limit: 800 },
  ];
  const cases: Array<[number, number]> = [[2, 300], [0, 1199], [1, 520]];
  const expect = ["4300", "3199", "trap"];
  const run = ([s, d]: [number, number]) => (d < SEGS[s].limit ? { ok: true as const, phys: SEGS[s].base + d } : { ok: false as const });
  cases.forEach((c, i) => {
    const r = run(c);
    if ((r.ok ? String(r.phys) : "trap") !== expect[i]) throw new Error(`segmentation: (${c}) gives ${r.ok ? r.phys : "trap"}, the note says ${expect[i]}`);
  });
  // Physical memory from LO to HI, top to bottom.
  const LO = 1600;
  const HI = 6900;
  const MX = 360;
  const MH = 300;
  const my = (a: number) => round(((a - LO) / (HI - LO)) * MH);
  const TY = 30;
  const RH = 28;
  const cols = [0, 64, 140]; // seg, base, limit
  const frames: Frame[] = cases.map(([s, d], i) => {
    const r = run([s, d]);
    const items: Item[] = [];
    // Memory with the three segments at their bases.
    items.push(cell("mem", MX, 0, 70, MH, ""));
    SEGS.forEach((g, k) => {
      const hot = k === s;
      items.push(cell(`seg${k}`, MX, my(g.base), 70, my(g.base + g.limit) - my(g.base), g.name, hot ? (r.ok ? "accent" : "error") : "muted", 11));
      items.push(txt(`sb${k}`, MX + 76, my(g.base) + 2, String(g.base), { anchor: "start", tone: "soft", size: 11 }));
      items.push(txt(`se${k}`, MX + 76, my(g.base + g.limit) - 2, String(g.base + g.limit), { anchor: "start", tone: "faint", size: 11 }));
    });
    items.push(txt("mt", MX + 35, MH + 14, "physical memory", { tone: "soft", size: 11, mono: false }));
    // The segment table.
    ["segment", "base", "limit"].forEach((h, c) => items.push(txt(`th${c}`, cols[c] + 30, TY - 12, h, { tone: "faint", size: 11, mono: false })));
    SEGS.forEach((g, k) => {
      const hot = k === s;
      items.push(cell(`ts${k}`, cols[0], TY + k * RH, 60, RH - 3, `${k} ${g.name}`, hot ? "accent" : "plain", 11.5));
      items.push(cell(`tb${k}`, cols[1], TY + k * RH, 72, RH - 3, g.base, hot ? "accent" : "plain", 12));
      items.push(cell(`tl${k}`, cols[2], TY + k * RH, 60, RH - 3, g.limit, hot ? (r.ok ? "accent" : "error") : "plain", 12));
    });
    // The address and the arithmetic, under the table.
    const Y = TY + SEGS.length * RH + 26;
    items.push(txt("addr", 0, Y, `address (s, d) = (${s}, ${d})`, { anchor: "start", size: 13, weight: 700, tone: "accent" }));
    items.push(txt("chk", 0, Y + 26, r.ok ? `check: ${d} < ${SEGS[s].limit}, inside` : `check: ${d} ≥ ${SEGS[s].limit}, outside`, { anchor: "start", size: 12, tone: r.ok ? "ink" : "error", weight: 600 }));
    items.push(txt("res", 0, Y + 50, r.ok ? `physical: ${SEGS[s].base} + ${d} = ${r.phys}` : "trap: segmentation fault", { anchor: "start", size: 12, weight: 700, tone: r.ok ? "accent" : "error" }));
    const target = r.ok ? r.phys : SEGS[s].base + d;
    items.push(arrow("go", { x: 214, y: Y + 50 }, { x: MX - 3, y: my(target) }, { tone: r.ok ? "accent" : "error", dashed: !r.ok }));
    items.push({ k: "ptr", id: "at", x: MX + 70 + 2, y: my(target), label: "", tone: r.ok ? "accent" : "error", up: true });
    const caption = r.ok
      ? i === 0
        ? `Address (${s}, ${d}) names segment ${s}, ${SEGS[s].name}, and offset ${d}. The segment table gives its base ${SEGS[s].base} and limit ${SEGS[s].limit}; ${d} < ${SEGS[s].limit}, so the physical address is ${SEGS[s].base} + ${d} = ${r.phys}.`
        : `(${s}, ${d}) is the last byte of the ${SEGS[s].name} segment: ${d} < ${SEGS[s].limit} passes, by one, and maps to ${r.phys}. An offset equal to the limit would already be outside.`
      : `(${s}, ${d}) asks for byte ${d} of the ${SEGS[s].name} segment, which is only ${SEGS[s].limit} bytes long. ${d} ≥ ${SEGS[s].limit}, so the MMU traps before ${SEGS[s].base + d} is touched: a segmentation fault.`;
    return { caption, items };
  });
  return finish({ title: "Segmentation: an address checked against its segment's limit", input: `segment table: ${SEGS.map((g, k) => `${k} ${g.name} base ${g.base} limit ${g.limit}`).join("; ")}`, frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "base-limit": baseLimit,
  "fit-strategies": fitStrategies,
  fragmentation,
  "paging-translation": pagingTranslation,
  segmentation,
};
