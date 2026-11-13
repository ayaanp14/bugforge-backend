import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, label } from "../lesson-figures/kit.js";
import { classBox, lines, umlLink, type ClassSpec, type Pt, type UmlKind } from "./kit.js";

/**
 * Design an Expense Sharing App: the note's figures
 * (content/notes/low-level-design/design-an-expense-sharing-app.md). The
 * split strategies, the balance sheet and the debt simplifier are a
 * TypeScript model of the note's program; the program's scenario is run on
 * it and its printed lines checked against the note's output fence first:
 *
 *  - class-diagram: the classes added one a frame, Split as a Strategy;
 *  - split-strategies: one 1000 bill through EqualSplit, ExactSplit (a valid
 *    and a rejected input) and PercentSplit, every share computed;
 *  - balance-updates: the program's three expenses applied to the net
 *    balances one at a time, each frame checked to sum to zero;
 *  - simplify-debts: a four-friend trip, pairwise debts, then the greedy
 *    settle (largest debtor pays largest creditor) run step by step.
 */

/* ── The model ────────────────────────────────────────────────────── */

interface Split {
  name: string;
  input: string;
  shares(amount: number, n: number): number[];
}

const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0);

const equalSplit = (): Split => ({
  name: "EQUAL",
  input: "no input",
  shares: (amount, n) => Array.from({ length: n }, (_, i) => Math.floor(amount / n) + (i < amount % n ? 1 : 0)),
});
const exactSplit = (amounts: number[]): Split => ({
  name: "EXACT",
  input: `amounts [${amounts.join(", ")}]`,
  shares: (amount) => {
    if (sum(amounts) !== amount) throw new RangeError("exact shares must add up to the amount");
    return [...amounts];
  },
});
const percentSplit = (percents: number[]): Split => ({
  name: "PERCENT",
  input: `percents [${percents.join(", ")}]`,
  shares: (amount, n) => {
    if (sum(percents) !== 100) throw new RangeError("percents must add up to 100");
    const s = percents.slice(0, n).map((p) => Math.floor((amount * p) / 100));
    s[0] += amount - sum(s);
    return s;
  },
});

class BalanceSheet {
  owes = new Map<string, number>();
  out: string[] = [];
  constructor(readonly members: string[]) {}
  owed(d: string, c: string) {
    return this.owes.get(`${d}>${c}`) ?? 0;
  }
  add(desc: string, amount: number, payer: string, split: Split) {
    const s = split.shares(amount, this.members.length);
    this.out.push(`${desc} ${amount} paid by ${payer}, ${split.name}: ${this.members.map((p, i) => `${p} ${s[i]}`).join(", ")}`);
    this.members.forEach((p, i) => {
      if (p !== payer) this.owes.set(`${p}>${payer}`, this.owed(p, payer) + s[i]);
    });
    return s;
  }
  pairwise(): Array<[string, string, number]> {
    const out: Array<[string, string, number]> = [];
    this.members.forEach((a, i) =>
      this.members.slice(i + 1).forEach((b) => {
        const d = this.owed(a, b) - this.owed(b, a);
        if (d > 0) out.push([a, b, d]);
        else if (d < 0) out.push([b, a, -d]);
      }),
    );
    return out;
  }
  net(): Map<string, number> {
    const n = new Map<string, number>();
    for (const p of this.members) n.set(p, sum(this.members.map((q) => this.owed(q, p) - this.owed(p, q))));
    return n;
  }
  /** Greedy: the largest creditor is paid by the largest debtor; ties go to the first name. Each step is recorded with the balances before it. */
  simplify(trace?: Array<{ before: Map<string, number>; move: [string, string, number] }>): Array<[string, string, number]> {
    const net = this.net();
    const moves: Array<[string, string, number]> = [];
    for (;;) {
      let cred = this.members[0];
      let debt = this.members[0];
      for (const p of this.members) {
        if (net.get(p)! > net.get(cred)!) cred = p;
        if (net.get(p)! < net.get(debt)!) debt = p;
      }
      if (net.get(cred) === 0) return moves;
      const pay = Math.min(net.get(cred)!, -net.get(debt)!);
      const move: [string, string, number] = [debt, cred, pay];
      trace?.push({ before: new Map(net), move });
      net.set(cred, net.get(cred)! - pay);
      net.set(debt, net.get(debt)! + pay);
      moves.push(move);
    }
  }
}

