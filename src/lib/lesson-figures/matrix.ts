import { finish, note, over, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, grid, gridCell, label } from "./kit.js";

/**
 * Matrix and Grid Traversal — the lesson's figures (content/roadmap/
 * matrix.md places each with "@figure <name>"; the rotation's swaps are the
 * hub's walkthrough). Every grid is drawn by kit's `grid`, every walk is the
 * lesson's own loop run on the example, and a value keeps its id while it
 * moves so a transpose or a row reversal is something you watch happen.
 */

const GRID = { w: 40, h: 40, gap: 6 } as const;
const mid = (r: number, c: number, o: { x?: number; y?: number; w?: number; h?: number; gap?: number } = GRID) => gridCell(r, c, { ...GRID, ...o }).mid;

/* ── Row-major storage ───────────────────────────────────────────── */

/** A 3 × 4 matrix over the one line of memory that holds it: where (r, c) lives, and what each loop order reads. */
function rowMajor(): Walkthrough {
  const rows = 3;
  const cols = 4;
  const m = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => r * cols + c + 1));
  const G = { w: 36, h: 32, gap: 4, x: 0, y: 0 };
  const S = { size: 30, gap: 3, y: 150 };
  const sx = (k: number) => k * (S.size + S.gap);
  const smid = (k: number) => sx(k) + S.size / 2;
  const frames: Frame[] = [];

  const draw = (tone: (r: number, c: number) => Tone, hops: Array<[number, number]>, extra: Item[] = []): Item[] => {
    const items: Item[] = grid("g", m, { ...G, tone, rowLabels: ["row 0", "row 1", "row 2"], colLabels: ["col 0", "col 1", "col 2", "col 3"], size: 13 });
    items.push(label("mem", "memory: one line of addresses, row after row", 0, S.y + S.size + 52, { anchor: "start", size: 11, weight: 600 }));
    for (let r = 0; r < rows; r++) items.push({ k: "span", id: `sp${r}`, x1: sx(r * cols) + 1, x2: sx(r * cols + cols - 1) + S.size - 1, y: S.y + S.size + 22, label: `row ${r}`, tone: "line", down: true });
    m.flat().forEach((v, k) => {
      const r = Math.floor(k / cols);
      const c = k % cols;
      items.push(box(`s${k}`, sx(k), S.y, v, { tone: tone(r, c), w: S.size, h: S.size, size: 12 }));
      items.push({ k: "text", id: `si${k}`, x: smid(k), y: S.y + S.size + 11, text: String(k), tone: "faint", anchor: "middle", size: 10.5 });
    });
    hops.forEach(([a, b], h) => {
      const up = b > a ? -1 : 1;
      items.push(arrow(`hop${h}`, { x: smid(a), y: S.y - 3 }, { x: smid(b), y: S.y - 3 }, { tone: "accent", bow: up * Math.min(26, 8 + Math.abs(b - a) * 4) }));
    });
    items.push(...extra);
    return items;
  };

  const r0 = 2;
  const c0 = 1;
  const off = r0 * cols + c0;
  frames.push({
    caption: `Memory is one long line, so the rows are laid end to end: row 0, then row 1, then row 2. The cell (${r0}, ${c0}) sits at offset ${r0} × ${cols} + ${c0} = ${off}, which holds ${m[r0][c0]}. Read backwards, offset k is row k / cols and column k % cols.`,
    items: draw((r, c) => (r === r0 && c === c0 ? "accent" : "plain"), [], [
      arrow("pick", { x: gridCell(r0, c0, G).mid.x, y: gridCell(r0, c0, G).y + G.h + 2 }, { x: smid(off), y: S.y - 3 }, { tone: "accent", bow: 0 }),
      note("f", `offset = r × cols + c`, cols * (G.w + G.gap) + 14, gridCell(1, 0, G).mid.y - 10, { size: 12 }),
      note("f2", `(${r0}, ${c0}) → ${r0} × ${cols} + ${c0} = ${off}`, cols * (G.w + G.gap) + 14, gridCell(1, 0, G).mid.y + 10, { size: 12, tone: "accent" }),
    ]),
  });
  const rowOrder: number[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rowOrder.push(r * cols + c);
  frames.push({
    caption: "Row by row, the loop reads memory in order: each step is to the very next address, so every block of memory the processor fetches is used in full before the next one is needed.",
    items: draw((r) => (r === 0 ? "accent" : "plain"), rowOrder.slice(0, 5).map((k, i) => [k, rowOrder[i + 1]] as [number, number])),
  });
  const colOrder: number[] = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) colOrder.push(r * cols + c);
  frames.push({
    caption: `Column by column, every step jumps a whole row — ${cols} addresses here, thousands in a real image — so each fetched block yields one useful value. Same additions, several times slower on a large matrix: put the row loop outside.`,
    items: draw((_, c) => (c === 0 ? "accent" : "plain"), colOrder.slice(0, 2).map((k, i) => [k, colOrder[i + 1]] as [number, number])),
  });
  return finish({ title: "How a matrix sits in memory: row-major order", input: "matrix = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]", frames });
}

