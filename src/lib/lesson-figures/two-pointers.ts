import { CELL, and, finish, note, over, row, rowLabel, show, slotMid, under, type Frame, type Item, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, chart, graph, grid, gridCell, label } from "./kit.js";

/**
 * Two Pointers Technique: the lesson's figures (content/roadmap/two-pointers.md
 * places each with "@figure <name>"). The reference set every other
 * lesson's figures follow: a diagram for the idea's shape, animations for
 * each dry run, a picture of *why* it is correct, and a chart for the cost.
 */

/** The two shapes side by side: opposite ends that meet, and two pointers that run the same way. */
function twoShapes(): Walkthrough {
  const a = [1, 2, 3, 4, 6, 8, 11];
  // The bottom row is a real mid-state: remove-duplicates run until read reaches index 4.
  const b = [0, 0, 1, 1, 2, 3, 3];
  const READ = 4;
  let write = 1;
  for (let r = 1; r < READ; r++) if (b[r] !== b[write - 1]) b[write++] = b[r];
  const Y2 = 120;
  const items: Item[] = [
    label("t1", "Opposite ends — meet in the middle", 0, -26, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }),
    rowLabel("l1", "arr", -10, 0),
    ...row("a", a, { tone: (i) => (i === 0 || i === a.length - 1 ? "accent" : "plain") }),
    under("L", 0, "left"),
    under("R", a.length - 1, "right"),
    arrow("m1", { x: slotMid(0) + 18, y: CELL + 30 }, { x: slotMid(2), y: CELL + 30 }, { tone: "accent" }),
    arrow("m2", { x: slotMid(a.length - 1) - 18, y: CELL + 30 }, { x: slotMid(a.length - 3), y: CELL + 30 }, { tone: "accent" }),
    label("t2", "Same direction — one reads, one writes", 0, Y2 - 26, { anchor: "start", tone: "ink", weight: 600, size: 12.5 }),
    rowLabel("l2", "nums", -10, Y2),
    ...row("b", b, { y: Y2, tone: (i) => (i < write ? "strong" : i === READ ? "accent" : "plain") }),
    under("W", write, "write", { y: Y2 }),
    under("Rd", READ, "read", { y: Y2, tone: "ink" }),
    arrow("m3", { x: slotMid(READ) + 18, y: Y2 + CELL + 30 }, { x: slotMid(READ + 2), y: Y2 + CELL + 30 }, { tone: "ink" }),
  ];
  return finish({
    title: "The two shapes of two pointers",
    input: "",
    frames: [
      {
        caption: "Top: the pointers start at both ends of a sorted array and step towards each other until they meet. Bottom: both start at the front and move right — read visits every element, write marks where the next one worth keeping goes.",
        items,
      },
    ],
  });
}

/**
 * Every pair (i, j) as a cell of a triangle, its sum written in it. The
 * brute force checks all of them; the pointers start in the top-right
 * corner, and each comparison crosses out a whole column (too big) or a
 * whole row (too small).
 */
