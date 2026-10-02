import { and, finish, note, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, label } from "./kit.js";

/**
 * Longest Common Subsequence and Edit Distance: the lesson's figures
 * (content/roadmap/longest-common-subsequence.md places each with
 * "@figure <name>"). A common subsequence as lines that never cross, how
 * often plain recursion re-asks each pair of prefixes, why the last-letter
 * rule is right (lines from two different last letters would cross), the
 * LCS table filled and walked back, edit distance on the same frame, the
 * alignment that proves its three cases, and the substring table's reset.
 * Every value is computed by running the method shown.
 */

const A = "ABCBDAB";
const B = "BDCABA";

/** The LCS table over prefixes, exactly as the lesson's first program fills it. */
function lcsTable(a: string, b: string): number[][] {
  const dp = Array.from({ length: a.length + 1 }, () => Array.from({ length: b.length + 1 }, () => 0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp;
}

/** Walk back from (m, n): a match goes diagonally; otherwise up when up ≥ left (the lesson's tie-break), or left when `preferLeft`. Returns the matched pairs, first to last, and the path. */
function walkBack(a: string, b: string, dp: number[][], preferLeft = false) {
  const pairs: Array<[number, number]> = [];
  const path: Array<[number, number]> = [[a.length, b.length]];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      pairs.unshift([i - 1, j - 1]);
      i--;
      j--;
    } else if (preferLeft ? dp[i][j - 1] < dp[i - 1][j] : dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
    path.push([i, j]);
  }
  return { pairs, path };
}

/** Two strings as rows of letter cells, a on top and b below, with a line for each matched pair. */
function lettersAndLines(a: string, b: string, pairs: Array<[number, number]>, o: { S?: number; G?: number; gapY?: number; y?: number; lineTone?: (k: number) => LineTone; cellTone?: (row: "a" | "b", i: number) => Tone; prefix?: string } = {}): Item[] {
  const { S = 32, G = 8, gapY = 80, y = 0, prefix = "" } = o;
  const x = (i: number) => i * (S + G);
  const used = (row: "a" | "b", i: number) => pairs.some((p) => p[row === "a" ? 0 : 1] === i);
  const out: Item[] = [];
  pairs.forEach(([i, j], k) => out.push(arrow(`${prefix}ln${i}-${j}`, { x: x(i) + S / 2, y: y + S + 3 }, { x: x(j) + S / 2, y: y + gapY - 3 }, { tone: o.lineTone?.(k) ?? "accent", head: false })));
  [...a].forEach((ch, i) => out.push({ k: "cell", id: `${prefix}a${i}`, x: x(i), y, w: S, h: S, text: ch, tone: o.cellTone?.("a", i) ?? (used("a", i) ? "strong" : "plain") }));
  [...b].forEach((ch, j) => out.push({ k: "cell", id: `${prefix}b${j}`, x: x(j), y: y + gapY, w: S, h: S, text: ch, tone: o.cellTone?.("b", j) ?? (used("b", j) ? "strong" : "plain") }));
  return out;
}

/** A common subsequence as lines between equal letters that never cross: two different longest ones. */
function lines(): Walkthrough {
  const dp = lcsTable(A, B);
  const up = walkBack(A, B, dp);
  const left = walkBack(A, B, dp, true);
  const word = (pairs: Array<[number, number]>) => pairs.map(([i]) => A[i]).join("");
  const frame = (pairs: Array<[number, number]>): Item[] => [
    { k: "text", id: "la", x: -12, y: 16, text: "a", tone: "soft", anchor: "end", size: 12 },
    { k: "text", id: "lb", x: -12, y: 96, text: "b", tone: "soft", anchor: "end", size: 12 },
    ...lettersAndLines(A, B, pairs),
    note("rd", `LCS "${word(pairs)}", length ${pairs.length}`, 0, 80 + 32 + 28, { size: 12, weight: 600 }),
  ];
  return finish({
    title: "A common subsequence is a set of lines that never cross",
    input: `a = "${A}", b = "${B}"`,
    frames: [
      {
        caption: `Join equal letters of the two strings with lines. The lines keep both orders only if no two of them cross, so a common subsequence is a set of non-crossing lines. "${word(up.pairs)}" uses ${up.pairs.length}, and no ${up.pairs.length + 1} lines fit.`,
        items: frame(up.pairs),
      },
      {
        caption: `"${word(left.pairs)}" is another set of ${left.pairs.length} non-crossing lines. The longest common subsequence is not unique — only its length is — so a program may return either.`,
        items: frame(left.pairs),
      },
    ],
  });
}

/** How many times plain recursion asks for each pair of prefixes. */
function repeats(): Walkthrough {
  const a = "ABXYZ";
  const b = "CDXYW";
  const m = a.length;
  const n = b.length;
  const asked = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));
  let calls = 0;
  const lcs = (i: number, j: number): number => {
    asked[i][j]++;
    calls++;
    if (!i || !j) return 0;
    if (a[i - 1] === b[j - 1]) return 1 + lcs(i - 1, j - 1);
    return Math.max(lcs(i - 1, j), lcs(i, j - 1));
  };
  const answer = lcs(m, n);
  // The same count for two 15-letter strings with no letter in common, by its own recurrence (running it would take a while).
  const K = 15;
  const c = Array.from({ length: K + 1 }, () => Array.from({ length: K + 1 }, () => 0));
  for (let i = 0; i <= K; i++) for (let j = 0; j <= K; j++) c[i][j] = 1 + (i && j ? c[i - 1][j] + c[i][j - 1] : 0);
  const S = 34;
  const G = 4;
  const most = Math.max(...asked.flat());
  const items: Item[] = [];
  for (let j = 0; j <= n; j++) items.push({ k: "text", id: `c${j}`, x: j * (S + G) + S / 2, y: -12, text: j === 0 ? "∅" : b[j - 1], tone: "soft", anchor: "middle", size: 12 });
  for (let i = 0; i <= m; i++) {
    items.push({ k: "text", id: `r${i}`, x: -12, y: i * (S + G) + S / 2, text: i === 0 ? "∅" : a[i - 1], tone: "soft", anchor: "end", size: 12 });
    for (let j = 0; j <= n; j++) {
      const v = asked[i][j];
      items.push({ k: "cell", id: `q${i}-${j}`, x: j * (S + G), y: i * (S + G), w: S, h: S, text: v ? String(v) : "", tone: v === 0 ? "ghost" : v === 1 ? "plain" : "accent", size: 12 });
    }
  }
  const bottom = (m + 1) * (S + G);
  items.push(note("n1", `${calls} calls for ${(m + 1) * (n + 1)} pairs of prefixes`, 0, bottom + 16, { size: 12, weight: 600 }));
  items.push(note("n2", `15 letters, none shared: ${c[K][K].toLocaleString("en-GB")} calls`, 0, bottom + 38, { size: 12, tone: "soft" }));
  return finish({
    title: "How often plain recursion asks for each pair of prefixes",
    input: `a = "${a}", b = "${b}"`,
    frames: [
      {
        caption: `Each cell is one question, the LCS of a prefix of a (down) and a prefix of b (across); its number is how often plain recursion asks it. The LCS is ${answer}, but some questions are asked ${most} times: ${calls} calls for ${(m + 1) * (n + 1)} questions, and the gap grows exponentially.`,
        items,
      },
    ],
  });
}