/* ── Diagonals ───────────────────────────────────────────────────── */

/** r − c and r + c written on every cell: each diagonal has one number, each anti-diagonal another. */
function diagonals(): Walkthrough {
  const n = 4;
  const G = { w: 36, h: 36, gap: 4 };
  const RX = n * (G.w + G.gap) + 40;
  const diff = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r - c));
  const sum = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r + c));
  const items: Item[] = [
    label("t1", "r − c", (n * (G.w + G.gap) - G.gap) / 2, -30, { tone: "ink", weight: 600, size: 12.5 }),
    label("t2", "r + c", RX + (n * (G.w + G.gap) - G.gap) / 2, -30, { tone: "ink", weight: 600, size: 12.5 }),
    ...grid("d", diff, { ...G, tone: (r, c) => (r === c ? "accent" : r - c === 1 ? "muted" : "plain"), text: (r, c) => String(diff[r][c]).replace("-", "−") }),
    ...grid("s", sum, { ...G, x: RX, tone: (r, c) => (r + c === n - 1 ? "accent" : r + c === n - 2 ? "muted" : "plain") }),
    label("b1", "r − c = 0: the main diagonal", (n * (G.w + G.gap) - G.gap) / 2, n * (G.h + G.gap) + 12, { tone: "accent", size: 11.5, weight: 600 }),
    label("b2", `r + c = ${n - 1}: the anti-diagonal`, RX + (n * (G.w + G.gap) - G.gap) / 2, n * (G.h + G.gap) + 12, { tone: "accent", size: 11.5, weight: 600 }),
  ];
  return finish({
    title: "Every diagonal has a number",
    input: "",
    frames: [
      {
        caption: `Along a top-left to bottom-right diagonal r − c never changes; along an anti-diagonal r + c never changes. The main diagonal is r − c = 0 and the anti-diagonal r + c = n − 1 = ${n - 1}; grouping cells by that number visits any diagonal you like (one more is shaded on each side).`,
        items,
      },
    ],
  });
}

/* ── Spiral order ────────────────────────────────────────────────── */

