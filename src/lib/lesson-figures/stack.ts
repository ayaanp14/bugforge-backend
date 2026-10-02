import { CELL, and, finish, note, row, rowLabel, slotMid, slotX, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Stack Data Structure: the lesson's figures (content/roadmap/stack.md places
 * each with "@figure <name>"). How push and pop work on an array, what
 * growing the array really costs, why brackets need last in, first out, the
 * call stack, postfix evaluation and the min stack — each generator runs the
 * real operations and records the stack after every one.
 */

/* ── A pile drawn from the floor up ────────────────────────────────── */

type Entry = { key: string; text: string; tone?: Tone };

/** Entries bottom first, standing on a floor at y = `floor`; each keeps its key as its id so a pop is that box leaving. */
function pile(entries: readonly Entry[], o: { x: number; floor: number; w?: number; h?: number; gap?: number; size?: number }): Item[] {
  const { x, floor, w = 52, h = 32, gap = 4 } = o;
  return entries.map((e, k) => box(e.key, x, floor - (k + 1) * (h + gap) + gap, e.text, { tone: e.tone ?? "plain", w, h, size: o.size }));
}

/** The walls and floor of a cup around a pile, with its name under it. */
function cup(id: string, x: number, floor: number, w: number, depth: number, name: string): Item[] {
  return [
    arrow(`${id}l`, { x: x - 6, y: floor - depth }, { x: x - 6, y: floor + 4 }, { tone: "line", head: false }),
    arrow(`${id}f`, { x: x - 6, y: floor + 4 }, { x: x + w + 6, y: floor + 4 }, { tone: "line", head: false }),
    arrow(`${id}r`, { x: x + w + 6, y: floor - depth }, { x: x + w + 6, y: floor + 4 }, { tone: "line", head: false }),
    label(`${id}n`, name, x + w / 2, floor + 18, { size: 11.5 }),
  ];
}

/* ── How it is stored ──────────────────────────────────────────────── */

