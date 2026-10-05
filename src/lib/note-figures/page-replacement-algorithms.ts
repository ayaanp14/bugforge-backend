import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, label } from "../lesson-figures/kit.js";

/**
 * Page Replacement Algorithms: the note's figures
 * (content/notes/operating-systems/page-replacement-algorithms.md places
 * each with "@figure <name>").
 *
 * Every figure runs the policy it shows. `simulate` is the one replacement
 * loop — FIFO, LRU or Optimal over fixed frame slots, a new page taking the
 * slot of the page it evicts, exactly as the note's convention — and the
 * three frame-by-frame animations draw its steps as the grid a student
 * writes on paper: one column per reference, filled as the string is read.
 * The clock animation runs the second-chance sweep with reference bits, and
 * the Belady diagram runs FIFO twice, with three frames and with four. Each
 * generator throws when its count disagrees with the note's.
 */

/** The note's reference string and frame count. */
const REFS = [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2];
const FRAMES = 3;
/** The classic string that shows Belady's anomaly. */
const BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

type Policy = "FIFO" | "LRU" | "OPT";

interface Step {
  /** 1-based step number. */
  t: number;
  page: number;
  hit: boolean;
  /** The slot the page sits in after the step. */
  slot: number;
  /** The page evicted, if any. */
  victim: number | null;
  /** Why the victim was chosen, in words for the caption. */
  why: string;
  /** Slot contents after the step. */
  slots: Array<number | null>;
}

/**
 * The replacement loop. FIFO evicts the page loaded earliest, LRU the page
 * used least recently, Optimal the page whose next use is farthest away
 * (never used again counts as farthest; a tie goes to the page loaded
 * first, the same rule as the note's program).
 */
function simulate(refs: readonly number[], n: number, policy: Policy): Step[] {
  const slots: Array<number | null> = Array(n).fill(null);
  const loadedAt = new Map<number, number>();
  const usedAt = new Map<number, number>();
  const nextUse = (page: number, t: number) => {
    const k = refs.indexOf(page, t + 1);
    return k === -1 ? Infinity : k;
  };
  const steps: Step[] = [];
  refs.forEach((page, t) => {
    const at = slots.indexOf(page);
    if (at !== -1) {
      usedAt.set(page, t);
      steps.push({ t: t + 1, page, hit: true, slot: at, victim: null, why: "", slots: [...slots] });
      return;
    }
    let slot = slots.indexOf(null);
    let victim: number | null = null;
    let why = "";
    if (slot === -1) {
      const resident = slots as number[];
      // Rank the residents; the victim is the first with the best (largest) score.
      const score = (p: number) => (policy === "FIFO" ? -loadedAt.get(p)! : policy === "LRU" ? -usedAt.get(p)! : nextUse(p, t));
      const byLoad = [...resident].sort((a, b) => loadedAt.get(a)! - loadedAt.get(b)!);
      victim = byLoad.reduce((best, p) => (score(p) > score(best) ? p : best));
      slot = slots.indexOf(victim);
      if (policy === "FIFO") why = `loaded at step ${loadedAt.get(victim)! + 1}, the oldest`;
      else if (policy === "LRU") why = `last used at step ${usedAt.get(victim)! + 1}, the longest ago`;
      else {
        const nu = nextUse(victim, t);
        const ties = resident.filter((p) => p !== victim && nextUse(p, t) === nu);
        why = nu === Infinity ? (ties.length ? `never used again; neither is ${ties.join(" or ")}, and the tie goes to the page loaded first` : "never used again") : `next used at step ${nu + 1}, the farthest away`;
      }
    }
    slots[slot] = page;
    loadedAt.set(page, t);
    usedAt.set(page, t);
    steps.push({ t: t + 1, page, hit: false, slot, victim, why, slots: [...slots] });
  });
  return steps;
}

const faults = (steps: readonly Step[]) => steps.filter((s) => !s.hit).length;
/** "1 fault", "3 faults". */
const count = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/* ── Lean items: plain tones and default sizes are left out of the JSON ── */