function pairGrid(): Walkthrough {
  const arr = [1, 3, 4, 5, 7, 9, 12];
  const target = 9;
  const n = arr.length;
  const total = (n * (n - 1)) / 2;
  const G = { w: 34, h: 30, gap: 3, x: 0, y: 0 };
  const rows = arr.map((_, i) => arr.map((_, j) => (j > i ? String(arr[i] + arr[j]) : "")));
  const dead = new Set<string>();
  const killRow = (i: number) => arr.forEach((_, j) => j > i && dead.add(`${i}-${j}`));
  const killCol = (j: number) => arr.forEach((_, i) => i < j && dead.add(`${i}-${j}`));
  const frames: Frame[] = [];

  const draw = (l: number, r: number, o: { found?: boolean } = {}): Item[] => {
    const items: Item[] = grid("g", rows, {
      ...G,
      tone: (i, j) => (j <= i ? "ghost" : i === l && j === r ? (o.found ? "strong" : "accent") : dead.has(`${i}-${j}`) ? "muted" : "plain"),
      rowLabels: arr.slice(0, -1).map((v) => `left ${v}`),
      colLabels: arr.map((v, j) => (j === 0 ? "" : String(v))),
      size: 12,
    });
    // The ghost cells on and below the diagonal are pairs of a value with
    // itself or repeats: drawn faintly so the triangle reads as a triangle.
    const filtered = items.filter((it) => !(it.k === "cell" && it.tone === "ghost"));
    filtered.push(label("ch", "right →", gridCell(0, n - 1, G).mid.x, -26, { anchor: "end", size: 10.5 }));
    const live = total - dead.size;
    filtered.push(note("sum", `${arr[l]} + ${arr[r]} = ${arr[l] + arr[r]}${o.found ? " — found" : arr[l] + arr[r] > target ? ` > ${target}` : ` < ${target}`}`, 0, gridCell(n - 1, 0, G).y + G.h + 22, { weight: 600 }));
    filtered.push(note("left", `pairs still possible: ${live} of ${total}`, 0, gridCell(n - 1, 0, G).y + G.h + 44, { tone: "soft", size: 12 }));
    return filtered;
  };

  let l = 0;
  let r = n - 1;
  frames.push({
    caption: `Each cell is one pair, left value by row and right value by column, with its sum. Nested loops would check all ${total}. The pointers start at the top-right corner: the smallest value with the largest.`,
    items: draw(l, r),
  });
  while (l < r) {
    const s = arr[l] + arr[r];
    if (s === target) break;
    if (s > target) {
      killCol(r);
      frames.push({
        caption: `${arr[l]} + ${arr[r]} = ${s} is too big, and ${arr[l]} is the smallest left value — so every cell in the ${arr[r]} column is too big. The whole column is crossed out at once and right moves left.`,
        items: draw(l, r),
      });
      r--;
    } else {
      killRow(l);
      frames.push({
        caption: `${arr[l]} + ${arr[r]} = ${s} is too small, and ${arr[r]} is the largest right value still in play — so every cell in the ${arr[l]} row is too small. The whole row goes and left moves down.`,
        items: draw(l, r),
      });
      l++;
    }
  }
  const checked = frames.length;
  frames.push({
    caption: `${arr[l]} + ${arr[r]} = ${target}: found after ${checked} comparisons instead of up to ${total}. Each step removed a row or a column, so the walk is a staircase of at most n − 1 steps: O(n).`,
    items: draw(l, r, { found: true }),
  });
  return finish({ title: "Why moving a pointer never skips the answer", input: `arr = ${show(arr)}, target = ${target}`, frames });
}

/** Remove duplicates from a sorted array in place: read scans, write marks the end of the kept prefix. */
function readWrite(): Walkthrough {
  const start = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
  const nums = [...start];
  const frames: Frame[] = [];
  const S = { size: 34, gap: 5 };

  const draw = (read: number, write: number, o: { copied?: number; dup?: number; done?: boolean } = {}): Item[] => {
    const items: Item[] = [rowLabel("lbl", "nums", -10, 0, S.size)];
    items.push(
      ...row("c", nums, {
        ...S,
        index: true,
        tone: (i) => (i < write ? (o.done || i === o.copied ? "strong" : "accent") : o.done || i === o.dup ? "muted" : "plain"),
      }),
    );
    if (!o.done) items.push(under("R", read, "read", { ...S, indexed: true, tone: "ink" }));
    // The copy, as an arrow from the value read to the slot it lands in.
    if (o.copied !== undefined && o.copied !== read) items.push(arrow("copy", { x: slotMid(read, 0, S.size, S.gap), y: -4 }, { x: slotMid(o.copied, 0, S.size, S.gap) + 4, y: -4 }, { tone: "accent", bow: 22 }));
    items.push(over("W", write, "write", { ...S, y: -22 }));
    items.push(note("kept", `kept so far: ${show(nums.slice(0, write))}`, 0, S.size + 60, { weight: 600 }));
    return items;
  };

  let write = 1;
  frames.push({
    caption: "The first value is always kept, so write starts at index 1. Everything before write is the finished answer; read will look at every other element once.",
    items: draw(1, write),
  });
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] === nums[write - 1]) {
      frames.push({ caption: `read (index ${read}) finds ${nums[read]}, equal to the last kept value ${nums[write - 1]} — a duplicate. Only read moves on.`, items: draw(read, write, { dup: read }) });
      continue;
    }
    nums[write] = nums[read];
    write++;
    frames.push({
      caption: `read finds ${nums[read]}, different from the last kept value ${nums[write - 2]}: it is copied to index ${write - 1} and write moves to ${write}.`,
      items: draw(read, write, { copied: write - 1 }),
    });
  }
  frames.push({
    caption: `read has passed the end. The first ${write} slots hold every distinct value in order, ${show(nums.slice(0, write))}, with no second array: O(n) time, O(1) space.`,
    items: draw(nums.length - 1, write, { done: true }),
  });
  return finish({ title: "Remove duplicates in place with read and write pointers", input: `nums = ${show(start)}`, frames });
}