/** Spiral Matrix with four boundaries: the band is the rectangle not yet visited, and each side peels one edge off it. */
function spiral(): Walkthrough {
  const m = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]];
  const R = m.length;
  const C = m[0].length;
  const OUT_Y = R * (GRID.h + GRID.gap) + 46;
  const O = { size: 26, gap: 3 };
  const frames: Frame[] = [];
  const order: number[] = [];
  const visited = new Set<string>();

  const draw = (b: { top: number; bottom: number; left: number; right: number }, walked: Array<[number, number]>, sideName: string): Item[] => {
    const items: Item[] = [];
    if (b.top <= b.bottom && b.left <= b.right) {
      const a = gridCell(b.top, b.left, GRID);
      const z = gridCell(b.bottom, b.right, GRID);
      items.push({ k: "band", id: "rect", x: a.x - 4, y: a.y - 4, w: z.x + z.w - a.x + 8, h: z.y + z.h - a.y + 8, tone: "accent" });
    }
    const now = new Set(walked.map(([r, c]) => `${r}-${c}`));
    items.push(...grid("g", m, { ...GRID, tone: (r, c) => (now.has(`${r}-${c}`) ? "accent" : visited.has(`${r}-${c}`) ? "strong" : "plain") }));
    // The boundaries: row names on the left, column names over the top.
    const rowName = new Map<number, string[]>();
    const add = (map: Map<number, string[]>, k: number, s: string) => map.set(k, [...(map.get(k) ?? []), s]);
    add(rowName, b.top, "top");
    add(rowName, b.bottom, "bottom");
    for (const [r, names] of rowName) {
      const y = r >= 0 && r < R ? mid(r, 0).y : r < 0 ? -18 : mid(R - 1, 0).y + GRID.h + 6;
      items.push({ k: "text", id: `rn${names.join("")}`, x: -10, y, text: names.join(" = "), tone: "accent", anchor: "end", size: 11.5, weight: 600, mono: false });
    }
    const colName = new Map<number, string[]>();
    add(colName, b.left, "left");
    add(colName, b.right, "right");
    for (const [c, names] of colName) items.push(over(`cn${names.join("")}`, c, names.join(" = "), { size: GRID.w, gap: GRID.gap, y: -2 }));
    items.push({ k: "text", id: "side", x: C * (GRID.w + GRID.gap) + 8, y: mid(0, 0).y, text: sideName, tone: "soft", anchor: "start", size: 11.5, weight: 600, mono: false });
    items.push({ k: "text", id: "ol", x: 0, y: OUT_Y - 14, text: "output", tone: "soft", anchor: "start", size: 11, weight: 600, mono: false });
    order.forEach((v, k) => items.push(box(`o${k}`, k * (O.size + O.gap), OUT_Y, v, { tone: "strong", w: O.size, h: O.size, size: 12 })));
    return items;
  };

  let top = 0;
  let bottom = R - 1;
  let left = 0;
  let right = C - 1;
  frames.push({
    caption: "Four boundaries fence the part not visited yet — at first the whole matrix, shaded. Each side of the spiral walks one edge of that rectangle and then moves its boundary inwards, so the rectangle shrinks by one row or one column.",
    items: draw({ top, bottom, left, right }, [], ""),
  });
  const visit = (cells: Array<[number, number]>) => {
    for (const [r, c] of cells) order.push(m[r][c]);
  };
  const settle = (cells: Array<[number, number]>) => cells.forEach(([r, c]) => visited.add(`${r}-${c}`));
  const fmtB = () => `top ${top}, bottom ${bottom}, left ${left}, right ${right}`;
  while (top <= bottom && left <= right) {
    const s1: Array<[number, number]> = [];
    for (let c = left; c <= right; c++) s1.push([top, c]);
    visit(s1);
    top++;
    frames.push({ caption: `Top row, left to right: ${s1.map(([r, c]) => m[r][c]).join(" ")}. That row is done, so top moves down (${fmtB()}).`, items: draw({ top, bottom, left, right }, s1, "1 · top row →") });
    settle(s1);
    const s2: Array<[number, number]> = [];
    for (let r = top; r <= bottom; r++) s2.push([r, right]);
    visit(s2);
    right--;
    frames.push({
      caption: s2.length ? `Right column, downwards: ${s2.map(([r, c]) => m[r][c]).join(" ")}. Then right moves in (${fmtB()}).` : `Right column, rows ${top} to ${bottom}: an empty range, since top is past bottom — nothing is added, and right moves in anyway.`,
      items: draw({ top, bottom, left, right }, s2, "2 · right column ↓"),
    });
    settle(s2);
    if (top <= bottom) {
      const s3: Array<[number, number]> = [];
      for (let c = right; c >= left; c--) s3.push([bottom, c]);
      visit(s3);
      bottom--;
      frames.push({ caption: `A row is still left (top ≤ bottom), so the bottom row is walked right to left: ${s3.map(([r, c]) => m[r][c]).join(" ")}. Bottom moves up.`, items: draw({ top, bottom, left, right }, s3, "3 · bottom row ←") });
      settle(s3);
    } else {
      frames.push({
        caption: `The check matters here: top (${top}) is past bottom (${bottom}), so no row is left. Walking the bottom row anyway would read row ${bottom} again and add ${m[bottom].slice(left, right + 1).reverse().join(" ")} a second time.`,
        items: draw({ top, bottom, left, right }, [], "3 · skipped"),
      });
    }
    if (left <= right) {
      const s4: Array<[number, number]> = [];
      for (let r = bottom; r >= top; r--) s4.push([r, left]);
      visit(s4);
      left++;
      frames.push({
        caption: s4.length ? `A column is still left, so the left column is walked upwards: ${s4.map(([r, c]) => m[r][c]).join(" ")}. Left moves in (${fmtB()}).` : `Left column, from row ${bottom} up to row ${top}: empty again. Left moves in, and now left is past right too.`,
        items: draw({ top, bottom, left, right }, s4, "4 · left column ↑"),
      });
      settle(s4);
    }
  }
  frames.push({
    caption: `The rectangle is empty, so the loop stops. Every cell was visited exactly once, in spiral order: ${order.join(" ")}. O(rows × cols) time, and nothing but four integers of extra space.`,
    items: draw({ top, bottom, left, right }, [], "done"),
  });
  return finish({ title: "Spiral order with four shrinking boundaries", input: "matrix = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]", frames });
}

