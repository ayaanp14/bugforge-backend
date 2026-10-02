import { and, finish, link, note, rowLabel, slotX, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region, type Pt } from "./kit.js";

/**
 * Topological Sort: the lesson's figures (content/roadmap/topological-sort.md
 * places each with "@figure <name>"). What a topological order looks like
 * (every arrow pointing right), why a DAG always has one (walk backwards to
 * a source), why a cycle blocks every order, how Kahn's count exposes a
 * cycle, the DFS version's post-order, and the semesters Kahn's levels
 * give. Every generator runs the real algorithm on its example.
 */

/** The lesson's six courses: an edge [u, v] means u comes before v. */
const N = 6;
const EDGES: Array<[number, number]> = [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]];
const R = 17;
const node = (id: string, p: Pt, text: string, tone: Tone = "plain", r = R): Item => ({ k: "node", id, x: p.x, y: p.y, r, text, tone });
const vertices = (n: number) => Array.from({ length: n }, (_, i) => i);

/** The six courses laid out left to right roughly by prerequisite. */
const POS: Pt[] = [];
POS[5] = { x: 0, y: 25 };
POS[4] = { x: 0, y: 135 };
POS[2] = { x: 100, y: 0 };
POS[0] = { x: 100, y: 90 };
POS[3] = { x: 200, y: 25 };
POS[1] = { x: 290, y: 110 };

/** Kahn's algorithm, queue order, edges taken in input order: the order and the levels it formed. */
function kahn(n: number, edges: ReadonlyArray<readonly [number, number]>) {
  const indeg = vertices(n).map((v) => edges.filter(([, b]) => b === v).length);
  let level = vertices(n).filter((v) => indeg[v] === 0);
  const order: number[] = [];
  const levels: number[][] = [];
  while (level.length) {
    levels.push(level);
    const next: number[] = [];
    for (const u of level) {
      order.push(u);
      for (const [a, b] of edges) if (a === u && --indeg[b] === 0) next.push(b);
    }
    level = next;
  }
  return { order, levels };
}

/**
 * An order drawn as a row of cells with every edge as an arc: forward
 * edges arc over the row in teal, backward ones under it in red.
 */
function orderRow(prefix: string, order: readonly number[], edges: ReadonlyArray<readonly [number, number]>, o: { x?: number; y: number; step?: number; size?: number; names?: (v: number) => string; tone?: (v: number) => Tone }): { items: Item[]; back: Array<readonly [number, number]> } {
  const { x = 0, y, step = 58, size = 36 } = o;
  const at = (v: number) => order.indexOf(v);
  const mid = (v: number) => x + at(v) * step + size / 2;
  const items: Item[] = [];
  const back: Array<readonly [number, number]> = [];
  // Where an arc meets a cell: on the side facing its other end, spread so
  // that arcs sharing a side nest (the longer one nearer the centre).
  const port = (v: number, other: number, top: boolean) => {
    const side = Math.sign(at(other) - at(v));
    const mates = edges
      .filter(([a, b]) => (a === v || b === v) && at(a) < at(b) === top)
      .map(([a, b]) => (a === v ? b : a))
      .filter((w) => Math.sign(at(w) - at(v)) === side)
      .sort((p, q) => Math.abs(at(q) - at(v)) - Math.abs(at(p) - at(v)));
    return mid(v) + side * (3 + 6 * mates.indexOf(other));
  };
  for (const [a, b] of edges) {
    const fwd = at(a) < at(b);
    if (!fwd) back.push([a, b]);
    const span = Math.abs(at(a) - at(b));
    const yy = fwd ? y - 3 : y + size + 3;
    // Both bend away from the row: a negative bow curves a rightward arc up and a leftward one down.
    items.push(arrow(`${prefix}a${a}-${b}`, { x: port(a, b, fwd), y: yy }, { x: port(b, a, fwd), y: yy }, { tone: fwd ? "accent" : "error", bow: -(16 + 14 * span) }));
  }
  order.forEach((v, i) => items.push(box(`${prefix}${v}`, x + i * step, y, o.names ? o.names(v) : v, { w: size, h: size, size: 14, tone: o.tone?.(v) ?? "plain" })));
  return { items, back };
}