const signed = (v: number) => (v > 0 ? `+${v}` : String(v));
const FRIENDS = ["asha", "ben", "chen"];
const EXPENSES: Array<{ desc: string; amount: number; payer: string; split: () => Split }> = [
  { desc: "dinner", amount: 900, payer: "asha", split: equalSplit },
  { desc: "cab", amount: 1000, payer: "ben", split: () => percentSplit([50, 20, 30]) },
  { desc: "tickets", amount: 600, payer: "chen", split: () => exactSplit([250, 250, 100]) },
];

/** The note's output fence. */
const PROGRAM_OUTPUT = [
  "dinner 900 paid by asha, EQUAL: asha 300, ben 300, chen 300",
  "cab 1000 paid by ben, PERCENT: asha 500, ben 200, chen 300",
  "tickets 600 paid by chen, EXACT: asha 250, ben 250, chen 100",
  "owes: asha -> ben 200",
  "owes: chen -> asha 50",
  "owes: chen -> ben 50",
  "net: asha -150, ben +250, chen -100",
  "settle: asha pays ben 150",
  "settle: chen pays ben 100",
  "transfers: 3 -> 2",
];

/** The program's main(), on the model; returns the net balances after each expense. */
function runProgram() {
  const sheet = new BalanceSheet(FRIENDS);
  const after: Array<Map<string, number>> = [sheet.net()];
  for (const e of EXPENSES) {
    sheet.add(e.desc, e.amount, e.payer, e.split());
    after.push(sheet.net());
  }
  const pairs = sheet.pairwise();
  for (const [d, c, a] of pairs) sheet.out.push(`owes: ${d} -> ${c} ${a}`);
  const net = sheet.net();
  sheet.out.push(`net: ${FRIENDS.map((p) => `${p} ${signed(net.get(p)!)}`).join(", ")}`);
  const moves = sheet.simplify();
  for (const [d, c, a] of moves) sheet.out.push(`settle: ${d} pays ${c} ${a}`);
  sheet.out.push(`transfers: ${pairs.length} -> ${moves.length}`);
  if (sheet.out.join("\n") !== PROGRAM_OUTPUT.join("\n")) throw new Error(`expenses: the model printed ${JSON.stringify(sheet.out)}`);
  for (const n of after) if (sum([...n.values()]) !== 0) throw new Error("expenses: net balances must sum to zero");
  return { after };
}

/* ── Class diagram, built up ──────────────────────────────────────── */

const COL_W = 150;
const COL_GAP = 36;
const colX = (c: number) => c * (COL_W + COL_GAP);

interface Cls {
  key: string;
  spec: ClassSpec;
  col: number;
  row: number;
  why: string;
}

