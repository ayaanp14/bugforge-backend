import { finish, type Frame, type Item, type Tone } from "../../walkthroughs/core.js";
import type { Walkthrough } from "../../walkthroughs/core.js";
import { box, label } from "../../lesson-figures/kit.js";

/**
 * Vending machine (scripts/study-plans/lld/04-vending-machine):
 *
 *  - state-run: the three states and their transitions, with one slot of
 *    chips (price 15, one in stock) run through six events by the same
 *    state machine the first exercise's reference solution implements — the
 *    current state lit, the transition taken drawn in colour, and the
 *    printed lines checked against what that program answers;
 *  - change-making: greedy change for 19 from 10, 5, 2, 1, coin by coin,
 *    then the limited box where greedy is stuck (6 from one 5 and three 2s)
 *    and the search that pays it — both computed here.
 */

/* ── The state machine ────────────────────────────────────────────── */

type StateName = "Idle" | "HasMoney" | "OutOfStock";
type Ev = { op: "INSERT"; coin: number } | { op: "SELECT"; code: string };

const PRICE = 15;
const EVENTS: Ev[] = [
  { op: "SELECT", code: "A1" },
  { op: "INSERT", coin: 10 },
  { op: "SELECT", code: "A1" },
  { op: "INSERT", coin: 10 },
  { op: "SELECT", code: "A1" },
  { op: "INSERT", coin: 5 },
];
const PRINTED = ["insert coins first", "balance 10", "need 5 more", "balance 20", "dispensed chips, change 5", "sold out, returned 5"];

function greedy(amount: number): number[] {
  const out: number[] = [];
  for (const c of [10, 5, 2, 1]) while (amount >= c) (out.push(c), (amount -= c));
  return out;
}

class Machine {
  state: StateName = "Idle";
  balance = 0;
  stock = 1;
  /** The reply, and the transition taken (null when the state is kept). */
  handle(e: Ev): { line: string; from: StateName; to: StateName } {
    const from = this.state;
    let line: string;
    if (e.op === "INSERT") {
      if (from === "OutOfStock") line = `sold out, returned ${e.coin}`;
      else {
        this.balance += e.coin;
        this.state = "HasMoney";
        line = `balance ${this.balance}`;
      }
    } else if (from === "Idle") line = "insert coins first";
    else if (from === "OutOfStock") line = "sold out";
    else if (this.balance < PRICE) line = `need ${PRICE - this.balance} more`;
    else {
      const change = this.balance - PRICE;
      this.stock--;
      this.balance = 0;
      this.state = this.stock > 0 ? "Idle" : "OutOfStock";
      line = `dispensed chips, ${change ? `change ${greedy(change).join("+")}` : "no change"}`;
    }
    return { line, from, to: this.state };
  }
}

const SW = 112;
const SH = 42;
const POS: Record<StateName, number> = { Idle: 0, HasMoney: 210, OutOfStock: 420 };
const SY = 70;