/** An array-backed stack: push writes data[size], pop steps size back, peek reads data[size − 1]. */
function pushPop(): Walkthrough {
  const CAP = 5;
  const data: Array<number | null> = Array(CAP).fill(null);
  let size = 0;
  const ops: Array<["push", number] | ["pop"] | ["peek"]> = [["push", 4], ["push", 7], ["push", 2], ["pop"], ["push", 9], ["peek"]];
  const frames: Frame[] = [];

  const draw = (o: { hot?: number; text: string; peek?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("dl", "data", -10, 0)];
    items.push(
      ...row("d", data.map((v) => (v === null ? "" : String(v))), {
        index: true,
        tone: (i) => (data[i] === null ? "ghost" : i >= size ? "muted" : i === o.hot ? (o.peek ? "strong" : "accent") : "plain"),
      }),
    );
    if (size > 0) items.push({ k: "ptr", id: "top", x: slotMid(size - 1), y: -6, label: "top", tone: "accent", up: false });
    if (size > 0) items.push({ k: "span", id: "used", x1: slotX(0) + 2, x2: slotX(size) - 8, y: CELL + 30, label: `size = ${size}`, tone: "accent", down: true });
    items.push(note("code", o.text, 0, CELL + 70, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: "The usual stack is an array plus a count, size. The bottom is index 0 and the top is the last used slot, data[size − 1]; the slots past size are free.",
    items: draw({ text: "empty stack: size = 0" }),
  });
  for (const op of ops) {
    if (op[0] === "push") {
      const x = op[1];
      const reused = data[size] !== null;
      data[size] = x;
      size++;
      frames.push({
        caption: reused
          ? `push ${x} writes into data[${size - 1}], over the stale value the pop left there. Still one write and one increment, whatever the size: O(1).`
          : size === 1
            ? `push ${x} writes data[0] = ${x} and adds one to size. No other slot is touched.`
            : `push ${x} writes data[${size - 1}] = ${x}, one past the old top, and size becomes ${size}. Nothing below moves, which is why push is O(1).`,
        items: draw({ hot: size - 1, text: `push ${x}: data[${size - 1}] = ${x}; size = ${size}` }),
      });
    } else if (op[0] === "pop") {
      size--;
      const x = data[size]!;
      frames.push({
        caption: `pop subtracts one from size and returns data[${size}] = ${x}. The ${x} is still in memory, but it is past size, so it no longer counts; the next push simply writes over it.`,
        items: draw({ text: `pop: size = ${size}; return data[${size}] = ${x}` }),
      });
    } else {
      const x = data[size - 1]!;
      frames.push({
        caption: `peek reads data[size − 1] = ${x} and changes nothing. Push, pop and peek each touch one slot at the end, the one place an array can change cheaply.`,
        items: draw({ hot: size - 1, peek: true, text: `peek: data[${size - 1}] = ${x}` }),
      });
    }
  }
  return finish({ title: "Push, pop and peek on an array-backed stack", input: "push 4, push 7, push 2, pop, push 9, peek", frames });
}

/** The cost of each of 16 pushes when the array doubles as it fills: rare expensive pushes, a cheap average. */
function growth(): Walkthrough {
  const N = 16;
  let cap = 1;
  let size = 0;
  const cost: number[] = [];
  const grewTo: Array<number | null> = [];
  for (let i = 0; i < N; i++) {
    let c = 1;
    let g: number | null = null;
    if (size === cap) {
      c += size; // copy every element into an array twice the size
      cap *= 2;
      g = cap;
    }
    size++;
    cost.push(c);
    grewTo.push(g);
  }
  const total = cost.reduce((a, b) => a + b, 0);
  const copies = total - N;
  const U = 19;
  const BW = 22;
  const BG = 6;
  const base = 0;
  const right = N * (BW + BG) - BG;
  const items: Item[] = [];
  cost.forEach((c, i) => {
    const x = i * (BW + BG);
    // Each push is one write (ink) plus, when the array was full, a copy of everything in it (teal).
    items.push({ k: "cell", id: `w${i}`, x, y: base - U, w: BW, h: U, text: "", tone: "plain" });
    if (c > 1) items.push({ k: "cell", id: `c${i}`, x, y: base - c * U, w: BW, h: (c - 1) * U, text: String(c - 1), tone: "accent", size: 11 });
    items.push({ k: "text", id: `n${i}`, x: x + BW / 2, y: base + 11, text: String(i + 1), tone: "faint", anchor: "middle", size: 10 });
  });
  items.push(label("xl", "push number", right, base + 28, { anchor: "end", size: 11 }));
  // Legend, top right, clear of the tallest bar.
  const LX = right - 150;
  const LY = base - 9 * U;
  items.push({ k: "cell", id: "kw", x: LX, y: LY, w: 14, h: 14, text: "", tone: "plain" });
  items.push(label("kwl", "the push's own write", LX + 20, LY + 7, { anchor: "start", size: 11 }));
  items.push({ k: "cell", id: "kc", x: LX, y: LY + 22, w: 14, h: 14, text: "", tone: "accent" });
  items.push(label("kcl", "copying into a 2× array", LX + 20, LY + 29, { anchor: "start", size: 11 }));
  items.push(note("tot", `${N} pushes: ${N} writes + ${copies} copies = ${total} < 2 × ${N}`, 0, base + 50, { size: 12, weight: 600 }));
  return finish({
    title: "What 16 pushes cost when the array doubles as it fills",
    input: "",
    frames: [
      {
        caption: `Most pushes write one slot. A push that finds the array full first copies everything into one twice the size — ${and(grewTo.flatMap((g, i) => (g ? [String(cost[i] - 1)] : [])))} elements, at pushes ${and(grewTo.flatMap((g, i) => (g ? [String(i + 1)] : [])))}. The copies double each time but get rarer just as fast, so they add up to less than n: ${total} writes for ${N} pushes, O(1) amortised.`,
        items,
      },
    ],
  });
}

/* ── Why last in, first out ────────────────────────────────────────── */

/** Matched brackets nest like arcs that never cross; a crossing pair is exactly what the stack rejects. */
function nesting(): Walkthrough {
  const strings = ["{[()]}", "([)]"];
  const partner: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const Y2 = 118;
  const items: Item[] = [];
  const verdicts: string[] = [];
  strings.forEach((s, r) => {
    const y = r * Y2;
    const chars = [...s];
    // The pairs a reader would draw: each closer with the nearest open bracket of its own kind.
    const open: number[] = [];
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < chars.length; i++) {
      const need = partner[chars[i]];
      if (need === undefined) {
        open.push(i);
        continue;
      }
      for (let k = open.length - 1; k >= 0; k--) {
        if (chars[open[k]] === need) {
          pairs.push([open[k], i]);
          open.splice(k, 1);
          break;
        }
      }
    }
    // The stack's verdict: valid only if every closer matched the top.
    const st: string[] = [];
    let ok = true;
    for (const c of chars) {
      const need = partner[c];
      if (need === undefined) st.push(c);
      else if (st.pop() !== need) ok = false;
    }
    ok = ok && st.length === 0;
    const crosses = pairs.some(([a, b]) => pairs.some(([c, d]) => a < c && c < b && b < d));
    verdicts.push(ok ? "valid" : "invalid");
    pairs.forEach(([a, b], k) => items.push({ k: "edge", id: `r${r}arc${k}`, x1: slotMid(a), y1: y - 3, x2: slotMid(b), y2: y - 3, tone: ok ? "accent" : "error", bow: -(14 + 10 * (b - a)) }));
    items.push(rowLabel(`l${r}`, "s", -10, y));
    items.push(...row(`r${r}c`, chars, { y, tone: () => (ok ? "plain" : "error") }));
    items.push(note(`v${r}`, ok ? "pairs nest → valid" : crosses ? "pairs cross → invalid" : "invalid", slotX(chars.length) + 8, y + CELL / 2, { size: 12.5, tone: ok ? "accent" : "error", weight: 600 }));
  });
  return finish({
    title: "Why brackets need last in, first out",
    input: "",
    frames: [
      {
        caption: `Draw an arc between each pair of partners. In "${strings[0]}" the arcs nest, so every closer meets the most recent bracket still open: exactly the top of a stack. In "${strings[1]}" the arcs cross — ')' arrives while '[' is the most recent open bracket — and that crossing is what the stack rejects.`,
        items,
      },
    ],
  });
}