/** Why the last-letter rule is right: a match can end the LCS; two different last letters cannot both be used, or their lines would cross. */
function whyLast(): Walkthrough {
  const frames: Frame[] = [];
  const S = 30;
  const G = 8;
  const GY = 74;
  const X2 = 260; // the 2 × 2 neighbourhood
  const neighbourhood = (dp: number[][], i: number, j: number, o: { from: "diag" | "up" | "left" | "max" }): Item[] => {
    const C = 34;
    const P = 44;
    const at = (r: number, c: number) => ({ x: X2 + c * P, y: 10 + r * P });
    const cells: Array<[number, number, number, number, string]> = [
      [0, 0, i - 1, j - 1, "diagonal"],
      [0, 1, i - 1, j, "up"],
      [1, 0, i, j - 1, "left"],
      [1, 1, i, j, ""],
    ];
    const out: Item[] = [];
    for (const [r, c, di, dj] of cells) {
      const p = at(r, c);
      const used = (o.from === "diag" && r === 0 && c === 0) || (o.from === "max" && ((r === 0 && c === 1) || (r === 1 && c === 0)));
      out.push({ k: "cell", id: `nb${r}${c}`, x: p.x, y: p.y, w: C, h: C, text: String(dp[di][dj]), tone: r === 1 && c === 1 ? "strong" : used ? "accent" : "plain", size: 13 });
    }
    out.push({ k: "text", id: "nbt", x: X2, y: -10, text: `dp[${i}][${j}] and its neighbours`, tone: "soft", anchor: "start", size: 11, mono: false, weight: 600 });
    if (o.from === "diag") out.push(arrow("nba", { x: at(0, 0).x + C + 1, y: at(0, 0).y + C + 1 }, { x: at(1, 1).x - 1, y: at(1, 1).y - 1 }, { tone: "accent" }));
    else {
      out.push(arrow("nbu", { x: at(0, 1).x + C / 2, y: at(0, 1).y + C + 1 }, { x: at(1, 1).x + C / 2, y: at(1, 1).y - 1 }, { tone: "accent" }));
      out.push(arrow("nbl", { x: at(1, 0).x + C + 1, y: at(1, 0).y + C / 2 }, { x: at(1, 1).x - 1, y: at(1, 1).y + C / 2 }, { tone: "accent" }));
    }
    return out;
  };
  const strings = (a: string, b: string, pairs: Array<[number, number]>, o: { lineTone?: (k: number) => LineTone; cellTone?: (row: "a" | "b", i: number) => Tone } = {}): Item[] => [
    { k: "text", id: "la", x: -10, y: S / 2, text: "a", tone: "soft", anchor: "end", size: 12 },
    { k: "text", id: "lb", x: -10, y: GY + S / 2, text: "b", tone: "soft", anchor: "end", size: 12 },
    ...lettersAndLines(a, b, pairs, { S, G, gapY: GY, ...o }),
  ];

  // Case 1: the last letters match. a = ABCB, b = BDCAB.
  const a1 = A.slice(0, 4);
  const b1 = B.slice(0, 5);
  const d1 = lcsTable(a1, b1);
  const p1 = walkBack(a1, b1, d1).pairs;
  const lastPair = p1.length - 1;
  frames.push({
    caption: `"${a1}" and "${b1}" both end in ${a1[a1.length - 1]}. Some LCS ends by joining those two: a line that ended earlier could slide over to them without crossing anything. What remains is an LCS of the shorter prefixes, so dp[${a1.length}][${b1.length}] = dp[${a1.length - 1}][${b1.length - 1}] + 1 = ${d1[a1.length][b1.length]}.`,
    items: [
      ...strings(a1, b1, p1, { lineTone: (k) => (k === lastPair ? "accent" : "line"), cellTone: (row, i) => ((row === "a" && i === a1.length - 1) || (row === "b" && i === b1.length - 1) ? "strong" : p1.some((p) => p[row === "a" ? 0 : 1] === i) ? "accent" : "plain") }),
      ...neighbourhood(lcsTable(A, B), a1.length, b1.length, { from: "diag" }),
    ],
  });

  // Case 2: the last letters differ. a = ABCBD, b = BDCA: D could only join an earlier D of b, A an earlier A of a.
  const a2 = A.slice(0, 5);
  const b2 = B.slice(0, 4);
  const la = a2[a2.length - 1];
  const lb = b2[b2.length - 1];
  const dIn = b2.slice(0, -1).lastIndexOf(la);
  const aIn = a2.slice(0, -1).lastIndexOf(lb);
  if (dIn < 0 || aIn < 0) throw new Error("why-last: the example needs both last letters to have a partner");
  const crossing: Array<[number, number]> = [
    [a2.length - 1, dIn],
    [aIn, b2.length - 1],
  ];
  frames.push({
    caption: `"${a2}" ends in ${la} and "${b2}" in ${lb}, so those two cannot be joined. ${la} could only join the ${la} early in b, and ${lb} the ${lb} early in a — but those two lines cross. So at least one of the two last letters is not in the LCS.`,
    items: [...strings(a2, b2, crossing, { lineTone: () => "error", cellTone: (row, i) => ((row === "a" && (i === a2.length - 1 || i === aIn)) || (row === "b" && (i === b2.length - 1 || i === dIn)) ? "error" : "plain") }), ...neighbourhood(lcsTable(A, B), a2.length, b2.length, { from: "max" })],
  });
  const d2 = lcsTable(a2, b2);
  const dropA = lcsTable(a2.slice(0, -1), b2)[a2.length - 1][b2.length];
  const dropB = lcsTable(a2, b2.slice(0, -1))[a2.length][b2.length - 1];
  const p2 = walkBack(a2, b2, d2).pairs;
  frames.push({
    caption: `Dropping the unused letter loses nothing. Without ${la} the LCS is ${dropA} (the cell above); without ${lb} it is ${dropB} (the cell to the left). The larger is the answer: dp[${a2.length}][${b2.length}] = max(${dropA}, ${dropB}) = ${d2[a2.length][b2.length]}.`,
    items: [...strings(a2, b2, p2, { cellTone: (row, i) => ((row === "a" && i === a2.length - 1) || (row === "b" && i === b2.length - 1) ? "muted" : p2.some((p) => p[row === "a" ? 0 : 1] === i) ? "accent" : "plain") }), ...neighbourhood(lcsTable(A, B), a2.length, b2.length, { from: "max" })],
  });
  return finish({ title: "Why the last letters decide each cell", input: `prefixes of a = "${A}" and b = "${B}"`, frames });
}