/* ── Why transpose + reverse is a rotation ───────────────────────── */

/** Every value glides: the transpose mirrors it across the diagonal, the reversal mirrors it across the middle column — together, a quarter turn. */
function rotateWhy(): Walkthrough {
  const n = 4;
  const start = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => r * n + c + 1));
  const m = start.map((row) => [...row]);
  const track = 7;
  const frames: Frame[] = [];
  const where = (v: number): [number, number] => {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c] === v) return [r, c];
    throw new Error(`no ${v}`);
  };
  const [ti, tj] = [Math.floor((track - 1) / n), (track - 1) % n];

  const draw = (o: { diag?: boolean; mirror?: boolean; turn?: boolean; path: string }): Item[] => {
    const items: Item[] = [];
    const span = n * (GRID.w + GRID.gap) - GRID.gap;
    if (o.turn) items.push(arrow("turn", { x: GRID.w / 2, y: -8 }, { x: span - GRID.w / 2, y: -8 }, { tone: "accent", bow: -26, label: "¼ turn" }));
    if (o.diag) items.push({ k: "path", id: "diag", pts: [[-6, -6], [span + 6, span + 6]], tone: "accent", dashed: true, width: 1.4 });
    if (o.mirror) items.push({ k: "path", id: "mirror", pts: [[span / 2, -10], [span / 2, span + 10]], tone: "accent", dashed: true, width: 1.4 });
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) {
        const v = m[r][c];
        const tone: Tone = v === track ? "strong" : v <= n ? "accent" : "plain";
        items.push(box(`v${v}`, c * (GRID.w + GRID.gap), r * (GRID.h + GRID.gap), v, { tone, w: GRID.w, h: GRID.h, size: 14 }));
      }
    const [r, c] = where(track);
    items.push({ k: "text", id: "pos", x: span + 18, y: mid(r, c).y, text: `${track} is at (${r}, ${c})`, tone: "ink", anchor: "start", size: 12, weight: 600 });
    items.push(note("path", o.path, 0, span + 30, { size: 12 }));
    return items;
  };

  frames.push({
    caption: `Follow two things: the top row (${start[0].join(", ")}) and the value ${track} at (${ti}, ${tj}). A quarter turn clockwise must send the top row to the right-hand column and (i, j) to (j, n − 1 − i).`,
    items: draw({ path: `start: (${ti}, ${tj})` }),
  });
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) [m[i][j], m[j][i]] = [m[j][i], m[i][j]];
  const [ai, aj] = where(track);
  frames.push({
    caption: `Transpose: every value is mirrored across the main diagonal, so (i, j) goes to (j, i). The top row is now the left column, and ${track} has moved to (${ai}, ${aj}). The diagonal itself never moves.`,
    items: draw({ diag: true, path: `transpose: (${ti}, ${tj}) → (${ai}, ${aj})` }),
  });
  for (const row of m) row.reverse();
  const [bi, bj] = where(track);
  frames.push({
    caption: `Reverse each row: column c goes to n − 1 − c, so (j, i) goes to (j, n − 1 − i). The left column swings to the right, and ${track} lands at (${bi}, ${bj}).`,
    items: draw({ mirror: true, path: `transpose, reverse: (${ti}, ${tj}) → (${ai}, ${aj}) → (${bi}, ${bj})` }),
  });
  // Check against the rotation done the obvious way, with a second matrix.
  const direct = start.map((row) => [...row]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) direct[j][n - 1 - i] = start[i][j];
  if (direct.some((row, r) => row.some((v, c) => v !== m[r][c]))) throw new Error("transpose + reverse is not the rotation");
  frames.push({
    caption: `(i, j) → (j, i) → (j, n − 1 − i) is exactly the quarter turn, for every cell at once: the top row is the right column read downwards. Two passes of swaps, O(n²) time and O(1) extra space.`,
    items: draw({ turn: true, path: `rotation: (i, j) → (j, n − 1 − i), here (${ti}, ${tj}) → (${bi}, ${bj})` }),
  });
  return finish({ title: "Why transpose then reverse is a quarter turn", input: "matrix = 4 × 4, values 1 to 16", frames });
}