/* ── What a topological order is ──────────────────────────────────── */

function forwards(): Walkthrough {
  const kahnOrder = kahn(N, EDGES).order;
  const orders: number[][] = [kahnOrder, [5, 2, 3, 1, 4, 0], [5, 4, 2, 3, 1, 0]];
  const RY = 236;
  const frames: Frame[] = [];
  orders.forEach((order, k) => {
    const row = orderRow("o", order, EDGES, { y: RY });
    const bad = new Set(row.back.map(([a, b]) => `${a}-${b}`));
    const items: Item[] = [];
    EDGES.forEach(([a, b]) => items.push(link(`e${a}-${b}`, POS[a], POS[b], R, { arrow: true, tone: bad.has(`${a}-${b}`) ? "error" : "line" })));
    vertices(N).forEach((v) => items.push(node(`n${v}`, POS[v], String(v))));
    items.push(...row.items);
    items.push(label("verdict", row.back.length ? `not a topological order` : `a topological order`, -2, RY - 62, { anchor: "start", tone: row.back.length ? "error" : "accent", weight: 600, size: 12 }));
    const list = order.join(", ");
    let caption: string;
    if (k === 0) caption = `An arrow u → v means u must come before v. Laid out as ${list}, every one of the ${EDGES.length} arrows points right, so this is a topological order: pick any edge and its first course comes first.`;
    else if (row.back.length) caption = `In ${list} the arrow ${row.back.map(([a, b]) => `${a} → ${b}`).join(" and ")} points left: course ${row.back[0][1]} would be taken before its prerequisite, course ${row.back[0][0]}. One backward arrow is enough to rule an order out.`;
    else caption = `${list} works too: every arrow points right again. A graph usually has many topological orders, because courses with no path between them, like 4 and 5, can go in either order.`;
    frames.push({ caption, items });
  });
  return finish({ title: "A topological order: every arrow points forwards", input: `edges = ${EDGES.map(([a, b]) => `${a}→${b}`).join(", ")}`, frames });
}

/* ── Why a DAG always has a vertex that can go first ─────────────── */

function backwardsWalk(): Walkthrough {
  const into = (v: number, gone: ReadonlySet<number> = new Set()) => EDGES.filter(([a, b]) => b === v && !gone.has(a)).map(([a]) => a);
  const start = 1;
  const walk = [start];
  // Follow any incoming edge; this one prefers a vertex that has incoming edges itself, to show a longer walk.
  while (into(walk[walk.length - 1]).length) {
    const options = into(walk[walk.length - 1]);
    walk.push(options.find((u) => into(u).length > 0) ?? options[0]);
  }
  const frames: Frame[] = [];
  const draw = (k: number, removed?: number, fresh: number[] = []): Item[] => {
    const items: Item[] = [];
    const onWalk = (a: number, b: number) => walk.slice(0, k + 1).some((v, i) => i > 0 && walk[i] === a && walk[i - 1] === b);
    EDGES.forEach(([a, b]) => {
      const gone = a === removed;
      const tone: LineTone = gone ? "faint" : removed === undefined && onWalk(a, b) ? "accent" : "line";
      items.push(link(`e${a}-${b}`, POS[a], POS[b], R, { arrow: true, tone, dashed: gone }));
    });
    vertices(N).forEach((v) => {
      let tone: Tone = "plain";
      if (v === removed) tone = "muted";
      else if (fresh.includes(v)) tone = "strong";
      else if (removed === undefined && v === walk[k]) tone = k === walk.length - 1 ? "strong" : "accent";
      else if (removed === undefined && walk.slice(0, k).includes(v)) tone = "accent";
      items.push(node(`n${v}`, POS[v], String(v), tone));
    });
    const shown = walk.slice(0, k + 1);
    items.push(note("w", removed === undefined ? `walked back: ${shown.join(" ← ")}` : `placed: ${removed} · nothing comes in now: ${fresh.join(", ")}`, -17, 180, { size: 12, weight: 600 }));
    return items;
  };
  frames.push({ caption: `Why can some course always go first? Start anywhere, here at ${start}, and walk backwards along an arrow coming into it.`, items: draw(0) });
  for (let k = 1; k < walk.length; k++) {
    const v = walk[k - 1];
    const options = into(v);
    const last = k === walk.length - 1;
    let caption = `${v} has ${options.length === 1 ? "one arrow" : `${["no", "one", "two", "three", "four"][options.length] ?? options.length} arrows`} coming in${options.length > 1 ? `, from ${and(options.map(String))}; follow either` : ""}, so step back to ${walk[k]}.`;
    if (k === 1) caption += ` With no cycle, the walk can never meet a vertex twice, and there are only ${N} of them, so it must stop.`;
    if (last) caption = `${v} has an arrow from ${walk[k]}, so step back to it — and nothing comes into ${walk[k]}. The walk has stopped at a course with no prerequisites, so it can safely go first.`;
    frames.push({ caption, items: draw(k) });
  }
  const first = walk[walk.length - 1];
  const left = new Set([first]);
  const fresh = vertices(N).filter((v) => v !== first && into(v, left).length === 0);
  frames.push({
    caption: `Place ${first} and remove it. What is left is still a DAG, so it has a course with nothing coming in too — now ${and(fresh.map(String))}. Repeating this always places every course: that is the whole algorithm, and the rest is doing it fast.`,
    items: draw(walk.length - 1, first, fresh),
  });
  return finish({ title: "Why every DAG has a course that can go first", input: `edges = ${EDGES.map(([a, b]) => `${a}→${b}`).join(", ")}`, frames });
}