type Cell = [number, number];
/** A table over two strings with headers, cells `t${i}-${j}`; `rowGap`/`colGap` leave room for arrows between cells. */
function tableItems(a: string, b: string, vals: (i: number, j: number) => string, tone: (i: number, j: number) => Tone, o: { S: number; gap: number }): { items: Item[]; at: (i: number, j: number) => { x: number; y: number } } {
  const { S, gap } = o;
  const at = (i: number, j: number) => ({ x: j * (S + gap), y: i * (S + gap) });
  const items: Item[] = [];
  for (let j = 0; j <= b.length; j++) items.push({ k: "text", id: `hc${j}`, x: at(0, j).x + S / 2, y: -12, text: j === 0 ? "∅" : b[j - 1], tone: "soft", anchor: "middle", size: 12 });
  for (let i = 0; i <= a.length; i++) {
    items.push({ k: "text", id: `hr${i}`, x: -10, y: at(i, 0).y + S / 2, text: i === 0 ? "∅" : a[i - 1], tone: "soft", anchor: "end", size: 12 });
    for (let j = 0; j <= b.length; j++) items.push({ k: "cell", id: `t${i}-${j}`, x: at(i, j).x, y: at(i, j).y, w: S, h: S, text: vals(i, j), tone: tone(i, j), size: 12 });
  }
  return { items, at };
}

