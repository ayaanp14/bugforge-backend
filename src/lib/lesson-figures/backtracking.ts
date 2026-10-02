import { finish, note, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, grid, gridCell } from "./kit.js";

/**
 * Backtracking — the lesson's figures (content/roadmap/backtracking.md places
 * each with "@figure <name>"; the subset-sum search is the hub's
 * walkthrough). Every figure runs the search it shows — the permutations
 * template, the N-Queens solver, the start-index subsets loop, the
 * duplicate rule of Combination Sum II — and draws the events it recorded,
 * so a node is lit only because the code visited it.
 */

const fmt = (xs: readonly number[]) => `[${xs.join(", ")}]`;

/* ── Brute force against pruning ─────────────────────────────────── */

/** The lesson's N-Queens solver: how many solutions, and how many queens it puts down in the whole search. */
function queenCount(n: number): { placed: number; solutions: number } {
  let placed = 0;
  let solutions = 0;
  const cols = new Array<boolean>(n).fill(false);
  const diag = new Array<boolean>(2 * n - 1).fill(false);
  const anti = new Array<boolean>(2 * n - 1).fill(false);
  const solve = (r: number) => {
    if (r === n) {
      solutions++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const d = r - c + n - 1;
      const a = r + c;
      if (cols[c] || diag[d] || anti[a]) continue;
      cols[c] = diag[d] = anti[a] = true;
      placed++;
      solve(r + 1);
      cols[c] = diag[d] = anti[a] = false;
    }
  };
  solve(0);
  return { placed, solutions };
}

/** N-Queens, n = 8: how many candidates each way of generating them makes, on a log scale. */
function bruteVsPrune(): Walkthrough {
  const n = 8;
  const choose = (a: number, b: number) => {
    let r = 1;
    for (let k = 1; k <= b; k++) r = (r * (a - b + k)) / k;
    return Math.round(r);
  };
  const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
  // The real search, counting every queen it puts down.
  const { placed, solutions } = queenCount(n);
  const rows: Array<{ what: string; v: number; tone: Tone }> = [
    { what: `any ${n} of the ${n * n} squares`, v: choose(n * n, n), tone: "plain" },
    { what: "one queen in each row", v: n ** n, tone: "plain" },
    { what: "one in each row and each column", v: fact(n), tone: "plain" },
    { what: "backtracking: queens ever placed", v: placed, tone: "accent" },
    { what: "solutions", v: solutions, tone: "strong" },
  ];
  const L = 34; // px per power of ten
  const ROW = 44;
  const items: Item[] = [];
  rows.forEach((r, k) => {
    const y = k * ROW;
    const w = Math.max(4, Math.log10(r.v) * L);
    items.push({ k: "text", id: `l${k}`, x: 0, y, text: r.what, tone: r.tone === "plain" ? "soft" : "accent", anchor: "start", size: 11.5, weight: 600, mono: false });
    items.push(box(`b${k}`, 0, y + 8, "", { tone: r.tone, w, h: 16 }));
    items.push({ k: "text", id: `v${k}`, x: w + 8, y: y + 16, text: r.v.toLocaleString("en-GB"), tone: "ink", anchor: "start", size: 12 });
  });
  const AY = rows.length * ROW + 4;
  items.push({ k: "edge", id: "axis", x1: 0, y1: AY, x2: 10 * L, y2: AY, tone: "line" });
  for (let p = 0; p <= 10; p += 3) {
    items.push({ k: "edge", id: `t${p}`, x1: p * L, y1: AY, x2: p * L, y2: AY + 4, tone: "line" });
    items.push({ k: "text", id: `tn${p}`, x: p * L, y: AY + 15, text: p === 0 ? "1" : `10${String(p).replace(/[0-9]/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)])}`, tone: "faint", anchor: "middle", size: 10.5 });
  }
  items.push({ k: "text", id: "scale", x: 10 * L, y: AY + 32, text: "log scale", tone: "faint", anchor: "end", size: 10.5, mono: false });
  return finish({
    title: `Eight queens: what brute force builds against what backtracking builds`,
    input: "",
    frames: [
      {
        caption: `Each bar is a count on a log scale: every tick is a thousand times the one before. Even the smartest brute force builds ${fact(n).toLocaleString("en-GB")} full boards; backtracking places ${placed.toLocaleString("en-GB")} queens in its whole search to find all ${solutions} solutions, because a board that fails at its second queen is never finished.`,
        items,
      },
    ],
  });
}