function cell(id: string, x: number, y: number, w: number, h: number, text: string, tone: Tone = "plain", size?: number): Item {
  const it: Item = { k: "cell", id, x, y, w, h, text };
  if (tone !== "plain") it.tone = tone;
  if (size) it.size = size;
  return it;
}

function txt(id: string, x: number, y: number, text: string, o: { tone?: TextTone; anchor?: "start" | "middle" | "end"; size?: number; mono?: boolean; weight?: number } = {}): Item {
  const it: Item = { k: "text", id, x, y, text, anchor: o.anchor ?? "middle", size: o.size ?? 11 };
  if (o.tone && o.tone !== "ink") it.tone = o.tone;
  if (o.mono === false) it.mono = false;
  if (o.weight) it.weight = o.weight;
  return it;
}

/* ── The frame grid ───────────────────────────────────────────────── */

const CW = 30;
const CH = 26;
const STEP = CW + 4;
const colX = (i: number) => i * STEP;

interface GridOpts {
  /** Id prefix, so two grids can share a figure. */
  p: string;
  y: number;
  /** Columns shown: steps[0 .. upto]. */
  upto: number;
  /** The step drawn as current (its new page accent, its hit strong, its victim red). */
  current: number;
  /** Draw the reference row above the grid. */
  refs?: readonly number[];
  heading?: string;
}

/** One replacement run as the paper grid: the references, a row per frame, then fault marks and the victims. */
function frameGrid(steps: readonly Step[], n: number, o: GridOpts): { items: Item[]; bottom: number } {
  const items: Item[] = [];
  const { p } = o;
  let y = o.y;
  if (o.heading) {
    items.push(txt(`${p}h`, 0, y, o.heading, { anchor: "start", size: 12, mono: false, weight: 600 }));
    y += 16;
  }
  if (o.refs) {
    items.push(txt(`${p}rl`, -8, y + CH / 2, "ref", { anchor: "end", tone: "soft", mono: false }));
    o.refs.forEach((r, i) => items.push(cell(`${p}r${i}`, colX(i), y, CW, CH, String(r), i === o.current ? "accent" : i > o.upto ? "muted" : "plain", 13)));
    y += CH + 12;
  }
  for (let r = 0; r < n; r++) items.push(txt(`${p}fl${r}`, -8, y + r * (CH + 4) + CH / 2, `frame ${r + 1}`, { anchor: "end", tone: "soft", mono: false }));
  for (let i = 0; i <= o.upto; i++) {
    const s = steps[i];
    for (let r = 0; r < n; r++) {
      const v = s.slots[r];
      const tone: Tone = v === null ? "ghost" : i === o.current && r === s.slot ? (s.hit ? "strong" : "accent") : "plain";
      items.push(cell(`${p}c${i}-${r}`, colX(i), y + r * (CH + 4), CW, CH, v === null ? "" : String(v), tone, 13));
    }
  }
  const my = y + n * (CH + 4) + 8;
  items.push(txt(`${p}ml`, -8, my, "fault", { anchor: "end", tone: "soft", mono: false }));
  items.push(txt(`${p}vl`, -8, my + 16, "out", { anchor: "end", tone: "soft", mono: false }));
  for (let i = 0; i <= o.upto; i++) {
    const s = steps[i];
    items.push(txt(`${p}m${i}`, colX(i) + CW / 2, my, s.hit ? "hit" : "F", { tone: s.hit ? "faint" : "accent", weight: s.hit ? undefined : 700, size: s.hit ? 10 : 11 }));
    if (s.victim !== null) items.push(txt(`${p}v${i}`, colX(i) + CW / 2, my + 16, String(s.victim), { tone: i === o.current ? "error" : "faint", size: 11 }));
  }
  return { items, bottom: my + 16 };
}

/* ── FIFO, LRU and Optimal, frame by frame ────────────────────────── */

const NAME: Record<Policy, string> = { FIFO: "FIFO", LRU: "LRU", OPT: "Optimal" };
const HIT_NOTE: Record<Policy, string> = {
  FIFO: "FIFO ignores hits, so nothing changes.",
  LRU: "it becomes the most recently used page.",
  OPT: "nothing needs to change.",
};