/** Short arrows into cell (i, j) from its neighbours, in the gaps between cells. */
function into(at: (i: number, j: number) => { x: number; y: number }, S: number, i: number, j: number, from: Array<{ d: "diag" | "up" | "left"; tone: LineTone; id: string }>): Item[] {
  const t = at(i, j);
  return from.map(({ d, tone, id }) => {
    if (d === "diag") {
      const s = at(i - 1, j - 1);
      return arrow(id, { x: s.x + S - 2, y: s.y + S - 2 }, { x: t.x + 3, y: t.y + 3 }, { tone });
    }
    if (d === "up") {
      const s = at(i - 1, j);
      return arrow(id, { x: s.x + S / 2, y: s.y + S + 1 }, { x: t.x + S / 2, y: t.y - 1 }, { tone });
    }
    const s = at(i, j - 1);
    return arrow(id, { x: s.x + S + 1, y: s.y + S / 2 }, { x: t.x - 1, y: t.y + S / 2 }, { tone });
  });
}

/** Short arrows out of cell (i, j) towards a neighbour, in the gaps: the walk back's direction. */
function outOf(at: (i: number, j: number) => { x: number; y: number }, S: number, i: number, j: number, d: "diag" | "up" | "left", id: string, tone: LineTone = "accent"): Item {
  const t = at(i, j);
  if (d === "diag") {
    const s = at(i - 1, j - 1);
    return arrow(id, { x: t.x + 3, y: t.y + 3 }, { x: s.x + S - 2, y: s.y + S - 2 }, { tone });
  }
  if (d === "up") {
    const s = at(i - 1, j);
    return arrow(id, { x: t.x + S / 2, y: t.y - 1 }, { x: s.x + S / 2, y: s.y + S + 1 }, { tone });
  }
  const s = at(i, j - 1);
  return arrow(id, { x: t.x - 1, y: t.y + S / 2 }, { x: s.x + S + 1, y: s.y + S / 2 }, { tone });
}