const CLASSES: Cls[] = [
  { key: "expense", spec: { name: "Expense", fields: ["- amount, paidBy", "- split: Split"] }, col: 1, row: 1, why: "Start from the event the app records: an Expense has an amount, the person who paid it and a rule for dividing it." },
  { key: "user", spec: { name: "User", fields: ["- id", "- name"] }, col: 0, row: 0, why: "paidBy points at a User. Users exist on their own; an expense only refers to them." },
  {
    key: "group",
    spec: { name: "Group", fields: ["- members: List", "- expenses: List"] },
    col: 1,
    row: 0,
    why: "A Group (a trip, a flat) aggregates its members and owns its expenses: delete the group and its expenses go with it, the users stay.",
  },
  {
    key: "sheet",
    spec: { name: "BalanceSheet", fields: ["- net: Map"], methods: ["+ apply(expense)", "+ simplify()"] },
    col: 2,
    row: 0,
    why: "Each group owns one BalanceSheet. apply(expense) updates every member's net balance; simplify() turns the balances into the fewest payments.",
  },
  {
    key: "split",
    spec: { name: "Split", stereotype: "interface", methods: ["+ shares(amt, n)"] },
    col: 1,
    row: 2,
    why: "The split rule is a Strategy: Expense holds a Split and calls shares(amount, n) without knowing which kind it is.",
  },
  { key: "equal", spec: { name: "EqualSplit", methods: ["+ shares(amt, n)"] }, col: 0, row: 3, why: "EqualSplit needs no input: amount divided by n, with any leftover rupees given to the first members so the shares still add up." },
  { key: "exact", spec: { name: "ExactSplit", fields: ["- amounts: int[]"], methods: ["+ shares(amt, n)"] }, col: 1, row: 3, why: "ExactSplit takes one amount per person and refuses them unless they add up to the expense." },
  {
    key: "percent",
    spec: { name: "PercentSplit", fields: ["- percents: int[]"], methods: ["+ shares(amt, n)"] },
    col: 2,
    row: 3,
    why: "PercentSplit takes percentages that must total 100. A new rule (shares, weights) is a new class; Expense and BalanceSheet never change.",
  },
];

type Side = "top" | "bottom" | "left" | "right";
interface Rel {
  id: string;
  from: string;
  to: string;
  kind: UmlKind;
  a: [Side, number];
  b: [Side, number];
}

const RELS: Rel[] = [
  { id: "expense-user", from: "expense", to: "user", kind: "associates", a: ["left", 0.5], b: ["bottom", 0.6] },
  { id: "group-user", from: "group", to: "user", kind: "aggregates", a: ["left", 0.5], b: ["right", 0.5] },
  { id: "group-expense", from: "group", to: "expense", kind: "composes", a: ["bottom", 0.5], b: ["top", 0.5] },
  { id: "group-sheet", from: "group", to: "sheet", kind: "composes", a: ["right", 0.5], b: ["left", 0.5] },
  { id: "sheet-expense", from: "sheet", to: "expense", kind: "depends", a: ["bottom", 0.5], b: ["right", 0.5] },
  { id: "expense-split", from: "expense", to: "split", kind: "associates", a: ["bottom", 0.5], b: ["top", 0.5] },
  { id: "equal-split", from: "equal", to: "split", kind: "implements", a: ["top", 0.5], b: ["bottom", 0.25] },
  { id: "exact-split", from: "exact", to: "split", kind: "implements", a: ["top", 0.5], b: ["bottom", 0.5] },
  { id: "percent-split", from: "percent", to: "split", kind: "implements", a: ["top", 0.5], b: ["bottom", 0.75] },
];

function classDiagram(): Walkthrough {
  // Lay every box out once: a row is as tall as its tallest box.
  const heights = CLASSES.map((c) => classBox("probe", c.spec, { w: COL_W }).h);
  const rows = Math.max(...CLASSES.map((c) => c.row)) + 1;
  const rowH = Array.from({ length: rows }, (_, r) => Math.max(...CLASSES.map((c, i) => (c.row === r ? heights[i] : 0))));
  const rowY = rowH.map((_, r) => sum(rowH.slice(0, r)) + r * 34);
  const geo = new Map(CLASSES.map((c, i) => [c.key, { x: colX(c.col), y: rowY[c.row], h: heights[i] }]));
  const anchor = (key: string, [side, f]: [Side, number]): Pt => {
    const g = geo.get(key)!;
    if (side === "top") return { x: g.x + COL_W * f, y: g.y };
    if (side === "bottom") return { x: g.x + COL_W * f, y: g.y + g.h };
    if (side === "left") return { x: g.x, y: g.y + g.h * f };
    return { x: g.x + COL_W, y: g.y + g.h * f };
  };
  const frames: Frame[] = CLASSES.map((added, k) => {
    const present = new Set(CLASSES.slice(0, k + 1).map((c) => c.key));
    const items: Item[] = [];
    for (const c of CLASSES.slice(0, k + 1)) {
      const g = geo.get(c.key)!;
      items.push(...classBox(`c-${c.key}`, c.spec, { x: g.x, y: g.y, w: COL_W, tone: c === added ? "accent" : "plain" }).items);
    }
    for (const r of RELS) {
      if (!present.has(r.from) || !present.has(r.to)) continue;
      const fresh = r.from === added.key || r.to === added.key;
      items.push(...umlLink(`r-${r.id}`, anchor(r.from, r.a), anchor(r.to, r.b), r.kind, { tone: fresh ? "accent" : "ink" }));
    }
    return { caption: added.why, items };
  });
  return finish({ title: "The expense model, one class at a time", input: "", frames });
}