function replacementRun(policy: Policy, expected: number, title: string): () => Walkthrough {
  return () => {
    const steps = simulate(REFS, FRAMES, policy);
    const total = faults(steps);
    if (total !== expected) throw new Error(`${policy}: ${total} faults, the note says ${expected}`);
    const frames: Frame[] = steps.map((s, i) => {
      const { items, bottom } = frameGrid(steps, FRAMES, { p: "", y: 0, upto: i, current: i, refs: REFS });
      const sofar = faults(steps.slice(0, i + 1));
      items.push(txt("sum", 0, bottom + 24, `${count(sofar, "fault")}, ${count(i + 1 - sofar, "hit")} after ${count(i + 1, "reference")}`, { anchor: "start", size: 12, weight: 600 }));
      let caption: string;
      if (s.hit) caption = `Step ${s.t}: page ${s.page} is already in frame ${s.slot + 1}, a hit; ${HIT_NOTE[policy]}`;
      else if (s.victim === null) caption = `Step ${s.t}: page ${s.page} is not in memory, a compulsory fault. It goes into the empty frame ${s.slot + 1}.`;
      else caption = `Step ${s.t}: page ${s.page} faults and every frame is full. ${NAME[policy]} evicts page ${s.victim}, ${s.why}, and ${s.page} takes frame ${s.slot + 1}.`;
      if (i === steps.length - 1) caption += ` ${NAME[policy]} ends with ${total} faults and ${steps.length - total} hits.`;
      return { caption, items };
    });
    return finish({ title, input: `references ${REFS.join(" ")}, ${FRAMES} frames`, frames });
  };
}

/* ── The clock (second chance) ────────────────────────────────────── */

interface ClockStep {
  t: number;
  page: number;
  hit: boolean;
  slots: Array<{ page: number; bit: number } | null>;
  hand: number;
  /** Pages whose bit the sweep cleared, in order. */
  cleared: number[];
  victim: number | null;
  slot: number;
}

/** Second chance over a circular list of slots: the hand clears 1 bits until it finds a 0, evicts that page, loads the new one with bit 1 and steps on. */
function clockRun(refs: readonly number[], n: number): ClockStep[] {
  const slots: Array<{ page: number; bit: number } | null> = Array(n).fill(null);
  let hand = 0;
  const out: ClockStep[] = [];
  refs.forEach((page, t) => {
    const at = slots.findIndex((s) => s?.page === page);
    if (at !== -1) {
      slots[at]!.bit = 1;
      out.push({ t: t + 1, page, hit: true, slots: slots.map((s) => (s ? { ...s } : null)), hand, cleared: [], victim: null, slot: at });
      return;
    }
    const cleared: number[] = [];
    let victim: number | null = null;
    for (;;) {
      const s = slots[hand];
      if (s === null) break;
      if (s.bit === 0) {
        victim = s.page;
        break;
      }
      s.bit = 0;
      cleared.push(s.page);
      hand = (hand + 1) % n;
    }
    const slot = hand;
    slots[slot] = { page, bit: 1 };
    hand = (hand + 1) % n;
    out.push({ t: t + 1, page, hit: false, slots: slots.map((s) => (s ? { ...s } : null)), hand, cleared, victim, slot });
  });
  return out;
}