/** The LCS table filled one row per frame, a match and a mismatch spotlighted in each row, then the walk back. */
function lcsFill(): Walkthrough {
  const a = A;
  const b = B;
  const dp = lcsTable(a, b);
  const S = 30;
  const GAP = 12;
  const frames: Frame[] = [];
  const bottom = (a.length + 1) * (S + GAP);
  const isMatch = (i: number, j: number) => a[i - 1] === b[j - 1];
  const readsOf = (c: Cell): Cell[] => (isMatch(c[0], c[1]) ? [[c[0] - 1, c[1] - 1]] : [[c[0] - 1, c[1]], [c[0], c[1] - 1]]);

  const draw = (o: { filled: number; spots?: Cell[]; path?: Cell[]; readout: string }): Item[] => {
    const spots = o.spots ?? [];
    const reads = spots.flatMap(readsOf);
    const { items, at } = tableItems(
      a,
      b,
      (i, j) => (i > o.filled ? "" : String(dp[i][j])),
      (i, j) => {
        if (o.path) return o.path.some((p) => p[0] === i && p[1] === j) ? (i > 0 && j > 0 && isMatch(i, j) && o.path.some((p) => p[0] === i - 1 && p[1] === j - 1) ? "strong" : "accent") : "plain";
        if (i > o.filled) return "ghost";
        if (spots.some((p) => p[0] === i && p[1] === j)) return "strong";
        if (reads.some((p) => p[0] === i && p[1] === j)) return "accent";
        return "plain";
      },
      { S, gap: GAP },
    );
    spots.forEach(([i, j], k) => {
      if (isMatch(i, j)) items.push(...into(at, S, i, j, [{ d: "diag", tone: "accent", id: `x${k}` }]));
      else {
        const upWins = dp[i - 1][j] >= dp[i][j - 1];
        items.push(...into(at, S, i, j, [{ d: "up", tone: upWins ? "accent" : "line", id: `u${k}` }, { d: "left", tone: upWins ? "line" : "accent", id: `l${k}` }]));
      }
    });
    o.path?.slice(0, -1).forEach(([i, j], k) => {
      const [ni, nj] = (o.path as Cell[])[k + 1];
      items.push(outOf(at, S, i, j, ni === i - 1 && nj === j - 1 ? "diag" : ni === i - 1 ? "up" : "left", `p${k}`));
    });
    items.push(note("rd", o.readout, -10, bottom + 12, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `dp[i][j] is the LCS length of the first i letters of a (down the side) and the first j of b (across). Row 0 and column 0 are empty prefixes, so they are all 0, and the transition never needs a special case for the first letter.`,
    items: draw({ filled: 0, readout: "row 0: the empty prefix of a" }),
  });
  for (let i = 1; i <= a.length; i++) {
    const cols = Array.from({ length: b.length }, (_, k) => k + 1);
    const jm = cols.filter((j) => isMatch(i, j)).pop();
    const misses = cols.filter((j) => !isMatch(i, j) && j !== jm);
    // A mismatch where up and left differ shows the max doing something; fall back to the last mismatch.
    const jx = misses.filter((j) => dp[i - 1][j] !== dp[i][j - 1]).pop() ?? misses.pop();
    const spots = [jm, jx].filter((j): j is number => j !== undefined).sort((p, q) => p - q).map((j) => [i, j] as Cell);
    const say = ([r, j]: Cell) =>
      isMatch(r, j)
        ? `at column ${j}, ${a[r - 1]} meets ${b[j - 1]}: a match, so the diagonal plus one, ${dp[r - 1][j - 1]} + 1 = ${dp[r][j]}`
        : `at column ${j}, ${a[r - 1]} against ${b[j - 1]}: no match, so the larger of up (${dp[r - 1][j]}) and left (${dp[r][j - 1]}), ${dp[r][j]}`;
    const extra =
      i === 1
        ? " Each cell reads only cells above it or to its left, so filling row by row has every input ready."
        : i === a.length
          ? ` The answer is the bottom-right cell, ${dp[a.length][b.length]}.`
          : "";
    const parts = spots.map(say);
    const caption = `Row ${a[i - 1]}: ${parts[0]}${parts[1] ? `; ${parts[1]}` : ""}.${extra}`;
    const readout = spots.map(([r, j]) => (isMatch(r, j) ? `dp[${r}][${j}] = ${dp[r - 1][j - 1]} + 1 = ${dp[r][j]}` : `dp[${r}][${j}] = max(${dp[r - 1][j]}, ${dp[r][j - 1]}) = ${dp[r][j]}`)).join("; ");
    frames.push({ caption, items: draw({ filled: i, spots, readout }) });
  }
  const { pairs, path } = walkBack(a, b, dp);
  const word = pairs.map(([i]) => a[i]).join("");
  frames.push({
    caption: `To read the LCS, walk back from the corner: on a match, take the letter and step diagonally; otherwise step to the larger neighbour, up on a tie. The dark cells are the matches, read in reverse: "${word}".`,
    items: draw({ filled: a.length, path, readout: `LCS = "${word}" (length ${word.length})` }),
  });
  return finish({ title: "The LCS table, one row per letter of a", input: `a = "${a}", b = "${b}"`, frames });
}

/** Edit distance between "horse" and "ros": borders 0, 1, 2, …, three neighbours per cell, then the walk back to the edits. */
function editFill(): Walkthrough {
  const a = "horse";
  const b = "ros";
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  const S = 34;
  const GAP = 14;
  const frames: Frame[] = [];
  const bottom = (m + 1) * (S + GAP);
  // The walk back, choosing at each cell an option that produced its value (replace, then delete, then insert).
  type Step = { i: number; j: number; op: "match" | "replace" | "delete" | "insert" };
  const steps: Step[] = [];
  for (let i = m, j = n; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) steps.push({ i: i--, j: j--, op: "match" });
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) steps.push({ i: i--, j: j--, op: "replace" });
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) steps.push({ i: i--, j, op: "delete" });
    else steps.push({ i, j: j--, op: "insert" });
  }
  // Read forwards, each edit leaves b's first j letters followed by a's unprocessed tail.
  const edits = steps.filter((s) => s.op !== "match").reverse();
  const name = (s: Step) => (s.op === "replace" ? `replace ${a[s.i - 1]} with ${b[s.j - 1]}` : s.op === "delete" ? `delete ${a[s.i - 1]}` : `insert ${b[s.j - 1]}`);
  const after = (s: Step) => b.slice(0, s.j) + a.slice(s.i);

  const draw = (o: { filled: number; spot?: Cell; walk?: boolean; readout: string }): Item[] => {
    const sp = o.spot;
    const onPath = (i: number, j: number) => steps.some((s) => s.i === i && s.j === j) || (i === 0 && j === 0);
    const { items, at } = tableItems(
      a,
      b,
      (i, j) => (i > o.filled ? "" : String(dp[i][j])),
      (i, j) => {
        if (o.walk) return onPath(i, j) ? (steps.find((s) => s.i === i && s.j === j && s.op !== "match") ? "strong" : "accent") : "plain";
        if (i > o.filled) return "ghost";
        if (sp && sp[0] === i && sp[1] === j) return "strong";
        if (sp && ((i === sp[0] - 1 && (j === sp[1] - 1 || j === sp[1])) || (i === sp[0] && j === sp[1] - 1))) return a[sp[0] - 1] === b[sp[1] - 1] ? (i === sp[0] - 1 && j === sp[1] - 1 ? "accent" : "plain") : "accent";
        return i === 0 || j === 0 ? "muted" : "plain";
      },
      { S, gap: GAP },
    );
    if (sp) {
      const [i, j] = sp;
      if (a[i - 1] === b[j - 1]) items.push(...into(at, S, i, j, [{ d: "diag", tone: "accent", id: "x" }]));
      else {
        const best = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        items.push(
          ...into(at, S, i, j, [
            { d: "diag", tone: dp[i - 1][j - 1] === best ? "accent" : "line", id: "x" },
            { d: "up", tone: dp[i - 1][j] === best ? "accent" : "line", id: "u" },
            { d: "left", tone: dp[i][j - 1] === best ? "accent" : "line", id: "l" },
          ]),
        );
      }
    }
    if (o.walk) {
      steps.forEach((s, k) => items.push(outOf(at, S, s.i, s.j, s.op === "delete" ? "up" : s.op === "insert" ? "left" : "diag", `w${k}`)));
      const lx = at(0, n).x + S + 22;
      items.push(label("el", `"${a}"`, lx, at(0, 0).y + S / 2, { anchor: "start", tone: "soft", size: 12, mono: true }));
      edits.forEach((s, k) => {
        items.push(label(`e${k}`, name(s), lx, at(k + 1, 0).y + S / 2 - 8, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));
        items.push(label(`es${k}`, `"${after(s)}"`, lx, at(k + 1, 0).y + S / 2 + 8, { anchor: "start", tone: "ink", size: 12, mono: true }));
      });
    }
    items.push(note("rd", o.readout, -10, bottom + 12, { size: 12, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `dp[i][j] is the fewest edits that turn the first i letters of "${a}" into the first j of "${b}". The borders are not zeros: turning i letters into nothing takes i deletions, and building j letters from nothing takes j insertions.`,
    items: draw({ filled: 0, readout: "row 0: 0, 1, 2, 3 insertions" }),
  });
  for (let i = 1; i <= m; i++) {
    // Spotlight the cell the cheapest path passes through in this row (its last one, walking forwards).
    const inRow = steps.filter((s) => s.i === i);
    const j = (inRow[0] ?? { j: n }).j;
    const match = a[i - 1] === b[j - 1];
    const rep = dp[i - 1][j - 1];
    const del = dp[i - 1][j];
    const ins = dp[i][j - 1];
    const best = Math.min(rep, del, ins);
    const which = rep === best ? "replace" : del === best ? "delete" : "insert";
    const caption = match
      ? `Row ${a[i - 1]}: ${a[i - 1]} against ${b[j - 1]} already agree, so they cost nothing: the cell copies the diagonal, ${dp[i][j]}.`
      : `Row ${a[i - 1]}: ${a[i - 1]} against ${b[j - 1]} differ, so the cell is 1 + the smallest of replace (diagonal ${rep}), delete (up ${del}) and insert (left ${ins}) = ${dp[i][j]}; the best move is to ${which}${which === "replace" ? ` ${a[i - 1]} with ${b[j - 1]}` : which === "delete" ? ` ${a[i - 1]}` : ` ${b[j - 1]}`}.`;
    const readout = match ? `dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}` : `dp[${i}][${j}] = 1 + min(${rep}, ${del}, ${ins}) = ${dp[i][j]}`;
    frames.push({ caption, items: draw({ filled: i, spot: [i, j], readout }) });
  }
  frames.push({
    caption: `The answer is ${dp[m][n]} edits. Walking back from the corner and naming each step recovers them: up is a deletion, left an insertion, diagonal a replacement, or free over equal letters. Read forwards: ${and(edits.map(name))}.`,
    items: draw({ filled: m, walk: true, readout: `${dp[m][n]} edits` }),
  });
  return finish({ title: "Edit distance from \"horse\" to \"ros\"", input: `a = "${a}", b = "${b}"`, frames });
}

/** The cheapest alignment of horse over ros, column by column, and the three kinds of last column. */
function alignment(): Walkthrough {
  const a = "horse";
  const b = "ros";
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
  const cols: Array<{ top: string; bot: string; op: string }> = [];
  for (let i = m, j = n; i > 0 || j > 0; ) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) cols.unshift({ top: a[--i], bot: b[--j], op: "keep" });
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) cols.unshift({ top: a[--i], bot: b[--j], op: "replace" });
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) cols.unshift({ top: a[--i], bot: "−", op: "delete" });
    else cols.unshift({ top: "−", bot: b[--j], op: "insert" });
  }
  const S = 34;
  const G = 10;
  const x = (k: number) => k * (S + G);
  const cost = cols.filter((c) => c.op !== "keep").length;
  const align = (o: { hot?: number }): Item[] => {
    const out: Item[] = [
      { k: "text", id: "la", x: -12, y: S / 2, text: a, tone: "soft", anchor: "end", size: 12 },
      { k: "text", id: "lb", x: -12, y: S + 6 + S / 2, text: b, tone: "soft", anchor: "end", size: 12 },
    ];
    cols.forEach((c, k) => {
      const tone: Tone = o.hot !== undefined && o.hot !== k ? "plain" : c.op === "keep" ? "plain" : "accent";
      out.push({ k: "cell", id: `t${k}`, x: x(k), y: 0, w: S, h: S, text: c.top, tone: c.top === "−" ? "ghost" : tone });
      out.push({ k: "cell", id: `b${k}`, x: x(k), y: S + 6, w: S, h: S, text: c.bot, tone: c.bot === "−" ? "ghost" : tone });
      out.push({ k: "text", id: `o${k}`, x: x(k) + S / 2, y: 2 * S + 20, text: c.op, tone: c.op === "keep" ? "faint" : "accent", anchor: "middle", size: 10.5, mono: false });
    });
    return out;
  };
  const frames: Frame[] = [
    {
      caption: `Write "${a}" over "${b}" with gaps so that every edit is one column: equal letters are kept, different letters a replacement, a letter over a gap a deletion, a gap over a letter an insertion. This alignment has ${cost} edit columns, the distance.`,
      items: [...align({}), note("rd", `cost = ${cost} columns that are not "keep"`, 0, 2 * S + 48, { size: 12, weight: 600 })],
    },
  ];
  // The three kinds of last column for the full strings, each with the cell it leaves.
  const la = a[m - 1];
  const lb = b[n - 1];
  const kinds = [
    { top: la, bot: lb, name: la === lb ? "keep" : "replace", cell: `dp[${m - 1}][${n - 1}]`, v: dp[m - 1][n - 1] + (la === lb ? 0 : 1) },
    { top: la, bot: "−", name: "delete", cell: `dp[${m - 1}][${n}]`, v: dp[m - 1][n] + 1 },
    { top: "−", bot: lb, name: "insert", cell: `dp[${m}][${n - 1}]`, v: dp[m][n - 1] + 1 },
  ];
  const Y = 2 * S + 70;
  const PITCH = 118;
  const f2: Item[] = [...align({ hot: cols.length - 1 })];
  f2.push(label("kt", "the last column can only be one of three kinds", 0, Y - 14, { anchor: "start", tone: "soft", weight: 600 }));
  kinds.forEach((kd, k) => {
    const kx = k * PITCH;
    const best = kd.v === dp[m][n];
    f2.push({ k: "cell", id: `kt${k}`, x: kx, y: Y, w: S, h: S, text: kd.top, tone: kd.top === "−" ? "ghost" : best ? "strong" : "accent" });
    f2.push({ k: "cell", id: `kb${k}`, x: kx, y: Y + S + 6, w: S, h: S, text: kd.bot, tone: kd.bot === "−" ? "ghost" : best ? "strong" : "accent" });
    f2.push(label(`kn${k}`, kd.name, kx + S + 8, Y + S / 2, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }));
    f2.push(label(`kc${k}`, `${kd.cell}`, kx + S + 8, Y + S + 6 + S / 2 - 8, { anchor: "start", tone: "soft", size: 11, mono: true }));
    f2.push(label(`kv${k}`, `${kd.name === "keep" ? "+ 0" : "+ 1"} = ${kd.v}`, kx + S + 8, Y + S + 6 + S / 2 + 8, { anchor: "start", tone: best ? "accent" : "soft", size: 11, mono: true }));
  });
  frames.push({
    caption: `The last column is ${la} over ${lb}, ${la} over a gap, or a gap over ${lb}: the diagonal, up and left neighbours. The columns before it align shorter prefixes and must be the cheapest such alignment, so 1 + the smallest neighbour is right: ${dp[m][n]}.`,
    items: f2,
  });
  return finish({ title: "Why edit distance needs exactly three neighbours", input: `a = "${a}", b = "${b}"`, frames });
}

