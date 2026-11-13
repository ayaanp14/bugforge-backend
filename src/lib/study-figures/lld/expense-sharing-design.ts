import { finish, type Frame, type Item, type Walkthrough } from "../../walkthroughs/core.js";
import { arrow, label } from "../../lesson-figures/kit.js";

/**
 * The expense sharing lesson's figure (scripts/study-plans/lld/07-expense-sharing):
 *
 *  - settle-greedy: the settle-up program's visible case. Two equal-split
 *    expenses move the four balances (paise, leftovers to the first member),
 *    then the greedy rule, the largest debtor paying the largest creditor
 *    with ties by name, settles them one transfer a frame. The model is that
 *    program's BalanceSheet and its printed lines are checked against the
 *    case's expected output; the balances are drawn as bars above and below
 *    a zero line, so the zero-sum invariant is visible in every frame.
 */

const MEMBERS = ["asha", "ben", "chen", "dev"];
const EXPENSES: Array<{ payer: string; amount: number; among: string[] }> = [
  { payer: "asha", amount: 120000, among: ["asha", "ben", "chen", "dev"] },
  { payer: "ben", amount: 20000, among: ["chen", "dev"] },
];
const EXPECTED = [
  "asha paid 1200.00: asha 300.00, ben 300.00, chen 300.00, dev 300.00",
  "ben paid 200.00: chen 100.00, dev 100.00",
  "chen pays asha 400.00",
  "dev pays asha 400.00",
  "ben pays asha 100.00",
  "transfers: 3",
];

const money = (p: number) => `${p < 0 ? "-" : ""}${Math.floor(Math.abs(p) / 100)}.${String(Math.abs(p) % 100).padStart(2, "0")}`;
const signed = (p: number) => (p > 0 ? `+${money(p)}` : money(p));

interface State {
  balance: Map<string, number>;
  /** The transfer this frame made, if any. */
  transfer?: { from: string; to: string; amount: number };
  said: string;
}

function run(): State[] {
  const balance = new Map(MEMBERS.map((m) => [m, 0]));
  const states: State[] = [{ balance: new Map(balance), said: "" }];
  const printed: string[] = [];
  for (const e of EXPENSES) {
    balance.set(e.payer, balance.get(e.payer)! + e.amount);
    const n = e.among.length;
    const parts = e.among.map((m, i) => {
      const share = Math.floor(e.amount / n) + (i < e.amount % n ? 1 : 0);
      balance.set(m, balance.get(m)! - share);
      return `${m} ${money(share)}`;
    });
    const said = `${e.payer} paid ${money(e.amount)}: ${parts.join(", ")}`;
    printed.push(said);
    states.push({ balance: new Map(balance), said });
  }
  const names = [...MEMBERS].sort();
  let transfers = 0;
  for (;;) {
    let cred: string | null = null;
    let debt: string | null = null;
    for (const m of names) {
      const b = balance.get(m)!;
      if (b > 0 && (cred === null || b > balance.get(cred)!)) cred = m;
      if (b < 0 && (debt === null || b < balance.get(debt)!)) debt = m;
    }
    if (cred === null || debt === null) break;
    const pay = Math.min(balance.get(cred)!, -balance.get(debt)!);
    balance.set(cred, balance.get(cred)! - pay);
    balance.set(debt, balance.get(debt)! + pay);
    transfers++;
    const said = `${debt} pays ${cred} ${money(pay)}`;
    printed.push(said);
    states.push({ balance: new Map(balance), transfer: { from: debt, to: cred, amount: pay }, said });
  }
  printed.push(`transfers: ${transfers}`);
  if (printed.join("\n") !== EXPECTED.join("\n")) throw new Error(`expense-sharing-design settle-greedy: the model printed ${JSON.stringify(printed)}`);
  for (const s of states) if ([...s.balance.values()].reduce((a, b) => a + b, 0) !== 0) throw new Error("expense-sharing-design settle-greedy: balances do not add up to zero");
  return states;
}

const BW = 54;
const COL = 100;
const BASE = 150;
/** Pixels per rupee: the largest balance, +900, is 108 px tall. */
const UNIT = 0.12;

function settleGreedy(): Walkthrough {
  const states = run();
  const captions = [
    "Four friends, every balance at zero. A positive balance will mean the group owes that member; a negative one, that the member owes.",
    "asha pays 1200.00 for all four. She gets +1200.00 and everyone, asha included, gets -300.00: asha ends at +900.00, the others at -300.00.",
    "ben pays 200.00 for chen and dev. He moves up by 200.00 and they move down by 100.00 each. The bars still add up to zero: money moved, none was made.",
    "Settle: the largest creditor is asha (+900.00), the largest debtors chen and dev tie at -400.00, and the earlier name goes first. chen pays the smaller amount, 400.00.",
    "asha is still owed 500.00; dev owes the most, 400.00, and pays it all. dev is now square.",
    "Only ben owes now, 100.00, exactly what asha is still owed. One payment settles both: three transfers for four people, within the n - 1 bound.",
  ];
  if (captions.length !== states.length) throw new Error(`expense-sharing-design settle-greedy: ${states.length} states, ${captions.length} captions`);
  const x = (m: string) => MEMBERS.indexOf(m) * COL;
  const frames: Frame[] = states.map((s, i) => {
    const items: Item[] = [];
    items.push({ k: "path", id: "zero", pts: [[-14, BASE], [3 * COL + BW + 14, BASE]], tone: "faint", dashed: true, width: 1 });
    items.push(label("zero-t", "0", -20, BASE, { anchor: "end", tone: "faint", size: 10.5, mono: true }));
    for (const m of MEMBERS) {
      const b = s.balance.get(m)!;
      const h = Math.max(2, Math.round((Math.abs(b) / 100) * UNIT));
      const up = b >= 0;
      const tone = b > 0 ? "strong" : b < 0 ? "accent" : "muted";
      items.push({ k: "cell", id: `bar-${m}`, x: x(m), y: up ? BASE - h : BASE, w: BW, h, text: "", tone });
      items.push(label(`v-${m}`, b === 0 ? "0.00" : signed(b), x(m) + BW / 2, up ? BASE - h - 10 : BASE + h + 12, { tone: b === 0 ? "faint" : "ink", size: 11.5, mono: true, weight: 600 }));
      items.push(label(`n-${m}`, m, x(m) + BW / 2, BASE + 84, { tone: "ink", size: 12.5, weight: 600 }));
    }
    if (s.transfer) {
      const { from, to } = s.transfer;
      // Under the names, sagging downwards whichever way it runs (a bow is to the right of travel).
      const bow = x(from) > x(to) ? -26 : 26;
      items.push(arrow("pay", { x: x(from) + BW / 2, y: BASE + 104 }, { x: x(to) + BW / 2, y: BASE + 104 }, { tone: "accent", bow, label: money(s.transfer.amount) }));
    }
    items.push(label("said", s.said || "the group starts square", -20, 8, { anchor: "start", tone: s.said ? "ink" : "faint", size: 11, mono: true, weight: s.transfer ? 600 : 400 }));
    return { caption: captions[i]!, items };
  });
  return finish({ title: "Settling up greedily: the largest debtor pays the largest creditor", input: "asha ben chen dev · EXPENSE asha 1200 EQUAL … · EXPENSE ben 200 EQUAL chen dev · SETTLE", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "settle-greedy": settleGreedy,
};