function stateRun(): Walkthrough {
  const m = new Machine();
  type Edge = { id: string; from: StateName; to: StateName; label: string };
  const EDGES: Edge[] = [
    { id: "coin", from: "Idle", to: "HasMoney", label: "coin" },
    { id: "back", from: "HasMoney", to: "Idle", label: "sale, cancel" },
    { id: "empty", from: "HasMoney", to: "OutOfStock", label: "last sold" },
    { id: "refill", from: "OutOfStock", to: "Idle", label: "refill" },
  ];
  const edgeItem = (e: Edge, lit: boolean): Item => {
    const tone = lit ? "accent" : "line";
    if (e.id === "coin") return { k: "edge", id: e.id, x1: POS.Idle + SW, y1: SY + 12, x2: POS.HasMoney, y2: SY + 12, tone, arrow: true, label: e.label };
    if (e.id === "back") return { k: "edge", id: e.id, x1: POS.HasMoney, y1: SY + SH - 12, x2: POS.Idle + SW, y2: SY + SH - 12, tone, arrow: true };
    if (e.id === "empty") return { k: "edge", id: e.id, x1: POS.HasMoney + SW, y1: SY + SH / 2, x2: POS.OutOfStock, y2: SY + SH / 2, tone, arrow: true, label: e.label };
    // refill: from OutOfStock's top back over HasMoney to Idle's top.
    return { k: "edge", id: e.id, x1: POS.OutOfStock + SW / 2, y1: SY, x2: POS.Idle + SW / 2, y2: SY, tone, arrow: true, bow: 70, label: e.label };
  };

  const draw = (taken: { from: StateName; to: StateName } | null, cmd: string | null, line: string | null): Item[] => {
    const items: Item[] = [];
    for (const e of EDGES) items.push(edgeItem(e, taken !== null && taken.from === e.from && taken.to === e.to && taken.from !== taken.to));
    items.push(label("back-t", "sale, cancel", (POS.Idle + SW + POS.HasMoney) / 2, SY + SH + 4, { size: 11 }));
    for (const s of Object.keys(POS) as StateName[]) {
      const tone: Tone = m.state === s ? "strong" : "plain";
      items.push(box(`st${s}`, POS[s], SY, s, { w: SW, h: SH, tone, size: 13 }));
    }
    const y = SY + SH + 40;
    items.push({ k: "text", id: "slot", x: 0, y, text: `slot A1: chips, price ${PRICE}, stock ${m.stock}   balance ${m.balance}`, tone: "soft", anchor: "start", size: 12, mono: true });
    items.push({ k: "text", id: "cmd", x: 0, y: y + 24, text: cmd ?? "the machine starts in Idle", tone: "ink", anchor: "start", size: 12, mono: true });
    if (line) items.push({ k: "text", id: "out", x: 0, y: y + 46, text: `→ ${line}`, tone: "accent", anchor: "start", size: 12, mono: true, weight: 600 });
    return items;
  };

  const frames: Frame[] = [{ caption: "Three states, each a class answering every event. The arrows are the only ways between them, and each is taken by a state's own code calling machine.move.", items: draw(null, null, null) }];
  const printed: string[] = [];
  for (const e of EVENTS) {
    const r = m.handle(e);
    printed.push(r.line);
    const cmd = e.op === "INSERT" ? `INSERT ${e.coin}` : `SELECT ${e.code}`;
    let caption: string;
    if (r.from !== r.to) {
      caption =
        r.to === "HasMoney"
          ? `A coin is the one event that leaves Idle: Idle.insert adds ${e.op === "INSERT" ? e.coin : 0} to the balance and moves the machine to HasMoney.`
          : `HasMoney.select finds the price of ${PRICE} covered, drops the chips with change ${r.line.split("change ")[1]} and, as that was the last one, moves to OutOfStock rather than Idle.`;
    } else if (r.from === "Idle") caption = "Selecting in Idle starts nothing: Idle.select answers that coins come first, and the machine stays where it is.";
    else if (r.from === "OutOfStock") caption = "OutOfStock cannot finish a sale, so it never starts one: OutOfStock.insert hands the coin straight back.";
    else if (e.op === "INSERT") caption = `In HasMoney a coin only raises the balance, to ${m.balance}. The same INSERT event, a different class answering it.`;
    else caption = `The chips cost ${PRICE} and the balance is ${m.balance}: HasMoney refuses the selection, keeps the money and stays in HasMoney.`;
    frames.push({ caption, items: draw(r, cmd, r.line) });
  }
  if (printed.join("\n") !== PRINTED.join("\n")) throw new Error(`state-run: the model printed ${JSON.stringify(printed)}`);
  return finish({ title: "One slot of chips through the vending machine's states", input: "A1 chips 15, stock 1: SELECT, INSERT 10, SELECT, INSERT 10, SELECT, INSERT 5", frames });
}

/* ── Change ───────────────────────────────────────────────────────── */

const DENOMS = [10, 5, 2, 1];

/** Greedy from a limited box: the largest coin available that fits, until stuck. */
function greedyFrom(amount: number, box: number[]): { paid: number[]; left: number } {
  const have = [...box];
  const paid: number[] = [];
  for (let i = 0; i < DENOMS.length; i++) {
    while (amount >= DENOMS[i]! && have[i]! > 0) {
      paid.push(DENOMS[i]!);
      amount -= DENOMS[i]!;
      have[i]!--;
    }
  }
  return { paid, left: amount };
}

/** The fewest coins the box can pay with (the checkpoint's search), most large coins first among ties. */
function fewestFrom(amount: number, box: number[]): number[] | null {
  let best: number[] | null = null;
  for (let a = Math.min(box[0]!, Math.floor(amount / 10)); a >= 0; a--)
    for (let b = Math.min(box[1]!, Math.floor((amount - 10 * a) / 5)); b >= 0; b--)
      for (let c = Math.min(box[2]!, Math.floor((amount - 10 * a - 5 * b) / 2)); c >= 0; c--) {
        const d = amount - 10 * a - 5 * b - 2 * c;
        if (d > box[3]!) continue;
        const coins = [...Array(a).fill(10), ...Array(b).fill(5), ...Array(c).fill(2), ...Array(d).fill(1)];
        if (!best || coins.length < best.length) best = coins;
      }
  return best;
}