function clock(): Walkthrough {
  const steps = clockRun(REFS, FRAMES);
  const total = steps.filter((s) => !s.hit).length;
  if (total !== 8) throw new Error(`clock: ${total} faults, the note says 8`);
  // The note's table: the state after step 5 is 5(1) 3(0) 1(0) with the hand at slot 2.
  const s5 = steps[4];
  if (s5.slots.map((s) => `${s!.page}${s!.bit}`).join(" ") !== "51 30 10" || s5.hand !== 1) throw new Error("clock: step 5 disagrees with the note");
  const CX = 0;
  const CY = 0;
  const RING = 70;
  const R = 26;
  // Slots clockwise from the top.
  const pos = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / FRAMES;
    return { x: Math.round(CX + RING * Math.cos(a)), y: Math.round(CY + RING * Math.sin(a)) };
  });
  const RX = 150; // the reference row and the readout, right of the ring
  const frames: Frame[] = steps.map((s, i) => {
    const items: Item[] = [];
    // The circle the hand travels.
    const circle: Array<[number, number]> = [];
    for (let k = 0; k < 36; k++) circle.push([Math.round(CX + RING * Math.cos((k / 36) * 2 * Math.PI)), Math.round(CY + RING * Math.sin((k / 36) * 2 * Math.PI))]);
    items.push({ k: "path", id: "ring", pts: circle, closed: true, tone: "faint", dashed: true, width: 1.2 });
    // The hand: from the centre towards the slot it points at after the step.
    const h = pos[s.hand];
    const len = Math.hypot(h.x - CX, h.y - CY);
    items.push(arrow("hand", { x: CX, y: CY }, { x: Math.round(CX + ((h.x - CX) * (len - R - 4)) / len), y: Math.round(CY + ((h.y - CY) * (len - R - 4)) / len) }, { tone: "accent" }));
    items.push({ k: "node", id: "hub", x: CX, y: CY, r: 4, text: "", tone: "strong" });
    s.slots.forEach((slot, k) => {
      const tone: Tone = slot === null ? "ghost" : k === s.slot ? (s.hit ? "strong" : "accent") : "plain";
      items.push({ k: "node", id: `s${k}`, x: pos[k].x, y: pos[k].y, r: R, text: slot === null ? "" : String(slot.page), tone, size: 15 });
      // "slot k" and the bit side by side, over the top slot and under the others.
      const ly = k === 0 ? pos[k].y - R - 12 : pos[k].y + R + 14;
      items.push(txt(`n${k}`, pos[k].x - 3, ly, `slot ${k + 1}`, { anchor: "end", tone: "faint", size: 11, mono: false }));
      items.push(txt(`b${k}`, pos[k].x + 3, ly, slot === null ? "empty" : `bit ${slot.bit}`, { anchor: "start", tone: slot === null ? "faint" : slot.bit ? "accent" : "soft", size: 11, weight: slot?.bit ? 600 : undefined }));
    });
    // The reference string, current one marked.
    items.push(txt("rl", RX, -88, "references", { anchor: "start", tone: "soft", size: 11, mono: false, weight: 600 }));
    REFS.forEach((r, j) => items.push(cell(`r${j}`, RX + (j % 6) * 32, -74 + Math.floor(j / 6) * 32, 28, 26, String(r), j === i ? "accent" : j > i ? "muted" : "plain", 13)));
    const sofar = steps.slice(0, i + 1).filter((x) => !x.hit).length;
    items.push(txt("res", RX, 6, s.hit ? `step ${s.t}: hit, bit set to 1` : s.victim === null ? `step ${s.t}: fault, empty slot` : `step ${s.t}: fault, evict ${s.victim}`, { anchor: "start", size: 12, weight: 600, tone: s.hit ? "ink" : "accent" }));
    items.push(txt("clr", RX, 26, s.cleared.length ? `bits cleared: ${s.cleared.join(", ")}` : "no bits cleared", { anchor: "start", size: 11, tone: "soft" }));
    items.push(txt("tot", RX, 50, `${count(sofar, "fault")} so far`, { anchor: "start", size: 12 }));
    let caption: string;
    if (s.hit) caption = `Step ${s.t}: page ${s.page} is in slot ${s.slot + 1}, a hit. The hardware sets its reference bit to 1; the hand does not move.`;
    else if (s.victim === null) caption = `Step ${s.t}: page ${s.page} faults and the hand's slot ${s.slot + 1} is empty, so it loads there with bit 1 and the hand steps on to slot ${s.hand + 1}.`;
    else if (s.cleared.length >= FRAMES) caption = `Step ${s.t}: page ${s.page} faults with every bit 1. The hand sweeps the whole circle clearing bits (${s.cleared.join(", ")}), comes back to ${s.victim} and evicts it: for this fault the clock is plain FIFO.`;
    else if (s.cleared.length) caption = `Step ${s.t}: page ${s.page} faults. Page ${s.cleared.join(" and ")} had bit 1, so the hand clears it and moves on, a second chance; ${s.victim} has bit 0 and is evicted.`;
    else caption = `Step ${s.t}: page ${s.page} faults. The hand points at ${s.victim}, whose bit is 0, so ${s.victim} is evicted at once and ${s.page} loads with bit 1.`;
    if (i === steps.length - 1) caption += ` The clock ends with ${total} faults.`;
    return { caption, items };
  });
  return finish({ title: "The clock algorithm: a hand sweeping reference bits", input: `references ${REFS.join(" ")}, ${FRAMES} frames`, frames });
}