/** The call stack for fact(3): each call pushes a frame, each return pops one and hands its value to the frame below. */
function callStack(): Walkthrough {
  type Ev = { kind: "call" | "return"; n: number; value?: number };
  const events: Ev[] = [];
  const fact = (n: number): number => {
    events.push({ kind: "call", n });
    const v = n <= 1 ? 1 : n * fact(n - 1);
    events.push({ kind: "return", n, value: v });
    return v;
  };
  const N = 3;
  const answer = fact(N);
  const W = 170;
  const FLOOR = 4 * 36 + 40;
  const frames: Frame[] = [];
  // What each live frame shows: its call, and once its callee returned, the sum it can now finish.
  const shown = new Map<number, string>();
  const live: number[] = [];

  let returned = false;
  const draw = (o: { hot?: number; ret?: string }): Item[] => {
    const entries: Entry[] = [{ key: "main", text: returned ? `main: result = ${answer}` : `main: fact(${N})`, tone: returned ? "strong" : live.length ? "plain" : "accent" }];
    live.forEach((n) => entries.push({ key: `f${n}`, text: shown.get(n)!, tone: n === o.hot ? "accent" : "plain" }));
    const items: Item[] = [...cup("cup", 0, FLOOR, W, 4 * 36 + 8, "call stack"), ...pile(entries, { x: 0, floor: FLOOR, w: W, h: 32, size: 12.5 })];
    if (o.ret) items.push(note("ret", o.ret, W + 18, FLOOR - 4 * 36 + 16, { size: 12, tone: "accent", weight: 600 }));
    items.push(label("code", "fact(n) = 1 if n ≤ 1, else n × fact(n − 1)", 0, -22, { anchor: "start", size: 11.5, mono: true, tone: "soft" }));
    return items;
  };

  frames.push({
    caption: `main is running and calls fact(${N}). A call pushes a stack frame holding the function's arguments, its local variables and where to return to.`,
    items: draw({}),
  });
  for (const ev of events) {
    if (ev.kind === "call") {
      live.push(ev.n);
      shown.set(ev.n, `fact(${ev.n})   n = ${ev.n}`);
      frames.push({
        caption:
          ev.n === N
            ? `fact(${N}) gets its own frame on top of main's. main waits underneath, its work unfinished, until this call returns.`
            : ev.n <= 1
              ? `fact(${ev.n}) is pushed on top. It is the base case, so it can return without calling anything: the top frame is the first to finish.`
              : `fact(${ev.n + 1}) cannot finish until it knows fact(${ev.n}), so it calls it: one more frame on top, with its own n = ${ev.n}.`,
        items: draw({ hot: ev.n }),
      });
    } else {
      live.pop();
      const below = live[live.length - 1];
      if (below === undefined) returned = true;
      if (below !== undefined) shown.set(below, `fact(${below}) = ${below} × ${ev.value}`);
      frames.push({
        caption:
          below !== undefined
            ? `fact(${ev.n}) returns ${ev.value} and its frame is popped. fact(${below}) is on top again, exactly where it left off, and can now finish: ${below} × ${ev.value} = ${below * ev.value!}.`
            : `fact(${ev.n}) returns ${ev.value} to main, the last frame popped before main itself. The newest call always finished first: last in, first out, which is why too deep a recursion overflows this stack.`,
        items: draw({ hot: below, ret: `returns ${ev.value}` }),
      });
    }
  }
  return finish({ title: "The call stack while fact(3) runs", input: `fact(${N})`, frames });
}