function changeMaking(): Walkthrough {
  const R = 18;
  const DX = 56;
  const denomX = (i: number) => 30 + i * DX;
  const PAY_Y = 112;

  const draw = (o: { pick: number | null; paid: number[]; left: number; box?: number[]; tone?: "accent" | "error"; note: string }): Item[] => {
    const items: Item[] = [label("d-t", o.box ? "coins in the box" : "coins: unlimited", 0, -6, { anchor: "start", weight: 600 })];
    DENOMS.forEach((d, i) => {
      const empty = o.box && o.box[i] === 0;
      const tone: Tone = i === o.pick ? (o.tone === "error" ? "error" : "accent") : empty ? "muted" : "plain";
      items.push({ k: "node", id: `d${d}`, x: denomX(i), y: 30, r: R, text: String(d), tone, size: 13 });
      items.push(label(`dc${d}`, o.box ? `×${o.box[i]}` : "×∞", denomX(i), 30 + R + 13, { size: 10.5, mono: true }));
    });
    items.push(label("p-t", "paid", 0, PAY_Y - 30, { anchor: "start", weight: 600 }));
    o.paid.forEach((c, i) => items.push({ k: "node", id: `p${i}`, x: 30 + i * 44, y: PAY_Y, r: 16, text: String(c), tone: "strong", size: 12 }));
    items.push({ k: "text", id: "left", x: 0, y: PAY_Y + 40, text: o.note, tone: o.tone === "error" ? "error" : "ink", anchor: "start", size: 12.5, mono: true, weight: 600 });
    return items;
  };

  const AMOUNT = 19;
  const coins = greedy(AMOUNT);
  if (coins.join("+") !== "10+5+2+2") throw new Error(`change-making: greedy gave ${coins.join("+")}`);
  const frames: Frame[] = [{ caption: `The balance is ${AMOUNT} more than the price. Greedy change looks for the largest coin that still fits the amount left, and repeats until nothing is left.`, items: draw({ pick: null, paid: [], left: AMOUNT, note: `left to pay: ${AMOUNT}` }) }];
  let left = AMOUNT;
  coins.forEach((c, k) => {
    left -= c;
    const i = DENOMS.indexOf(c);
    const skipped = DENOMS.slice(0, i).filter((d) => d > left + c);
    const caption =
      k === coins.length - 1
        ? `A last ${c} pays it off: ${coins.join(" + ")} = ${AMOUNT} in ${coins.length} coins. For 10, 5, 2, 1 no shorter answer exists — this coin set is canonical.`
        : skipped.length
          ? `${left + c} is left, so ${skipped.join(" and ")} no longer fit${skipped.length === 1 ? "s" : ""}: the largest coin that does is ${c}, leaving ${left}.`
          : `${c} fits ${left + c}, and it is the largest coin, so it goes first, leaving ${left}.`;
    frames.push({ caption, items: draw({ pick: i, paid: coins.slice(0, k + 1), left, note: `left to pay: ${left}` }) });
  });

  // A real box runs out of coins: greedy can be stuck where an answer exists.
  const BOX = [0, 1, 3, 0];
  const DUE = 6;
  const g = greedyFrom(DUE, BOX);
  const best = fewestFrom(DUE, BOX);
  if (g.left === 0 || !best || best.join("+") !== "2+2+2") throw new Error(`change-making: limited box gave greedy ${JSON.stringify(g)}, search ${JSON.stringify(best)}`);
  frames.push({
    caption: `Now the box holds one 5, three 2s and no 1s, and ${DUE} is due. Greedy takes the 5 and is stuck with ${g.left} to pay: there is no 1 left in the box.`,
    items: draw({ pick: DENOMS.indexOf(g.paid[g.paid.length - 1]!), paid: g.paid, left: g.left, box: BOX, tone: "error", note: `stuck: ${g.left} left, no coin fits` }),
  });
  frames.push({
    caption: `Trying every count of each coin finds ${best.join(" + ")}: three coins the box really holds. With limited coins, search the combinations — or refuse the sale before dispensing.`,
    items: draw({ pick: DENOMS.indexOf(2), paid: best, left: 0, box: BOX, note: `paid ${best.join("+")}, left 0` }),
  });
  return finish({ title: "Making change: greedy, and where a real coin box breaks it", input: "change 19 from 10, 5, 2, 1; then 6 from a box of one 5 and three 2s", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "state-run": stateRun,
  "change-making": changeMaking,
};