/* ── Split strategies ─────────────────────────────────────────────── */

function splitStrategies(): Walkthrough {
  const AMOUNT = 1000;
  const trials: Array<{ cls: string; split: Split }> = [
    { cls: "EqualSplit", split: equalSplit() },
    { cls: "ExactSplit", split: exactSplit([200, 300, 500]) },
    { cls: "ExactSplit", split: exactSplit([200, 300, 400]) },
    { cls: "PercentSplit", split: percentSplit([50, 30, 20]) },
  ];
  const CLS = ["EqualSplit", "ExactSplit", "PercentSplit"];
  const CHIP = 118;
  const UNIT = 0.3;
  const BAR_X = 58;
  const frames: Frame[] = trials.map((t, k) => {
    let shares: number[] | null = null;
    let error = "";
    try {
      shares = t.split.shares(AMOUNT, FRIENDS.length);
    } catch (e) {
      error = (e as Error).message;
    }
    if (shares && sum(shares) !== AMOUNT) throw new Error("split-strategies: shares must add up to the amount");
    const items: Item[] = CLS.map((c, i) => box(`chip${i}`, i * (CHIP + 8), 0, c, { w: CHIP, h: 30, size: 11.5, tone: c === t.cls ? (shares ? "accent" : "error") : "muted" }));
    items.push(label("call", `shares(${AMOUNT}, ${FRIENDS.length}) · ${t.split.input}`, 0, 50, { anchor: "start", size: 11.5, mono: true, tone: "ink" }));
    FRIENDS.forEach((p, i) => {
      const y = 70 + i * 34;
      items.push(label(`n${i}`, p, 0, y + 13, { anchor: "start", size: 12, mono: true }));
      const v = shares ? shares[i] : 0;
      items.push(box(`b${i}`, BAR_X, y, "", { w: Math.max(2, Math.round(v * UNIT)), h: 26, tone: shares ? "strong" : "muted" }));
      items.push(label(`v${i}`, shares ? String(v) : "—", BAR_X + Math.max(2, Math.round(v * UNIT)) + 8, y + 13, { anchor: "start", size: 12, mono: true, tone: shares ? "ink" : "faint" }));
    });
    items.push(label("sum", shares ? `sum = ${sum(shares)}, matches ${AMOUNT}` : `refused: ${error}`, 0, 186, { anchor: "start", size: 11.5, mono: true, tone: shares ? "accent" : "error" }));
    const caption =
      k === 0
        ? `EqualSplit divides ${AMOUNT} by ${FRIENDS.length}: ${Math.floor(AMOUNT / 3)} each leaves ${AMOUNT % 3} rupee over, so the first member pays ${shares![0]} and the shares still add up to ${AMOUNT}.`
        : shares && t.cls === "ExactSplit"
          ? `ExactSplit takes the amounts as given, ${shares.join(", ")}, after checking they add up to ${AMOUNT}.`
          : shares
            ? `PercentSplit turns ${t.split.input.replace("percents ", "")} into ${shares.join(", ")}. Same interface, same caller, a different rule: that is the Strategy pattern.`
            : `ExactSplit with ${t.split.input.replace("amounts ", "")} adds up to ${AMOUNT - 100}, not ${AMOUNT}, so it is refused before any balance changes. Validate in the strategy, not the UI.`;
    return { caption, items };
  });
  return finish({ title: "One bill, three split strategies", input: "", frames });
}