/* ── The template on permutations ────────────────────────────────── */

/** Permutations of [1, 2, 3]: the state-space tree, the path and the used array, choose / explore / unchoose. */
function templateTree(): Walkthrough {
  const nums = [1, 2, 3];
  const n = nums.length;
  const BW = 46;
  const BH = 24;
  const DY = 56;
  type Ev = { kind: "enter" | "record" | "leave"; path: number[] };
  const events: Ev[] = [];
  const kids = new Map<string, string[]>();
  const key = (p: readonly number[]) => `r${p.join("")}`;
  // The lesson's permute, recording what it does.
  const used = new Array<boolean>(n).fill(false);
  const path: number[] = [];
  const permute = () => {
    events.push({ kind: "enter", path: [...path] });
    kids.set(key(path), []);
    if (path.length === n) {
      events.push({ kind: "record", path: [...path] });
      return;
    }
    for (let j = 0; j < n; j++) {
      if (used[j]) continue;
      used[j] = true;
      path.push(nums[j]);
      kids.get(key(path.slice(0, -1)))!.push(key(path));
      permute();
      events.push({ kind: "leave", path: [...path] });
      path.pop();
      used[j] = false;
    }
  };
  permute();
  const at = treeLayout<string>("r", (id) => kids.get(id) ?? [], { dx: BW + 8, dy: DY });
  const pathOf = (id: string) => id.slice(1).split("").map(Number);
  const UY = n * DY + 42;

  const draw = (cur: number[], visited: Set<string>, recorded: Set<string>): Item[] => {
    const items: Item[] = [];
    const onPath = new Set<string>();
    for (let k = 0; k <= cur.length; k++) onPath.add(key(cur.slice(0, k)));
    for (const [id, p] of at)
      for (const c of kids.get(id) ?? []) {
        const q = at.get(c)!;
        const tone: LineTone = onPath.has(c) ? "accent" : visited.has(c) ? "faint" : "line";
        items.push({ k: "edge", id: `e${c}`, x1: p.x, y1: p.y + BH / 2, x2: q.x, y2: q.y - BH / 2, tone, label: String(pathOf(c).slice(-1)[0]) });
      }
    for (const [id, p] of at) {
      const pp = pathOf(id);
      const tone: Tone = id === key(cur) ? (recorded.has(id) ? "strong" : "accent") : recorded.has(id) ? "strong" : onPath.has(id) ? "accent" : visited.has(id) ? "muted" : "plain";
      items.push(box(`n${id}`, p.x - BW / 2, p.y - BH / 2, pp.length ? pp.join(",") : "[ ]", { tone, w: BW, h: BH, size: 11.5 }));
    }
    items.push(note("path", `path = ${fmt(cur)}`, -40, UY, { size: 12.5, weight: 600 }));
    items.push({ k: "text", id: "ul", x: 120, y: UY, text: "used", tone: "soft", anchor: "end", size: 12, mono: false });
    nums.forEach((v, j) => items.push(box(`u${j}`, 128 + j * 30, UY - 13, v, { tone: cur.includes(v) ? "accent" : "plain", w: 26, h: 26, size: 12 })));
    return items;
  };

  const frames: Frame[] = [];
  const visited = new Set<string>();
  const recorded = new Set<string>();
  frames.push({
    caption: "Each node is a partial solution and each edge one choice. The tree is never stored: the program holds only the current path, and the used array says which numbers the path already contains.",
    items: draw([], visited, recorded),
  });
  visited.add("r");
  // Frames for the whole subtree under the first choice, then a summary.
  let prev: number[] = [];
  const firstSub = events.findIndex((e, k) => k > 0 && e.kind === "enter" && e.path.length === 1 && e.path[0] !== nums[0]);
  for (let k = 1; k < firstSub; k++) {
    const e = events[k];
    if (e.kind === "leave") continue;
    if (e.kind === "record") {
      recorded.add(key(e.path));
      frames.push({
        caption: `The path is full: record a copy of ${fmt(e.path)}. ${recorded.size === 1 ? "A copy, because the path keeps changing after this." : "Every used flag still matches the path — the invariant at work."}`,
        items: draw(e.path, visited, recorded),
      });
      continue;
    }
    const undone = prev.filter((_, i) => i >= commonPrefix(prev, e.path)).reverse();
    const chosen = e.path[e.path.length - 1];
    visited.add(key(e.path));
    frames.push({
      caption: undone.length
        ? `On the way back up, unchoose ${undone.join(" then ")}: each pop clears its used flag, so the state is exactly as it was before. Then choose ${chosen}, the next unused number.`
        : `Choose ${chosen}: push it onto the path and mark it used, then explore everything below with one recursive call.${e.path.length > 1 ? ` ${nums.filter((v) => e.path.slice(0, -1).includes(v)).join(" and ")} ${e.path.length > 2 ? "are" : "is"} in use, so the loop skips ${e.path.length > 2 ? "them" : "it"}.` : ""}`,
      items: draw(e.path, visited, recorded),
    });
    prev = e.path;
  }
  for (const e of events) if (e.kind === "enter") visited.add(key(e.path));
  for (const e of events) if (e.kind === "record") recorded.add(key(e.path));
  frames.push({
    caption: `Unchoose ${nums[0]} and the same happens under ${nums.slice(1).join(" and ")}. The walk visits all ${kids.size} nodes and records ${recorded.size} leaves; for n numbers there are n! leaves of n steps each, O(n × n!).`,
    items: draw([], visited, recorded),
  });
  return finish({ title: "Choose, explore, unchoose: the permutations of [1, 2, 3]", input: `nums = ${fmt(nums)}`, frames });
}