/* ── Postfix and the min stack ─────────────────────────────────────── */

/** 4 13 5 / + on a stack: numbers are pushed, an operator pops b then a and pushes a op b. */
function rpn(): Walkthrough {
  const tokens = ["4", "13", "5", "/", "+"];
  const stack: Entry[] = [];
  let serial = 0;
  const frames: Frame[] = [];
  const FLOOR = 196;
  const PX = slotX(tokens.length) + 40;

  const draw = (i: number, o: { text: string; operands?: boolean; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("tl", "tokens", -10, 0)];
    items.push(...row("t", tokens, { tone: (j) => (o.done ? "muted" : j === i ? "accent" : j < i ? "muted" : "plain") }));
    if (i >= 0 && !o.done) items.push({ k: "ptr", id: "i", x: slotMid(i), y: CELL + 6, label: "next", tone: "accent", up: true });
    const shown = stack.map((e, k) => ({ ...e, tone: o.done ? ("strong" as Tone) : o.operands && k >= stack.length - 2 ? ("accent" as Tone) : e.tone }));
    items.push(...cup("cup", PX, FLOOR, 52, 3 * 36 + 8, "stack"), ...pile(shown, { x: PX, floor: FLOOR }));
    if (o.operands) {
      const yTop = FLOOR - stack.length * 36 + 16;
      items.push(label("bl", "b (top)", PX + 64, yTop, { anchor: "start", size: 11.5, tone: "accent", weight: 600 }));
      items.push(label("al", "a", PX + 64, yTop + 36, { anchor: "start", size: 11.5, tone: "accent", weight: 600 }));
    }
    items.push(note("code", o.text, 0, CELL + 62, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: "Postfix puts each operator after its operands, so the order of the tokens is the order of the work and no brackets are needed. Read left to right with a stack of values.",
    items: draw(-1, { text: "4 + 13 / 5, written as 4 13 5 / +" }),
  });
  tokens.forEach((tok, i) => {
    if (!"+-*/".includes(tok)) {
      stack.push({ key: `s${serial++}`, text: tok });
      frames.push({
        caption: i === 0 ? `${tok} is a number, so it is pushed. Numbers wait on the stack until an operator needs them.` : `${tok} is a number: push it. The top of the stack is always the most recent value not yet used.`,
        items: draw(i, { text: `push ${tok}` }),
      });
      return;
    }
    const b = Number(stack[stack.length - 1].text);
    const a = Number(stack[stack.length - 2].text);
    frames.push({
      caption: `'${tok}' applies to the two most recent unused values, the top two. The first pop is the right operand b = ${b}, the second the left operand a = ${a} — backwards for '-' and '/', which is the classic bug.`,
      items: draw(i, { text: `pop b = ${b}, pop a = ${a}`, operands: true }),
    });
    const v = tok === "+" ? a + b : tok === "-" ? a - b : tok === "*" ? a * b : Math.trunc(a / b);
    stack.pop();
    stack.pop();
    stack.push({ key: `s${serial++}`, text: String(v), tone: "accent" });
    const last = i === tokens.length - 1;
    frames.push({
      caption: last
        ? `${a} ${tok} ${b} = ${v} is pushed, the tokens are used up, and the one value left is the answer, ${v}. Each token is pushed or popped a constant number of times: O(n).`
        : `${a} ${tok} ${b} = ${v}, truncated towards zero, is pushed back: the sub-expression "${a} ${b} ${tok}" has collapsed into one value, and the rest of the expression treats it like any number.`,
      items: draw(i, { text: `push ${a} ${tok} ${b} = ${v}`, done: last }),
    });
  });
  return finish({ title: "Evaluating a postfix expression with a stack", input: "4 13 5 / +", frames });
}

/** A min stack: each entry stores its value and the minimum of itself and everything below it. */
function minStack(): Walkthrough {
  const pushes = [5, 3, 7, 3, 1];
  const POPS = 4;
  const entries: Array<{ key: string; v: number; m: number }> = [];
  const frames: Frame[] = [];
  const FLOOR = 5 * 36 + 10;
  const VW = 46;

  const draw = (o: { hot?: string; text: string; popped?: number }): Item[] => {
    const items: Item[] = [];
    items.push(...cup("cup", 0, FLOOR, VW * 2 + 6, 5 * 36 + 8, "value · min so far"));
    entries.forEach((e, k) => {
      const y = FLOOR - (k + 1) * 36 + 4;
      const top = k === entries.length - 1;
      items.push(box(`${e.key}v`, 0, y, e.v, { tone: e.key === o.hot ? "accent" : "plain", w: VW, h: 32 }));
      items.push(box(`${e.key}m`, VW + 6, y, e.m, { tone: top ? "strong" : "muted", w: VW, h: 32 }));
    });
    const min = entries.length ? entries[entries.length - 1].m : null;
    items.push(note("gm", min === null ? "getMin(): empty" : `getMin() = ${min}`, VW * 2 + 30, FLOOR - 5 * 36 + 20, { size: 13, tone: "accent", weight: 600 }));
    items.push(note("code", o.text, VW * 2 + 30, FLOOR - 5 * 36 + 46, { size: 12, tone: "soft" }));
    return items;
  };

  let serial = 0;
  for (const x of pushes) {
    const below = entries.length ? entries[entries.length - 1].m : null;
    const m = below === null ? x : Math.min(x, below);
    const key = `e${serial++}`;
    entries.push({ key, v: x, m });
    frames.push({
      caption:
        below === null
          ? `push ${x} on an empty stack: the minimum of one value is the value, so the entry is (${x}, ${m}).`
          : m === x && x < below
            ? `push ${x}: smaller than the ${below} recorded below, so this entry's minimum is ${x}. getMin just reads the top entry: O(1), no scan.`
            : `push ${x}: the minimum of ${x} and the ${below} recorded below is ${m}, so the entry is (${x}, ${m}).${x === m ? " A repeated minimum gets its own entry, so popping one copy cannot lose the other." : ""}`,
      items: draw({ hot: key, text: `push ${x}: min(${x}, ${below ?? x}) = ${m}` }),
    });
  }
  for (let p = 0; p < POPS; p++) {
    const gone = entries.pop()!;
    const now = entries[entries.length - 1].m;
    frames.push({
      caption:
        p === 0
          ? `pop removes (${gone.v}, ${gone.m}). Nothing is recomputed: the entry now on top recorded the minimum of everything still on the stack when it was pushed, and nothing below it has changed since. getMin is ${now}.`
          : `pop removes ${gone.v}; getMin is ${now}, read from the new top.${p === POPS - 1 ? ` Every operation touched only the top entry: O(1) each, at the price of storing a second number per entry.` : ""}`,
      items: draw({ text: `pop ${gone.v} → getMin() = ${now}`, popped: gone.v }),
    });
  }
  return finish({ title: "A stack that knows its minimum", input: `push ${pushes.join(", ")}; pop ${POPS} times`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "push-pop": pushPop,
  growth,
  nesting,
  "call-stack": callStack,
  rpn,
  "min-stack": minStack,
};