/* ── Why a cycle blocks every order ───────────────────────────────── */

function cycleBlocks(): Walkthrough {
  const cyc: Array<[number, number]> = [[1, 2], [2, 3], [3, 1]];
  const pos: Record<number, Pt> = { 1: { x: 45, y: 0 }, 2: { x: 90, y: 78 }, 3: { x: 0, y: 78 } };
  const perms: number[][] = [];
  const permute = (rest: number[], acc: number[]) => (rest.length ? rest.forEach((v, i) => permute([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, v])) : perms.push(acc));
  permute([1, 2, 3], []);
  const RX = 170;
  const RY = 40;
  const frames: Frame[] = [];
  let tried = 0;
  for (const order of perms) {
    tried++;
    const row = orderRow("o", order, cyc, { x: RX, y: RY, step: 64 });
    const bad = new Set(row.back.map(([a, b]) => `${a}-${b}`));
    const items: Item[] = [];
    cyc.forEach(([a, b]) => items.push(link(`e${a}-${b}`, pos[a], pos[b], R, { arrow: true, tone: bad.has(`${a}-${b}`) ? "error" : "accent" })));
    [1, 2, 3].forEach((v) => items.push(node(`n${v}`, pos[v], String(v))));
    items.push(...row.items);
    items.push(note("rd", `orders tried: ${tried} of ${perms.length} · arrows pointing back: ${row.back.length}`, -17, 138, { size: 12, weight: 600 }));
    const fwd = cyc.filter(([a, b]) => !bad.has(`${a}-${b}`)).map(([a, b]) => `${a} → ${b}`);
    const bk = row.back.map(([a, b]) => `${a} → ${b}`);
    let caption = `Order ${order.join(", ")}: ${and(fwd)} ${fwd.length === 1 ? "points" : "point"} forwards, but ${and(bk)} ${bk.length === 1 ? "points" : "point"} back.`;
    if (tried === 1) caption = `Three courses in a cycle: 1 before 2, 2 before 3, 3 before 1. Try the order ${order.join(", ")}: ${and(fwd)} point forwards, but ${and(bk)} points back.`;
    if (tried === perms.length) caption += ` All ${perms.length} orders fail: on a cycle each vertex must come before the next, so going round, some vertex would have to come before itself.`;
    frames.push({ caption, items });
  }
  return finish({ title: "A cycle leaves every order with an arrow pointing back", input: "edges = 1→2, 2→3, 3→1", frames });
}

/* ── How Kahn's count exposes a cycle ─────────────────────────────── */