/** Floyd's cycle detection on a list shaped like the letter rho: slow steps once, fast twice, and they meet inside the loop. */
function fastSlow(): Walkthrough {
  const names = ["1", "2", "3", "4", "5", "6"];
  const next = [1, 2, 3, 4, 5, 2];
  const pos = [
    { x: 0, y: 70 },
    { x: 70, y: 70 },
    { x: 150, y: 70 },
    { x: 215, y: 10 },
    { x: 280, y: 70 },
    { x: 215, y: 130 },
  ];
  const edges: Array<[number, number]> = next.map((b, a) => [a, b]);
  const R = 18;
  const frames: Frame[] = [];

  const draw = (slow: number, fast: number, met = false): Item[] => {
    const items = graph("n", names, pos, edges, { r: R, directed: true, tone: (i) => (met && i === slow ? "strong" : i === slow || i === fast ? "accent" : "plain") });
    items.push({ k: "ptr", id: "slow", x: pos[slow].x, y: pos[slow].y + R + 4, label: "slow", tone: "accent", up: true });
    items.push({ k: "ptr", id: "fast", x: pos[fast].x, y: pos[fast].y - R - 4, label: "fast", tone: "ink", up: false });
    return items;
  };

  let slow = 0;
  let fast = 0;
  frames.push({ caption: "Both pointers start at the head. Node 6 links back to node 3, so following next pointers never reaches the end — the list has a cycle.", items: draw(slow, fast) });
  const seen: string[] = [];
  for (let step = 1; step <= 10; step++) {
    slow = next[slow];
    fast = next[next[fast]];
    seen.push(`${names[slow]}/${names[fast]}`);
    if (slow === fast) {
      frames.push({
        caption: `Step ${step}: slow moves to ${names[slow]} and fast jumps two nodes to ${names[fast]} — they meet. Inside a loop the fast pointer closes the gap by one node a step, so it can never jump over the slow one.`,
        items: draw(slow, fast, true),
      });
      break;
    }
    frames.push({ caption: `Step ${step}: slow moves one node to ${names[slow]}, fast moves two to ${names[fast]}.${step === 2 ? " Both are inside the loop now; fast is behind slow going round, and gains one node every step." : ""}`, items: draw(slow, fast) });
  }
  frames.push({
    caption: `Meeting proves a cycle (positions ${and(seen)} as slow/fast): without one, fast would simply reach the end. It takes O(n) steps and two pointers, where a set of visited nodes would need O(n) memory.`,
    items: draw(slow, fast, true),
  });
  return finish({ title: "Fast and slow pointers find a cycle", input: "1 → 2 → 3 → 4 → 5 → 6 → back to 3", frames });
}

/** Pair checks against n: the triangle of nested loops against the straight line of two pointers. */
function growth(): Walkthrough {
  const c = chart("c", { w: 360, h: 190, xMax: 20, yMax: 200, xLabel: "n (array length)", yLabel: "pairs checked", xTicks: [0, 5, 10, 15, 20], yTicks: [0, 50, 100, 150, 200] });
  const nested = (n: number) => (n * (n - 1)) / 2;
  const items: Item[] = [
    ...c.items,
    c.curve("q", nested, { tone: "error" }),
    c.curve("lin", (n) => Math.max(0, n - 1), { tone: "accent" }),
    label("ql", `nested loops: n(n−1)/2 → ${nested(20)} at n = 20`, c.px(0) + 10, c.py(195), { anchor: "start", tone: "error", size: 11 }),
    label("ll", "two pointers: at most n − 1 = 19", c.px(20), c.py(19) - 14, { anchor: "end", tone: "accent", size: 11 }),
  ];
  return finish({
    title: "How the work grows with the array",
    input: "",
    frames: [
      {
        caption: `Nested loops check every pair, about n²/2 of them — ${nested(20)} for 20 numbers and five billion for 100,000. Two pointers make at most n − 1 moves, a straight line: 99,999 for 100,000.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "two-shapes": twoShapes,
  "pair-grid": pairGrid,
  "read-write": readWrite,
  "fast-slow": fastSlow,
  growth,
};