/* ── Set matrix zeroes ───────────────────────────────────────────── */

/** Set Matrix Zeroes: zeroing while scanning spreads; the O(1) version keeps its marks in row 0 and column 0. */
function setZeroes(): Walkthrough {
  const start = [
    [1, 2, 3, 4, 5],
    [6, 7, 0, 9, 10],
    [11, 12, 13, 14, 15],
    [0, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];
  const R = start.length;
  const C = start[0].length;
  const G = { w: 36, h: 34, gap: 4 };
  const frames: Frame[] = [];

  // The right answer, the safe way: two marker arrays.
  const zr = start.map((row) => row.includes(0));
  const zc = start[0].map((_, c) => start.some((row) => row[c] === 0));
  const want = start.map((row, r) => row.map((v, c) => (zr[r] || zc[c] ? 0 : v)));

  const draw = (m: number[][], tone: (r: number, c: number) => Tone, extra: Item[] = [], onTop: Item[] = []): Item[] => [
    ...extra,
    ...grid("g", m, { ...G, tone, rowLabels: m.map((_, r) => `row ${r}`), colLabels: m[0].map((_, c) => `col ${c}`), size: 13 }),
    ...onTop,
  ];
  const isOrig = (r: number, c: number) => start[r][c] === 0;
  const notes = (a: string, b?: string): Item[] => {
    const y = R * (G.h + G.gap) + 14;
    return [note("n1", a, 0, y, { size: 12 }), ...(b ? [note("n2", b, 0, y + 20, { size: 12 })] : [note("n2", " ", 0, y + 20, { size: 12 })])];
  };

  frames.push({
    caption: "Wherever there is a 0, its whole row and column must become 0. There are two zeros here. The trap is to start writing zeros before you have finished finding them.",
    items: draw(start, (r, c) => (isOrig(r, c) ? "accent" : "plain"), notes(`zeros at ${start.flatMap((row, r) => row.map((v, c) => (v === 0 ? `(${r}, ${c})` : ""))).filter(Boolean).join(" and ")}`)),
  });

  // The tempting loop: zero a row and a column the moment a 0 is read.
  const naive = start.map((row) => [...row]);
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++)
      if (naive[r][c] === 0) {
        for (let k = 0; k < C; k++) naive[r][k] = 0;
        for (let k = 0; k < R; k++) naive[k][c] = 0;
      }
  const wrong = naive.flat().filter((v, k) => v === 0 && want[Math.floor(k / C)][k % C] !== 0).length;
  frames.push({
    caption: `Zeroing while scanning: each new 0 is read later as if it were original and spreads its own row and column. ${naive.flat().filter((v) => v === 0).length} of ${R * C} cells end up 0, and ${wrong} of them (red) should have kept their value.`,
    items: draw(naive, (r, c) => (naive[r][c] === 0 && want[r][c] !== 0 ? "error" : naive[r][c] === 0 ? "muted" : "plain"), notes("the tempting loop: wrong")),
  });

  const m = start.map((row) => [...row]);
  const firstRowZero = m[0].includes(0);
  const firstColZero = m.some((row) => row[0] === 0);
  const band: Item[] = [
    { k: "band", id: "nr", x: -5, y: -5, w: C * (G.w + G.gap) + 6, h: G.h + 10, tone: "strong" },
    { k: "band", id: "nc", x: -5, y: -5, w: G.w + 10, h: R * (G.h + G.gap) + 6, tone: "strong" },
  ];
  frames.push({
    caption: `Row 0 and column 0 are about to become notepads, so first save whether they hold a 0 of their own: row 0 ${firstRowZero ? "does" : "does not"}, column 0 ${firstColZero ? "does" : "does not"}. Two booleans are all the extra space.`,
    items: draw(m, (r, c) => (r === 0 || c === 0 ? "accent" : "plain"), [...band, ...notes(`first_row_zero = ${firstRowZero}`, `first_col_zero = ${firstColZero}`)]),
  });

  const marks: Item[] = [];
  const marked = new Set<string>();
  for (let r = 1; r < R; r++)
    for (let c = 1; c < C; c++)
      if (m[r][c] === 0) {
        m[r][0] = 0;
        m[0][c] = 0;
        marked.add(`${r}-0`);
        marked.add(`0-${c}`);
      }
  frames.push({
    caption: `Scan the inner cells. Each 0 writes a mark — a 0 — at the start of its row and the top of its column (solid). Those cells were going to be zeroed anyway, so the marks destroy nothing.${start.some((row, r) => r > 0 && row[0] === 0) ? " The 0 already in column 0 is its own row's mark." : ""}`,
    items: draw(m, (r, c) => (isOrig(r, c) && r > 0 && c > 0 ? "accent" : marked.has(`${r}-${c}`) ? "strong" : "plain"), [...band, ...notes(`first_row_zero = ${firstRowZero}`, `first_col_zero = ${firstColZero}`)], marks),
  });

  const zeroed = new Set<string>();
  for (let r = 1; r < R; r++)
    for (let c = 1; c < C; c++)
      if (m[r][0] === 0 || m[0][c] === 0) {
        if (m[r][c] !== 0) zeroed.add(`${r}-${c}`);
        m[r][c] = 0;
      }
  frames.push({
    caption: `Now read the marks: an inner cell becomes 0 when the start of its row or the top of its column holds a 0. Row 0 and column 0 are still untouched apart from the marks, which this step needs.`,
    items: draw(m, (r, c) => (zeroed.has(`${r}-${c}`) ? "accent" : m[r][c] === 0 ? "strong" : "plain"), notes(`${zeroed.size} inner cells zeroed`)),
  });

  const last = new Set<string>();
  if (firstRowZero) for (let c = 0; c < C; c++) (m[0][c] !== 0 && last.add(`0-${c}`), (m[0][c] = 0));
  if (firstColZero) for (let r = 0; r < R; r++) (m[r][0] !== 0 && last.add(`${r}-0`), (m[r][0] = 0));
  if (m.some((row, r) => row.some((v, c) => v !== want[r][c]))) throw new Error("set zeroes disagrees with the marker-array answer");
  frames.push({
    caption: `Last, the saved booleans: ${firstColZero ? "column 0 held a 0, so it is zeroed now" : "column 0 stays"}${firstRowZero ? " and row 0 is zeroed" : " and row 0 keeps its values"}. Doing this any earlier would have wiped the marks. O(rows × cols) time, O(1) extra space.`,
    items: draw(m, (r, c) => (last.has(`${r}-${c}`) ? "accent" : m[r][c] === 0 ? "strong" : "plain"), notes(`${m.flat().filter((v) => v === 0).length} zeros, the same as the safe version`)),
  });
  return finish({ title: "Set matrix zeroes with the first row and column as notepads", input: "matrix = 5 × 5 with zeros at (1, 2) and (3, 0)", frames });
}

