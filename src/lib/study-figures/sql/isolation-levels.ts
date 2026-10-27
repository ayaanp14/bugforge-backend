import { finish, textWidth, type Item, type Tone, type Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Isolation levels: the lesson's three anomalies, each run as two
 * transactions against a small model of InnoDB's row — a committed value
 * and, while a writer is open, its uncommitted one.
 *
 *  - dirty-read: T1 under READ UNCOMMITTED reads T2's uncommitted 0, then T2
 *    rolls back;
 *  - non-repeatable-read: under READ COMMITTED each statement reads the
 *    latest committed value, so T1's two reads straddle T2's commit;
 *  - phantom-read: T1's COUNT(*) over balance > 500 runs twice around T2's
 *    committed INSERT.
 *
 * Every value a SELECT shows is what the model returns at that step; each
 * figure throws if that disagrees with the comment in the lesson's listing.
 * `timeline` is shared with locks-and-deadlocks.ts and mvcc.ts.
 */

export interface Step {
  /** Which transaction runs it. */
  t: 1 | 2;
  text: string;
  tone?: Tone;
}

const COL_W = 172;
const ROW_H = 30;
const ROW_GAP = 6;
const STEP_X = 0;
const T1_X = 28;
const T2_X = T1_X + COL_W + 14;
/** Where a timeline's side panel may start. */
export const PANEL_X = T2_X + COL_W + 24;

/**
 * Two transactions side by side, one statement per row, steps 0 … upto
 * drawn (the current one accented unless it brings its own tone). Ids are
 * by step, so earlier steps stay put as later ones arrive.
 */
export function timeline(steps: readonly Step[], upto: number): { items: Item[]; bottom: number } {
  const y0 = 28;
  const rowY = (s: number) => y0 + s * (ROW_H + ROW_GAP);
  const bottom = rowY(steps.length) - ROW_GAP;
  const items: Item[] = [
    label("h1", "T1", T1_X + COL_W / 2, 8, { tone: "ink", weight: 700, size: 12.5 }),
    label("h2", "T2", T2_X + COL_W / 2, 8, { tone: "ink", weight: 700, size: 12.5 }),
    { k: "edge", id: "life1", x1: T1_X + COL_W / 2, y1: 18, x2: T1_X + COL_W / 2, y2: bottom, tone: "faint", dashed: true },
    { k: "edge", id: "life2", x1: T2_X + COL_W / 2, y1: 18, x2: T2_X + COL_W / 2, y2: bottom, tone: "faint", dashed: true },
  ];
  steps.forEach((s, i) => {
    if (i > upto) return;
    for (const w of [textWidth(s.text, 11)]) if (w + 12 > COL_W) throw new Error(`timeline: "${s.text}" is too long for a column`);
    items.push(label(`n${i}`, String(i + 1), STEP_X + 8, rowY(i) + ROW_H / 2, { tone: "faint", size: 11, mono: true }));
    items.push(box(`s${i}`, s.t === 1 ? T1_X : T2_X, rowY(i), s.text, { w: COL_W, h: ROW_H, size: 11, tone: s.tone ?? (i === upto ? "accent" : "plain") }));
  });
  return { items, bottom };
}

/** A small labelled value cell in the side panel. */
export function panelCell(id: string, caption: string, value: string, y: number, tone: Tone = "plain", w = 110): Item[] {
  return [label(`${id}l`, caption, PANEL_X, y, { anchor: "start", tone: "soft", size: 11, weight: 600 }), box(id, PANEL_X, y + 8, value, { w, h: 28, size: 12, tone })];
}

/* ── The anomalies ────────────────────────────────────────────────── */

type Level = "READ UNCOMMITTED" | "READ COMMITTED";

/** One account row: the committed balance and, while T2 is open, its uncommitted write. */
class Row1 {
  committed = 1000;
  pending: number | null = null;
  read(level: Level): number {
    return level === "READ UNCOMMITTED" && this.pending !== null ? this.pending : this.committed;
  }
}

function rowPanel(r: Row1, read: { value: number; bad?: boolean } | null): Item[] {
  return [
    label("ph", "account 1: balance", PANEL_X, 8, { anchor: "start", tone: "ink", weight: 700, size: 12.5 }),
    ...panelCell("pc", "committed", String(r.committed), 30, "plain"),
    ...panelCell("pp", "T2, uncommitted", r.pending === null ? "—" : String(r.pending), 82, r.pending === null ? "ghost" : "accent"),
    ...(read ? panelCell("pr", "T1 just read", String(read.value), 134, read.bad ? "error" : "strong") : []),
  ];
}

function dirtyRead(): Walkthrough {
  const row = new Row1();
  const steps: Step[] = [
    { t: 2, text: "START TRANSACTION;" },
    { t: 2, text: "UPDATE … balance = 0;" },
    { t: 1, text: "SELECT balance; -- 0" },
    { t: 2, text: "ROLLBACK;" },
  ];
  const frames = [];
  frames.push({ caption: "T2 opens a transaction on Asha's account, whose committed balance is 1000. T1 runs under READ UNCOMMITTED.", items: [...timeline(steps, 0).items, ...rowPanel(row, null)] });
  row.pending = 0;
  frames.push({ caption: "T2 sets the balance to 0 but has not committed. The committed value is still 1000; the 0 exists only inside T2.", items: [...timeline(steps, 1).items, ...rowPanel(row, null)] });
  const seen = row.read("READ UNCOMMITTED");
  if (seen !== 0) throw new Error("dirty-read: T1 should see 0");
  frames.push({ caption: `T1 reads the newest version, committed or not, and sees ${seen}: a dirty read of a write that may never happen.`, items: [...timeline(steps, 2).items, ...rowPanel(row, { value: seen })] });
  row.pending = null;
  frames.push({
    caption: `T2 rolls back. The balance was ${row.committed} all along in every committed state, so the ${seen} T1 acted on never existed. READ COMMITTED and above prevent this.`,
    items: [...timeline(steps, 3).items, ...rowPanel(row, { value: seen, bad: true })],
  });
  return finish({ title: "A dirty read: reading a write that is rolled back", input: "T1 at READ UNCOMMITTED; accounts id 1, balance 1000", frames });
}

function nonRepeatableRead(): Walkthrough {
  const row = new Row1();
  const steps: Step[] = [
    { t: 1, text: "START TRANSACTION;" },
    { t: 1, text: "SELECT balance; -- 1000" },
    { t: 2, text: "UPDATE … balance = 700;" },
    { t: 2, text: "COMMIT;" },
    { t: 1, text: "SELECT balance; -- 700" },
  ];
  const level: Level = "READ COMMITTED";
  const frames = [];
  frames.push({ caption: "T1 starts a transaction under READ COMMITTED, where every statement reads the latest committed data.", items: [...timeline(steps, 0).items, ...rowPanel(row, null)] });
  const first = row.read(level);
  frames.push({ caption: `T1's first read sees the committed ${first}.`, items: [...timeline(steps, 1).items, ...rowPanel(row, { value: first })] });
  row.pending = 700;
  frames.push({ caption: "T2 updates the balance to 700. Uncommitted, so T1 could not see it even if it read now.", items: [...timeline(steps, 2).items, ...rowPanel(row, { value: first })] });
  row.committed = row.pending;
  row.pending = null;
  frames.push({ caption: `T2 commits: ${row.committed} is now the committed balance.`, items: [...timeline(steps, 3).items, ...rowPanel(row, { value: first })] });
  const second = row.read(level);
  if (first !== 1000 || second !== 700) throw new Error("non-repeatable-read: reads disagree with the lesson");
  frames.push({
    caption: `T1 reads the same row again and gets ${second}, not ${first}. Nothing dirty was read, yet one transaction saw two values — REPEATABLE READ keeps one snapshot and prevents it.`,
    items: [...timeline(steps, 4).items, ...rowPanel(row, { value: second, bad: true })],
  });
  return finish({ title: "A non-repeatable read: the same row, two answers", input: "T1 at READ COMMITTED; accounts id 1, balance 1000", frames });
}

function phantomRead(): Walkthrough {
  const committed = [
    { id: 1, balance: 1000 },
    { id: 2, balance: 800 },
    { id: 3, balance: 600 },
    { id: 4, balance: 300 },
  ];
  let pending: { id: number; balance: number } | null = null;
  const count = () => committed.filter((r) => r.balance > 500).length;
  const steps: Step[] = [
    { t: 1, text: "START TRANSACTION;" },
    { t: 1, text: "COUNT(*) … > 500; -- 3" },
    { t: 2, text: "INSERT (9, 'Zoya', 900);" },
    { t: 2, text: "COMMIT;" },
    { t: 1, text: "COUNT(*) … > 500; -- 4" },
  ];
  const panel = (seen: number | null, bad = false): Item[] => {
    const rows = [...committed, ...(pending ? [pending] : [])];
    const items: Item[] = [label("ph", "accounts: id: balance", PANEL_X, 8, { anchor: "start", tone: "ink", weight: 700, size: 12.5 })];
    rows.forEach((r, i) => {
      const isPending = r === pending;
      items.push(box(`r${r.id}`, PANEL_X, 22 + i * 30, `${r.id}: ${r.balance}`, { w: 96, h: 26, size: 12, tone: isPending ? "ghost" : r.balance > 500 ? (r.id === 9 ? "strong" : "accent") : "muted" }));
    });
    if (seen !== null) items.push(...panelCell("pr", "T1 counted", String(seen), 22 + 5 * 30 + 12, bad ? "error" : "strong", 96));
    return items;
  };
  const frames = [];
  frames.push({ caption: `T1 starts. Of the ${committed.length} accounts, ${count()} hold more than 500.`, items: [...timeline(steps, 0).items, ...panel(null)] });
  const first = count();
  frames.push({ caption: `T1 counts the accounts over 500: ${first}.`, items: [...timeline(steps, 1).items, ...panel(first)] });
  pending = { id: 9, balance: 900 };
  frames.push({ caption: "T2 inserts Zoya's account with 900 — a row that matches T1's condition but did not exist when T1 read. Not yet committed.", items: [...timeline(steps, 2).items, ...panel(first)] });
  committed.push(pending);
  pending = null;
  frames.push({ caption: "T2 commits, and the new row is part of the committed data.", items: [...timeline(steps, 3).items, ...panel(first)] });
  const second = count();
  if (first !== 3 || second !== 4) throw new Error("phantom-read: counts disagree with the lesson");
  frames.push({
    caption: `T1 runs the same query and gets ${second}. No row it saw changed; a new one appeared — a phantom. Locking the rows read cannot stop it; preventing it means locking the range, gaps included.`,
    items: [...timeline(steps, 4).items, ...panel(second, true)],
  });
  return finish({ title: "A phantom read: the same query, a new row", input: "T1 at READ COMMITTED; COUNT(*) WHERE balance > 500", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "dirty-read": dirtyRead,
  "non-repeatable-read": nonRepeatableRead,
  "phantom-read": phantomRead,
};