function kahnStuck(): Walkthrough {
  const n = 4;
  const edges: Array<[number, number]> = [[0, 1], [1, 2], [2, 3], [3, 1]];
  const pos: Pt[] = [{ x: 0, y: 50 }, { x: 110, y: 50 }, { x: 210, y: 0 }, { x: 210, y: 100 }];
  const indeg = vertices(n).map((v) => edges.filter(([, b]) => b === v).length);
  const QY = 168;
  const crossed = new Set<string>();
  let queue = vertices(n).filter((v) => indeg[v] === 0);
  const order: number[] = [];
  const draw = (o: { stuck?: boolean; changed?: number[] } = {}): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b]) => {
      const done = crossed.has(`${a}-${b}`);
      const tone: LineTone = done ? "faint" : o.stuck && b !== 0 && a !== 0 ? "error" : "line";
      items.push(link(`e${a}-${b}`, pos[a], pos[b], R, { arrow: true, tone, dashed: done }));
    });
    vertices(n).forEach((v) => {
      const tone: Tone = order.includes(v) ? "strong" : queue.includes(v) ? "accent" : o.stuck ? "error" : "plain";
      items.push(node(`n${v}`, pos[v], String(v), tone));
      const below = v === 2 ? -R - 12 : R + 12;
      items.push(label(`in${v}`, `in=${indeg[v]}`, pos[v].x, pos[v].y + below, { tone: o.changed?.includes(v) ? "accent" : "soft", size: 11, mono: true }));
    });
    items.push(rowLabel("ql", "queue", -10, QY, 34));
    if (queue.length) queue.forEach((v, i) => items.push(box(`q${v}`, slotX(i, 0, 34, 6), QY, v, { w: 34, h: 34, tone: "accent" })));
    else items.push(label("qe", "empty", 0, QY + 17, { anchor: "start", tone: "faint", size: 12 }));
    items.push(rowLabel("ol", "order", 150, QY, 34));
    order.forEach((v, i) => items.push(box(`q${v}`, slotX(i, 160, 34, 6), QY, v, { w: 34, h: 34, tone: "strong" })));
    return items;
  };
  const frames: Frame[] = [];
  const waits = (v: number) => edges.filter(([, b]) => b === v).map(([a]) => a);
  frames.push({
    caption: `The edge 3 → 1 closes the cycle 1 → 2 → 3 → 1. Counting arrows in: ${vertices(n).map((v) => `${v} has ${indeg[v]}`).join(", ")}. Only ${and(queue.map(String))} can start the queue.`,
    items: draw(),
  });
  const u = queue.shift() as number;
  order.push(u);
  const changed: number[] = [];
  for (const [a, b] of edges) if (a === u) (crossed.add(`${a}-${b}`), indeg[b]--, changed.push(b));
  for (const v of changed) if (indeg[v] === 0) queue.push(v);
  frames.push({
    caption: `Take ${u} and cross off its arrow: ${and(changed.map((v) => `${v} drops to ${indeg[v]}`))}, not 0, because ${and(changed.flatMap((v) => waits(v).filter((w) => w !== u)).map((w) => `${w} → ${changed[0]}`))} still holds it. The queue is empty.`,
    items: draw({ changed }),
  });
  const stuck = vertices(n).filter((v) => !order.includes(v));
  frames.push({
    caption: `Only ${order.length} of the ${n} vertices ${order.length === 1 ? "was" : "were"} placed. ${and(stuck.map(String))} each wait for another of the three, for ever. Fewer than V placed always means a cycle, and the leftovers are exactly the vertices on one or behind one.`,
    items: draw({ stuck: true }),
  });
  return finish({ title: "Kahn's algorithm stalls on a cycle", input: "edges = 0→1, 1→2, 2→3, 3→1", frames });
}

/* ── The DFS version: reverse post-order ──────────────────────────── */