/* ── Balance updates ──────────────────────────────────────────────── */

function balanceUpdates(): Walkthrough {
  const { after } = runProgram();
  const UNIT = 0.17;
  const ZERO = 118;
  const COL = 86;
  const BW = 52;
  const LX = 290;
  const frames: Frame[] = after.map((net, k) => {
    const prev = after[Math.max(0, k - 1)];
    const items: Item[] = [{ k: "edge", id: "zero", x1: -8, y1: ZERO, x2: COL * 2 + BW + 8, y2: ZERO, tone: "line" }];
    FRIENDS.forEach((p, i) => {
      const v = net.get(p)!;
      const h = Math.max(2, Math.round(Math.abs(v) * UNIT));
      const x = i * COL;
      const changed = k > 0 && v !== prev.get(p);
      const tone: Tone = changed ? "accent" : v === 0 ? "muted" : "plain";
      items.push(box(`b${i}`, x, v >= 0 ? ZERO - h : ZERO, "", { w: BW, h, tone }));
      items.push(label(`v${i}`, signed(v), x + BW / 2, v >= 0 ? ZERO - h - 10 : ZERO + h + 12, { size: 12, mono: true, weight: 600, tone: changed ? "accent" : "ink" }));
      items.push(label(`n${i}`, p, x + BW / 2, 256, { size: 12, mono: true }));
    });
    items.push(label("lh", "expenses", LX, 10, { anchor: "start", size: 11, weight: 600, tone: "soft" }));
    items.push(
      ...lines(
        "e",
        EXPENSES.map((e) => `${e.payer} paid ${e.amount} (${e.split().name})`),
        LX,
        32,
        { size: 11, tone: (i) => (i === k - 1 ? "accent" : i < k ? "ink" : "faint") },
      ),
    );
    items.push(label("total", `sum of balances: ${sum([...net.values()])}`, LX, 100, { anchor: "start", size: 11, mono: true, tone: "soft" }));
    const e = EXPENSES[k - 1];
    const caption =
      k === 0
        ? "A balance is what the group owes you minus what you owe the group. Before any expense everyone is at zero, and the balances always add up to zero."
        : `${e.payer} paid ${e.amount} for ${e.desc}: ${e.payer} is credited the amount, and every member is debited their share. Balances now ${FRIENDS.map((p) => signed(net.get(p)!)).join(", ")}, still summing to zero.`;
    return { caption, items };
  });
  return finish({ title: "Each expense moves the net balances, which always sum to zero", input: "", frames });
}

/* ── Simplify debts ───────────────────────────────────────────────── */