function commonPrefix(a: readonly number[], b: readonly number[]): number {
  let k = 0;
  while (k < a.length && k < b.length && a[k] === b[k]) k++;
  return k;
}

/* ── Subsets with a start index ──────────────────────────────────── */

/** The start-index loop: every node is a subset, and indices only increase, so each subset has exactly one path. */
function subsetsLoop(): Walkthrough {
  const nums = [1, 2, 3];
  const BW = 50;
  const BH = 24;
  const kids = new Map<string, string[]>();
  const order: string[] = [];
  const key = (p: readonly number[]) => `s${p.join("")}`;
  const path: number[] = [];
  const back = (start: number) => {
    order.push(key(path)); // record a copy of the path: every node is a subset
    kids.set(key(path), []);
    for (let j = start; j < nums.length; j++) {
      path.push(nums[j]);
      kids.get(key(path.slice(0, -1)))!.push(key(path));
      back(j + 1);
      path.pop();
    }
  };
  back(0);
  const at = treeLayout<string>("s", (id) => kids.get(id) ?? [], { dx: BW + 22, dy: 58 });
  const items: Item[] = [];
  for (const [id, p] of at)
    for (const c of kids.get(id) ?? []) {
      const q = at.get(c)!;
      items.push({ k: "edge", id: `e${c}`, x1: p.x, y1: p.y + BH / 2, x2: q.x, y2: q.y - BH / 2, tone: "line", label: `+${c.slice(-1)}` });
    }
  for (const [id, p] of at) {
    const pp = id.slice(1);
    items.push(box(`n${id}`, p.x - BW / 2, p.y - BH / 2, pp ? pp.split("").join(",") : "{ }", { tone: "strong", w: BW, h: BH, size: 11.5 }));
    items.push({ k: "text", id: `o${id}`, x: p.x - BW / 2 - 5, y: p.y, text: `${order.indexOf(id) + 1}.`, tone: "accent", anchor: "end", size: 11, weight: 600, mono: false });
  }
  return finish({
    title: "Subsets with a start index: every node is an answer",
    input: `nums = ${fmt(nums)}`,
    frames: [
      {
        caption: `At each node the loop offers only elements after the last one taken, so {1, 3} is built as 1 then 3 and never as 3 then 1. Every node is recorded — ${order.length} subsets, numbered in the order they come out — each exactly once.`,
        items,
      },
    ],
  });
}