function dfsPostorder(): Walkthrough {
  const adj = vertices(N).map((v) => EDGES.filter(([a]) => a === v).map(([, b]) => b));
  const WHITE = 0;
  const GREY = 1;
  const BLACK = 2;
  type Ev = { kind: "enter"; u: number } | { kind: "exit"; u: number } | { kind: "edge"; u: number; v: number };
  const events: Ev[] = [];
  const colour = vertices(N).map(() => WHITE);
  const visit = (u: number) => {
    colour[u] = GREY;
    events.push({ kind: "enter", u });
    for (const v of adj[u]) {
      if (colour[v] === WHITE) visit(v);
      else events.push({ kind: "edge", u, v });
    }
    colour[u] = BLACK;
    events.push({ kind: "exit", u });
  };
  for (let s = 0; s < N; s++) if (colour[s] === WHITE) visit(s);

  // Replay into frames: one at each finish, and one when a call goes deeper.
  const state = vertices(N).map(() => WHITE);
  const tree = new Set<string>();
  const checked = new Set<string>();
  const post: number[] = [];
  const PY = 222;
  const draw = (o: { reversed?: boolean; hot?: string[] } = {}): Item[] => {
    const items: Item[] = [];
    EDGES.forEach(([a, b]) => {
      const k = `${a}-${b}`;
      const tone: LineTone = o.reversed ? "accent" : o.hot?.includes(k) ? "accent" : tree.has(k) ? "ink" : checked.has(k) ? "faint" : "line";
      items.push(link(`e${k}`, POS[a], POS[b], R, { arrow: true, tone, dashed: !o.reversed && checked.has(k) && !o.hot?.includes(k) }));
    });
    vertices(N).forEach((v) => items.push(node(`n${v}`, POS[v], String(v), o.reversed ? "plain" : state[v] === GREY ? "accent" : state[v] === BLACK ? "muted" : "plain")));
    const shown = o.reversed ? [...post].reverse() : post;
    items.push(rowLabel("pl", o.reversed ? "reversed" : "post-order", -10, PY, 36));
    // Reversed, the row is drawn with every edge as an arc over it: all of them point right.
    if (o.reversed) items.push(...orderRow("p", shown, EDGES, { y: PY, step: 44, tone: () => "strong" }).items);
    else shown.forEach((v, i) => items.push(box(`p${v}`, slotX(i, 0, 36, 8), PY, v, { w: 36, h: 36, tone: "plain" })));
    if (!shown.length) items.push(label("pe", "empty", 0, PY + 18, { anchor: "start", tone: "faint", size: 12 }));
    const key: Array<[Tone, string]> = [["accent", "grey: on the stack"], ["muted", "black: finished"]];
    key.forEach(([tone, text], i) => {
      items.push(node(`kn${i}`, { x: -10 + i * 130, y: -44 }, "", tone, 7));
      items.push(label(`kt${i}`, text, 2 + i * 130, -44, { anchor: "start", size: 11 }));
    });
    return items;
  };
  const frames: Frame[] = [];
  // Replay the run. A frame at every finish, and one when a call goes a
  // level deeper; an entry folds into the frame of its own finish otherwise.
  const open: number[] = [];
  let seen: number[] = [];
  let entered = false;
  events.forEach((ev, i) => {
    const next = events[i + 1];
    if (ev.kind === "enter") {
      if (open.length) tree.add(`${open[open.length - 1]}-${ev.u}`);
      open.push(ev.u);
      state[ev.u] = GREY;
      entered = true;
      seen = [];
      if (open.length > 1 && !(next?.kind === "exit" && next.u === ev.u)) {
        frames.push({
          caption: `dfs(${open[0]}) follows ${open.join(" → ")}, and every vertex it enters turns grey: these calls are still waiting on the stack, none finished yet.`,
          items: draw({ hot: open.slice(1).map((v, j) => `${open[j]}-${v}`) }),
        });
        entered = false;
      }
      return;
    }
    if (ev.kind === "edge") {
      checked.add(`${ev.u}-${ev.v}`);
      seen.push(ev.v);
      return;
    }
    open.pop();
    state[ev.u] = BLACK;
    post.push(ev.u);
    let caption: string;
    if (!adj[ev.u].length)
      caption =
        post.length === 1
          ? `dfs(${ev.u}): ${ev.u} has no outgoing edges, so it finishes at once and goes first into the post-order. Nothing has to come after it.`
          : `dfs(${ev.u}): no outgoing edges either, so ${ev.u} finishes next. Vertices that nothing depends on finish early; reversed, they will come late.`;
    else if (seen.length && entered)
      caption =
        post.length === N
          ? `dfs(${ev.u}), the last search: ${and(seen.map(String))} are black already, so ${ev.u} finishes last of all, after everything it points to.`
          : `dfs(${ev.u}): its edges lead to ${and(seen.map(String))}, already black, so ${ev.u} finishes straight away, after everything it points to.`;
    else if (seen.length) caption = `${ev.u} → ${seen.join(", ")} meets a vertex that is already black, which is harmless, so ${ev.u} finishes after ${seen.join(", ")}. For every edge u → v, v finishes first.`;
    else caption = `${ev.u} finishes after ${and(adj[ev.u].map(String))}, the vertex it points to.${open.length ? "" : " The stack is empty again, and the next white vertex starts a new search."}`;
    frames.push({ caption, items: draw() });
    seen = [];
    entered = false;
  });
  const rev = [...post].reverse();
  const ok = EDGES.every(([a, b]) => rev.indexOf(a) < rev.indexOf(b));
  frames.push({
    caption: `Reversed, the post-order is ${rev.join(" ")}${ok ? ", and every arrow points forwards in it" : ""}: since v finishes before u for every edge u → v, u comes before v once the list is turned round. Kahn's algorithm gave ${kahn(N, EDGES).order.join(" ")}; both are valid.`,
    items: draw({ reversed: true }),
  });
  return finish({ title: "Topological order by DFS: reverse the order vertices finish in", input: `edges = ${EDGES.map(([a, b]) => `${a}→${b}`).join(", ")}; starts tried 0, 1, 2, …`, frames });
}