/* ── Searching a sorted matrix ───────────────────────────────────── */

/** The staircase walk from the top-right corner: each comparison drops a whole row or column. */
function staircase(): Walkthrough {
  const m = [[1, 4, 7, 11], [2, 5, 8, 12], [3, 6, 9, 16], [10, 13, 14, 17]];
  const target = 5;
  const R = m.length;
  const C = m[0].length;
  const frames: Frame[] = [];
  let top = 0;
  let right = C - 1;

  const draw = (r: number, c: number, o: { found?: boolean; extra?: Item[]; rect?: boolean; dropRow?: number; dropCol?: number } = {}): Item[] => {
    const items: Item[] = [];
    if (o.rect !== false && top < R && right >= 0) {
      const a = gridCell(top, 0, GRID);
      const z = gridCell(R - 1, right, GRID);
      items.push({ k: "band", id: "rect", x: a.x - 4, y: a.y - 4, w: z.x + z.w - a.x + 8, h: z.y + z.h - a.y + 8, tone: "accent" });
    }
    items.push(
      ...grid("g", m, {
        ...GRID,
        tone: (i, j) => (i === r && j === c ? (o.found ? "strong" : "accent") : (i === o.dropRow && j <= right) || (j === o.dropCol && i >= top) ? "error" : i < top || j > right ? "muted" : "plain"),
        size: 14,
      }),
    );
    items.push(...(o.extra ?? []));
    items.push(note("t", `target = ${target}`, C * (GRID.w + GRID.gap) + 10, mid(0, 0).y, { size: 12.5, weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Every row is sorted left to right and every column top to bottom. Start at the top-right corner, ${m[0][C - 1]}: going left makes values smaller, going down makes them larger, so one comparison says which way to go.`,
    items: draw(0, C - 1),
  });
  let steps = 0;
  while (top < R && right >= 0) {
    const v = m[top][right];
    steps++;
    if (v === target) {
      frames.push({ caption: `${v} equals the target: found at (${top}, ${right}) after ${steps} comparisons. Scanning every cell could have taken ${R * C}; the walk never takes more than rows + cols = ${R + C}.`, items: draw(top, right, { found: true }) });
      break;
    }
    if (v > target) {
      right--;
      frames.push({ caption: `${v} > ${target}, and everything below it in column ${right + 1} is larger still — none of it can be the target. The whole column is dropped and the walk moves left.`, items: draw(top, right + 1, { dropCol: right + 1 }) });
    } else {
      top++;
      frames.push({ caption: `${v} < ${target}, and everything to its left in row ${top - 1} is smaller still. The whole row is dropped and the walk moves down.`, items: draw(top - 1, right, { dropRow: top - 1 }) });
    }
  }
  const tl = gridCell(0, 0, GRID);
  top = 0;
  right = C - 1;
  frames.push({
    caption: `Why not the top-left corner? From ${m[0][0]} both moves, right to ${m[0][1]} and down to ${m[1][0]}, make the value larger, so a comparison cannot choose between them. The top-right or bottom-left corner is what makes one step drop a whole row or column.`,
    items: draw(0, 0, {
      rect: false,
      extra: [
        arrow("rt", { x: tl.x + GRID.w + 1, y: tl.mid.y }, { x: tl.x + GRID.w + GRID.gap + 6, y: tl.mid.y }, { tone: "error" }),
        arrow("dn", { x: tl.mid.x, y: tl.y + GRID.h + 1 }, { x: tl.mid.x, y: tl.y + GRID.h + GRID.gap + 6 }, { tone: "error" }),
      ],
    }),
  });
  return finish({ title: "Search a sorted matrix with the staircase walk", input: `matrix = [${m.map((r) => `[${r.join(", ")}]`).join(", ")}], target = ${target}`, frames });
}

/* ── Neighbours ──────────────────────────────────────────────────── */

/** Direction arrays: the four moves as (dr, dc), the bounds check at an edge, and the eight-direction version. */
function neighbours(): Walkthrough {
  const R = 4;
  const C = 5;
  const G = { w: 44, h: 40, gap: 6 };
  const four: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const eight: Array<[number, number]> = [...four, [-1, -1], [-1, 1], [1, -1], [1, 1]];
  const frames: Frame[] = [];
  const sgn = (d: number) => (d < 0 ? "−1" : d > 0 ? "+1" : "0");

  const draw = (r: number, c: number, dirs: Array<[number, number]>): Item[] => {
    const inside = (nr: number, nc: number) => nr >= 0 && nr < R && nc >= 0 && nc < C;
    const items: Item[] = [];
    const tone = (i: number, j: number): Tone => (i === r && j === c ? "strong" : dirs.some(([dr, dc]) => i === r + dr && j === c + dc) ? "accent" : "plain");
    const blank = Array.from({ length: R }, () => Array.from({ length: C }, () => ""));
    items.push(...grid("g", blank, { ...G, tone, text: (i, j) => (i === r && j === c ? "r, c" : "") }));
    dirs.forEach(([dr, dc], k) => {
      const nr = r + dr;
      const nc = c + dc;
      const cell = gridCell(nr, nc, G);
      if (inside(nr, nc)) items.push({ k: "text", id: `d${k}`, x: cell.mid.x, y: cell.mid.y, text: `${sgn(dr)},${sgn(dc)}`, tone: "accent", anchor: "middle", size: 11, weight: 600 });
      else items.push(box(`off${k}`, cell.x, cell.y, "off", { tone: "error", w: G.w, h: G.h, size: 11 }));
    });
    return items;
  };

  frames.push({
    caption: "List the moves once: dr = [−1, 1, 0, 0] and dc = [0, 0, −1, 1]. Neighbour k of (r, c) is (r + dr[k], c + dc[k]) — one loop instead of four copied if-blocks, each a chance for a typo.",
    items: draw(1, 2, four),
  });
  const offs = four.filter(([dr, dc]) => !(dr >= 0 && dr < R && dc >= 0 && dc < C)).length;
  frames.push({
    caption: `At the corner (0, 0), ${offs} of the four moves leave the grid. Test 0 ≤ nr < rows and 0 ≤ nc < cols before reading the cell — in Python a negative index silently reads the other end of the row instead of failing.`,
    items: draw(0, 0, four),
  });
  frames.push({
    caption: "Problems that count diagonal neighbours too, such as Game of Life, add the four diagonal moves: eight pairs in the arrays, and the same loop and bounds check.",
    items: draw(1, 2, eight),
  });
  return finish({ title: "A cell's neighbours with direction arrays", input: "", frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "row-major": rowMajor,
  diagonals,
  spiral,
  "rotate-why": rotateWhy,
  "set-zeroes": setZeroes,
  staircase,
  neighbours,
};