/* ── N-Queens ────────────────────────────────────────────────────── */

/** 4-queens, row by row, to the first solution: attacked squares are refused, dead rows send the search back. */
function queens(): Walkthrough {
  const n = 4;
  const G = { w: 38, h: 38, gap: 4 };
  const F = { size: 20, gap: 3 };
  const BY = n * (G.h + G.gap) + 20; // the flag arrays under the board
  type Q = { r: number; c: number };
  type Ev = { kind: "place"; q: Q } | { kind: "dead"; r: number } | { kind: "remove"; q: Q } | { kind: "done" };
  const events: Ev[] = [];
  const cols = new Array<boolean>(n).fill(false);
  const diag = new Array<boolean>(2 * n - 1).fill(false);
  const anti = new Array<boolean>(2 * n - 1).fill(false);
  const solve = (r: number): boolean => {
    if (r === n) {
      events.push({ kind: "done" });
      return true;
    }
    let tried = false;
    for (let c = 0; c < n; c++) {
      const d = r - c + n - 1;
      const a = r + c;
      if (cols[c] || diag[d] || anti[a]) continue; // attacked: the whole subtree is pruned
      tried = true;
      cols[c] = diag[d] = anti[a] = true;
      events.push({ kind: "place", q: { r, c } });
      if (solve(r + 1)) return true;
      cols[c] = diag[d] = anti[a] = false;
      events.push({ kind: "remove", q: { r, c } });
    }
    if (!tried) events.push({ kind: "dead", r });
    return false;
  };
  solve(0);

  const attacked = (qs: Q[], r: number, c: number) => qs.some((q) => q.c === c || q.r - q.c === r - c || q.r + q.c === r + c);
  const draw = (qs: Q[], o: { dead?: number; focus?: Q; lines?: Q } = {}): Item[] => {
    const blank = Array.from({ length: n }, () => Array.from({ length: n }, () => ""));
    const isQ = (r: number, c: number) => qs.some((q) => q.r === r && q.c === c);
    const items: Item[] = grid("b", blank, {
      ...G,
      tone: (r, c) => {
        if (o.lines) return r === o.lines.r && c === o.lines.c ? "strong" : o.lines.c === c || o.lines.r - o.lines.c === r - c || o.lines.r + o.lines.c === r + c ? "accent" : "plain";
        if (isQ(r, c)) return "strong";
        if (r === o.dead) return "error";
        return attacked(qs, r, c) ? "muted" : "plain";
      },
      text: (r, c) => (isQ(r, c) || (o.lines && o.lines.r === r && o.lines.c === c) ? "Q" : ""),
      rowLabels: blank.map((_, r) => `row ${r}`),
    });
    const set = (qsx: Q[]) => ({
      c: new Set(qsx.map((q) => q.c)),
      d: new Set(qsx.map((q) => q.r - q.c + n - 1)),
      a: new Set(qsx.map((q) => q.r + q.c)),
    });
    const s = set(o.lines ? [o.lines] : qs);
    const flagRow = (id: string, name: string, len: number, on: Set<number>, y: number) => {
      items.push({ k: "text", id: `${id}l`, x: -8, y: y + F.size / 2, text: name, tone: "soft", anchor: "end", size: 11, mono: false });
      for (let i = 0; i < len; i++) items.push(box(`${id}${i}`, i * (F.size + F.gap), y, on.has(i) ? 1 : "", { tone: on.has(i) ? "accent" : "plain", w: F.size, h: F.size, size: 11 }));
    };
    flagRow("fc", "cols[c]", n, s.c, BY);
    flagRow("fd", `diag[r − c + ${n - 1}]`, 2 * n - 1, s.d, BY + F.size + 6);
    flagRow("fa", "anti[r + c]", 2 * n - 1, s.a, BY + 2 * (F.size + 6));
    if (o.focus) items.push(arrow("focus", { x: gridCell(o.focus.r, n - 1, G).x + G.w + 26, y: gridCell(o.focus.r, 0, G).mid.y }, { x: gridCell(o.focus.r, n - 1, G).x + G.w + 6, y: gridCell(o.focus.r, 0, G).mid.y }, { tone: "accent" }));
    return items;
  };

  const frames: Frame[] = [];
  const demo: Q = { r: 1, c: 2 };
  frames.push({
    caption: `A queen at (${demo.r}, ${demo.c}) attacks its column ${demo.c}, the diagonal where r − c = ${String(demo.r - demo.c).replace("-", "−")} and the anti-diagonal where r + c = ${demo.r + demo.c}. One boolean per column and per diagonal makes "is this square attacked?" three lookups, O(1).`,
    items: draw([], { lines: demo }),
  });
  const qs: Q[] = [];
  let removed: Q[] = [];
  let attempts = 0;
  for (const e of events) {
    if (e.kind === "remove") {
      removed.push(e.q);
      qs.pop();
      continue;
    }
    if (e.kind === "place") {
      attempts++;
      const rowsLifted = removed.map((q) => String(q.r));
      const back = removed.length ? `Back up: lift the queen${removed.length > 1 ? "s" : ""} in row${removed.length > 1 ? "s" : ""} ${rowsLifted.length > 1 ? `${rowsLifted.slice(0, -1).join(", ")} and ${rowsLifted[rowsLifted.length - 1]}` : rowsLifted[0]}, clearing ${removed.length > 1 ? "their" : "its"} flags. ` : "";
      const again = removed.some((q) => q.r === e.q.r);
      qs.push(e.q);
      frames.push({
        caption:
          attempts > 2 && !back
            ? `Row ${e.q.r}: column ${e.q.c} is the first square no queen attacks — a queen goes there, three more flags go up.`
            : `${back}Row ${e.q.r}: column ${e.q.c} is the ${again ? "next untried" : "first"} square no queen attacks, so a queen goes there and its column and diagonals are flagged.${qs.length === 1 && !back ? " Rows are filled one at a time, so the row rule holds by construction." : ""}`,
        items: draw(qs, { focus: e.q }),
      });
      removed = [];
    } else if (e.kind === "dead") {
      const firstDead = !frames.some((f) => f.caption.includes("is dead"));
      frames.push({
        caption: firstDead
          ? `Row ${e.r}: every square is attacked. No later choice can repair that, so this partial board is dead — and every way of filling the rows below it is skipped without being built.`
          : `Row ${e.r} is dead as well: all ${n} squares attacked. The search backs up again, further this time.`,
        items: draw(qs, { dead: e.r, focus: { r: e.r, c: 0 } }),
      });
    } else {
      frames.push({
        caption: `A queen in every row: the first solution, found after ${attempts} placements. Carrying on finds all ${queenCount(n).solutions}; for 8 queens the whole search places ${queenCount(8).placed.toLocaleString("en-GB")} queens to find all ${queenCount(8).solutions} solutions.`,
        items: draw(qs),
      });
    }
  }
  return finish({ title: "Four queens, row by row, with constraint sets", input: `n = ${n}`, frames });
}