/* ── Kahn's algorithm level by level: semesters ───────────────────── */

function levels(): Walkthrough {
  const { levels: lv } = kahn(N, EDGES);
  // The longest chain of prerequisites, by dynamic programming in topological order.
  const order = lv.flat();
  const best = vertices(N).map(() => 1);
  const prev = vertices(N).map(() => -1);
  for (const u of order) for (const [a, b] of EDGES) if (a === u && best[u] + 1 > best[b]) (best[b] = best[u] + 1), (prev[b] = u);
  let end = vertices(N).reduce((m, v) => (best[v] > best[m] ? v : m), 0);
  const chain: number[] = [];
  for (let v = end; v !== -1; v = prev[v]) chain.unshift(v);
  end = chain[chain.length - 1];
  const DX = 112;
  const pos: Pt[] = [];
  lv.forEach((members, k) => {
    // The longest chain runs along y = 0; anything else sits on the row above.
    let up = 0;
    for (const v of members) pos[v] = chain.includes(v) ? { x: k * DX, y: 0 } : { x: k * DX, y: -92 - 72 * up++ };
  });
  const onChain = (a: number, b: number) => chain.some((v, i) => i > 0 && chain[i - 1] === a && v === b);
  const items: Item[] = [];
  lv.forEach((members, k) => {
    items.push(...region(`b${k}`, k * DX - 32, -128, 64, 162, undefined, { tone: "accent" }));
    items.push(label(`bl${k}`, `semester ${k + 1}`, k * DX, -142, { tone: "accent", size: 11, weight: 600 }));
    items.push(label(`bc${k}`, `{${members.join(", ")}}`, k * DX, 50, { tone: "soft", size: 11, mono: true }));
  });
  EDGES.forEach(([a, b]) => items.push(link(`e${a}-${b}`, pos[a], pos[b], R, { arrow: true, tone: onChain(a, b) ? "accent" : "line" })));
  vertices(N).forEach((v) => items.push(node(`n${v}`, pos[v], String(v), chain.includes(v) ? "strong" : "plain")));
  items.push(note("rd", `longest chain: ${chain.join(" → ")} (${chain.length} courses)`, -32, 78, { size: 12, weight: 600 }));
  return finish({
    title: "Kahn's algorithm one level at a time: the fewest semesters",
    input: `edges = ${EDGES.map(([a, b]) => `${a}→${b}`).join(", ")}`,
    frames: [
      {
        caption: `Taking everything in the queue at once gives levels: ${lv.map((m) => `{${m.join(", ")}}`).join(", ")}. No arrow joins two courses of one level, so each level can be one semester: ${lv.length} in all, the length of the longest chain, ${chain.join(" → ")}.`,
        items,
      },
    ],
  });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  forwards,
  "backwards-walk": backwardsWalk,
  "cycle-blocks": cycleBlocks,
  "kahn-stuck": kahnStuck,
  "dfs-postorder": dfsPostorder,
  levels,
};