function simplifyDebts(): Walkthrough {
  const TRIP = ["asha", "ben", "chen", "dev"];
  const sheet = new BalanceSheet(TRIP);
  sheet.add("hotel", 800, "asha", equalSplit());
  sheet.add("fuel", 400, "ben", equalSplit());
  const pairs = sheet.pairwise();
  const start = sheet.net();
  const trace: Array<{ before: Map<string, number>; move: [string, string, number] }> = [];
  const moves = sheet.simplify(trace);
  if (sum([...start.values()]) !== 0) throw new Error("simplify-debts: balances must sum to zero");
  if (moves.length >= pairs.length) throw new Error("simplify-debts: simplifying should save transfers here");
  // Applying the moves must bring every balance to zero.
  const check = new Map(start);
  for (const [d, c, a] of moves) {
    check.set(d, check.get(d)! + a);
    check.set(c, check.get(c)! - a);
  }
  if ([...check.values()].some((v) => v !== 0)) throw new Error("simplify-debts: the moves do not settle everyone");

  const UNIT = 0.2;
  const ZERO = 112;
  const COL = 78;
  const BW = 48;
  const NAME_Y = 212;
  const LX = 330;
  const mid = (p: string) => TRIP.indexOf(p) * COL + BW / 2;
  const chart = (net: Map<string, number>, hot: string[], prefix: string) => {
    const items: Item[] = [{ k: "edge", id: "zero", x1: -8, y1: ZERO, x2: COL * 3 + BW + 8, y2: ZERO, tone: "line" }];
    TRIP.forEach((p, i) => {
      const v = net.get(p)!;
      const h = Math.max(2, Math.round(Math.abs(v) * UNIT));
      const x = i * COL;
      const tone: Tone = hot.includes(p) ? "accent" : v === 0 ? "muted" : "plain";
      items.push(box(`b${i}`, x, v >= 0 ? ZERO - h : ZERO, "", { w: BW, h, tone }));
      items.push(label(`v${i}`, signed(v), x + BW / 2, v >= 0 ? ZERO - h - 10 : ZERO + h + 12, { size: 12, mono: true, weight: 600, tone: hot.includes(p) ? "accent" : "ink" }));
      items.push(label(`n${i}`, p, x + BW / 2, NAME_Y, { size: 12, mono: true }));
    });
    items.push(label("lh", prefix, LX, 10, { anchor: "start", size: 11, weight: 600, tone: "soft" }));
    return items;
  };
  const arc = (d: string, c: string, amount: number): Item => {
    const x1 = mid(d);
    const x2 = mid(c);
    const dir = Math.sign(x2 - x1);
    return { k: "edge", id: "arc", x1, y1: NAME_Y + 12, x2, y2: NAME_Y + 12, tone: "accent", arrow: true, bow: dir * Math.abs(x2 - x1) * 0.28, label: String(amount) };
  };
  const frames: Frame[] = [];
  frames.push({
    caption: `A trip: asha paid 800 for the hotel and ben 400 for fuel, both split equally four ways. Netting each pair still leaves ${pairs.length} payments between friends.`,
    items: [...chart(start, [], `pairwise debts (${pairs.length})`), ...lines("l", pairs.map(([d, c, a]) => `${d} -> ${c} ${a}`), LX, 32, { size: 11.5 })],
  });
  frames.push({
    caption: `Who owes whom does not matter, only each person's net balance: ${TRIP.map((p) => `${p} ${signed(start.get(p)!)}`).join(", ")}. They sum to zero, so debtors can pay creditors directly.`,
    items: [...chart(start, [], "settlements"), label("hint", "largest debtor pays largest creditor", LX, 32, { anchor: "start", size: 11, tone: "soft" })],
  });
  trace.forEach((t, k) => {
    const [d, c, a] = t.move;
    const after = new Map(t.before);
    after.set(d, after.get(d)! + a);
    after.set(c, after.get(c)! - a);
    const tied = TRIP.filter((p) => p !== d && t.before.get(p) === t.before.get(d));
    const done = trace.slice(0, k + 1).map((x) => `${x.move[0]} pays ${x.move[1]} ${x.move[2]}`);
    const last = k === trace.length - 1;
    frames.push({
      caption: last
        ? `Then ${d} pays ${c} ${a} and every balance is zero: ${moves.length} payments instead of ${pairs.length}. Greedy is short but not always minimal; the true minimum is NP-hard.`
        : `The largest creditor is ${c} (${signed(t.before.get(c)!)}), the largest debtor ${d} (${t.before.get(d)})${tied.length ? `, first by name among the tied debtors` : ""}. ${d} pays ${c} ${a}, the smaller of the two, and one of them is settled.`,
      items: [
        ...chart(after, [d, c], "settlements"),
        arc(d, c, a),
        ...lines("l", done, LX, 32, { size: 11.5, tone: (i) => (i === k ? "accent" : "ink") }),
      ],
    });
  });
  return finish({ title: "Simplify debts: net balances, then settle greedily", input: "", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "class-diagram": classDiagram,
  "split-strategies": splitStrategies,
  "balance-updates": balanceUpdates,
  "simplify-debts": simplifyDebts,
};