/* ── Skipping duplicates ─────────────────────────────────────────── */

/** Combination Sum II's two rules on one level and the next: equal siblings are skipped, an equal child is not; a too-large candidate ends the loop. */
function dupSkip(): Walkthrough {
  const cands = [10, 1, 2, 7, 6, 1, 5].sort((a, b) => a - b);
  const target = 8;
  const C = { size: 34, gap: 6 };
  const RY = 70;
  // What the loop does with each j at one node: try, skip (equal sibling) or stop (too large, sorted).
  const level = (start: number, remaining: number) => {
    const out: Array<{ j: number; what: "try" | "skip" | "break" | "after" }> = [];
    let stopped = false;
    for (let j = start; j < cands.length; j++) {
      if (stopped) {
        out.push({ j, what: "after" });
        continue;
      }
      if (cands[j] > remaining) {
        out.push({ j, what: "break" });
        stopped = true;
        continue;
      }
      out.push({ j, what: j > start && cands[j] === cands[j - 1] ? "skip" : "try" });
    }
    return out;
  };
  const items: Item[] = [];
  const row = (id: string, start: number, remaining: number, y: number, title: string) => {
    items.push({ k: "text", id: `${id}t`, x: start * (C.size + C.gap), y: y - 22, text: title, tone: "ink", anchor: "start", size: 11.5, weight: 600, mono: false });
    for (const { j, what } of level(start, remaining)) {
      const x = j * (C.size + C.gap);
      const tone: Tone = what === "skip" ? "error" : what === "break" || what === "after" ? "muted" : "plain";
      items.push(box(`${id}${j}`, x, y, cands[j], { tone, w: C.size, h: C.size, size: 13 }));
      if (what === "skip") items.push({ k: "text", id: `${id}s${j}`, x: x + C.size / 2, y: y + C.size + 12, text: "skip", tone: "error", anchor: "middle", size: 10.5, weight: 600, mono: false });
      if (what === "break") items.push({ k: "text", id: `${id}b${j}`, x: x + C.size / 2, y: y + C.size + 12, text: `> ${remaining}: stop`, tone: "soft", anchor: "middle", size: 10.5, mono: false });
    }
  };
  row("a", 0, target, 0, `children of the root (need ${target})`);
  const first = 0;
  row("c", first + 1, target - cands[first], RY + 22, `children of the first ${cands[first]} (need ${target - cands[first]})`);
  items.push(arrow("down", { x: C.size / 2, y: C.size + 4 }, { x: (first + 1) * (C.size + C.gap) - 4, y: RY + 22 + C.size / 2 }, { tone: "accent", bow: 22 }));
  // The second 1 as a child leads to [1, 1, 6]: check it is a real answer.
  const second = level(first + 1, target - cands[first]).find((x) => x.j === first + 1);
  if (second?.what !== "try") throw new Error("expected the second 1 to be allowed as a child");
  items.push({ k: "text", id: "ok", x: (first + 1) * (C.size + C.gap) + C.size / 2, y: RY + 22 + C.size + 12, text: "allowed", tone: "accent", anchor: "middle", size: 10.5, weight: 600, mono: false });
  return finish({
    title: "Duplicates: skip an equal sibling, never an equal child",
    input: `candidates = ${fmt([10, 1, 2, 7, 6, 1, 5])} sorted, target = ${target}`,
    frames: [
      {
        caption: `Sorted, equal values sit together. At the root the second 1 would grow the same subtree as the first, so j > start and an equal neighbour mean skip. Below the first 1 it is a child — the next value of the combination — and is allowed: that is how [1, 1, 6] is built. Sorted order also lets a too-large value end the loop.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "brute-vs-prune": bruteVsPrune,
  "template-tree": templateTree,
  "subsets-loop": subsetsLoop,
  queens,
  "dup-skip": dupSkip,
};