/* ── Belady's anomaly ─────────────────────────────────────────────── */

function belady(): Walkthrough {
  const three = simulate(BELADY, 3, "FIFO");
  const four = simulate(BELADY, 4, "FIFO");
  const f3 = faults(three);
  const f4 = faults(four);
  if (f3 !== 9 || f4 !== 10) throw new Error(`belady: FIFO gives ${f3} and ${f4}, the note says 9 and 10`);
  const lru3 = faults(simulate(BELADY, 3, "LRU"));
  const lru4 = faults(simulate(BELADY, 4, "LRU"));
  if (lru3 !== 10 || lru4 !== 8) throw new Error(`belady: LRU gives ${lru3} and ${lru4}, the note says 10 and 8`);
  // Step 7 (index 6): the three-frame memory holds a page the four-frame one does not — the subset property breaks.
  const K = 6;
  const set3 = three[K].slots.filter((v): v is number => v !== null);
  const set4 = four[K].slots.filter((v): v is number => v !== null);
  const missing = set3.filter((p) => !set4.includes(p));
  if (missing.length === 0) throw new Error("belady: step 7 should break the subset property");
  const items: Item[] = [];
  const top = frameGrid(three, 3, { p: "a", y: 0, upto: BELADY.length - 1, current: -1, refs: BELADY, heading: `FIFO with 3 frames: ${f3} faults` });
  items.push(...top.items);
  const bottom = frameGrid(four, 4, { p: "b", y: top.bottom + 26, upto: BELADY.length - 1, current: -1, heading: `FIFO with 4 frames: ${f4} faults` });
  // Step 7's columns, banded in both grids, before the cells they sit behind.
  items.unshift({ k: "band", id: "k1", x: colX(K) - 4, y: 16 - 4, w: CW + 8, h: top.bottom - 16 + 12, tone: "accent" });
  items.unshift({ k: "band", id: "k2", x: colX(K) - 4, y: top.bottom + 26 + 16 - 4, w: CW + 8, h: bottom.bottom - top.bottom - 26 - 16 + 12, tone: "accent" });
  items.push(...bottom.items);
  // Mark the pages the smaller memory holds and the larger one lacks.
  for (let r = 0; r < 3; r++) {
    const v = three[K].slots[r];
    if (v !== null && missing.includes(v)) {
      const c = items.findIndex((it) => it.id === `ac${K}-${r}`);
      items[c] = { ...(items[c] as Extract<Item, { k: "cell" }>), tone: "accent" };
    }
  }
  items.push(label("kt", "step 7", colX(K) + CW / 2, bottom.bottom + 16, { tone: "accent", size: 11, weight: 600 }));
  return finish({
    title: "Belady's anomaly: FIFO faults more with four frames than with three",
    input: `references ${BELADY.join(" ")}`,
    frames: [
      {
        caption: `The same string under FIFO: ${f3} faults with three frames, ${f4} with four. At step 7 the smaller memory holds {${set3.join(", ")}} and the larger {${set4.join(", ")}}: page ${missing.join(" and ")} is in the smaller one only, so the next references hit with three frames and fault with four.`,
        items,
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  fifo: replacementRun("FIFO", 9, "FIFO page replacement, one reference at a time"),
  optimal: replacementRun("OPT", 6, "Optimal page replacement, one reference at a time"),
  lru: replacementRun("LRU", 7, "LRU page replacement, one reference at a time"),
  clock,
  belady,
};