/** One line changes: the subsequence table keeps max(up, left) on a mismatch, the substring table resets to 0. */
function substring(): Walkthrough {
  const a = "ABXCD";
  const b = "ABYCD";
  const m = a.length;
  const n = b.length;
  const seq = lcsTable(a, b);
  const sub = Array.from({ length: m + 1 }, () => Array.from({ length: n + 1 }, () => 0));
  let best = 0;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      sub[i][j] = a[i - 1] === b[j - 1] ? sub[i - 1][j - 1] + 1 : 0;
      best = Math.max(best, sub[i][j]);
    }
  const S = 32;
  const GAP = 6;
  const bests = sub.flatMap((r, i) => r.map((v, j) => ({ v, i, j }))).filter((c) => c.v === best && best > 0);
  const subs = bests.map((c) => a.slice(c.i - best, c.i));
  const bottom = (m + 1) * (S + GAP);
  const f1 = tableItems(a, b, (i, j) => String(seq[i][j]), (i, j) => (i === m && j === n ? "strong" : i > 0 && j > 0 && a[i - 1] === b[j - 1] ? "accent" : "plain"), { S, gap: GAP }).items;
  f1.push(note("rd", `subsequence: ${seq[m][n]}, in the corner`, -10, bottom + 12, { size: 12, weight: 600 }));
  const f2 = tableItems(a, b, (i, j) => String(sub[i][j]), (i, j) => (bests.some((c) => c.i === i && c.j === j) ? "strong" : sub[i][j] > 0 ? "accent" : i > 0 && j > 0 ? "muted" : "plain"), { S, gap: GAP }).items;
  f2.push(note("rd", `substring: ${best}, the largest cell (${subs.map((s) => `"${s}"`).join(" or ")})`, -10, bottom + 12, { size: 12, weight: 600 }));
  const lcsWord = walkBack(a, b, seq).pairs.map(([i]) => a[i]).join("");
  return finish({
    title: "Subsequence against substring: one line of the table changes",
    input: `a = "${a}", b = "${b}"`,
    frames: [
      {
        caption: `The subsequence table: on a mismatch a cell inherits max(up, left), so a gap is allowed and "${lcsWord}" is found, length ${seq[m][n]}, in the bottom-right corner. The teal cells are the letter matches.`,
        items: f1,
      },
      {
        caption: `The substring table: a cell is the longest common run ending at both letters, so a mismatch resets it to 0 and matches only grow along diagonals. The answer is the largest cell anywhere, ${best}: ${subs.map((s) => `"${s}"`).join(" or ")}.`,
        items: f2,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  lines,
  repeats,
  "why-last": whyLast,
  "lcs-table": lcsFill,
  "edit-table": editFill,
  alignment,
  substring,
};
