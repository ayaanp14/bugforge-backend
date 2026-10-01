import { CELL, GAP, and, bandOver, finish, link, note, over, row, rowLabel, slotX, under, type Frame, type Item, type Walkthrough } from "./core.js";

/**
 * The two reference walkthroughs every other one follows in shape: an array
 * technique (sliding window) and a graph one (breadth-first search). Each
 * runs the algorithm and records a frame at every step it takes.
 */

/** Longest substring without repeating characters: the window grows on the right and jumps its left edge past a repeat. */
export function slidingWindow(): Walkthrough {
  const s = "pwwkew";
  const chars = [...s];
  const frames: Frame[] = [];
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  let bestAt: [number, number] = [0, -1];
  const Y = 0;

  const draw = (r: number, o: { clash?: number; window?: [number, number]; answer?: boolean } = {}): Item[] => {
    const [wl, wr] = o.window ?? [left, r];
    const items: Item[] = [];
    if (wr >= wl) items.push(bandOver("win", wl, wr, { y: Y }));
    items.push(rowLabel("lbl", "s", -10, Y));
    items.push(...row("c", chars, { y: Y, index: true, tone: (i) => (i === o.clash ? "error" : i >= wl && i <= wr ? (o.answer ? "strong" : "accent") : i < wl && !o.answer ? "muted" : "plain") }));
    items.push(under("L", Math.max(0, wl), "left", { y: Y, indexed: true }));
    if (r >= 0) items.push(over("R", r, "right", { y: Y, tone: "ink" }));
    const seen = [...last.entries()].sort((a, b) => a[1] - b[1]).map(([c, i]) => `${c}→${i}`);
    items.push(note("seen", `last seen: ${seen.length ? seen.join("  ") : "—"}`, 0, Y + CELL + 58, { tone: "soft", size: 12 }));
    items.push(note("best", `longest so far: ${best}${best ? ` ("${s.slice(bestAt[0], bestAt[1] + 1)}")` : ""}`, 0, Y + CELL + 80, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `The window is the stretch s[left..right], and it may never hold a character twice. Both edges start at index 0 with nothing inside yet; a map remembers the last index each character was seen at.`,
    items: draw(-1, { window: [0, -1] }),
  });

  chars.forEach((c, r) => {
    const prev = last.get(c);
    if (prev !== undefined && prev >= left) {
      frames.push({
        caption: `right reaches '${c}' at index ${r}, but '${c}' is already in the window at index ${prev}. Shrinking one step at a time would work, but the map says exactly where the repeat is.`,
        items: draw(r, { clash: prev, window: [left, r] }),
      });
      left = prev + 1;
      last.set(c, r);
      if (r - left + 1 > best) {
        best = r - left + 1;
        bestAt = [left, r];
      }
      frames.push({
        caption: `So left jumps straight to index ${left}, one past the old '${c}'. The window "${s.slice(left, r + 1)}" is distinct again; its length is ${r - left + 1}, and the best is still ${best}.`,
        items: draw(r),
      });
      return;
    }
    last.set(c, r);
    const grew = r - left + 1 > best;
    if (grew) {
      best = r - left + 1;
      bestAt = [left, r];
    }
    frames.push({
      caption: `right moves to index ${r} and reads '${c}', which is not in the window, so the window grows to "${s.slice(left, r + 1)}" (length ${r - left + 1}).${grew ? ` That is the longest yet: best = ${best}.` : ` The best stays ${best}.`}`,
      items: draw(r),
    });
  });

  frames.push({
    caption: `right has passed the end. Each index entered the window once and left at most once, so the scan is O(n) — the answer is ${best}, for "${s.slice(bestAt[0], bestAt[1] + 1)}".`,
    items: draw(chars.length - 1, { window: bestAt, answer: true }),
  });

  return finish({ title: "Longest substring without repeating characters, with a sliding window", input: `s = "${s}"`, frames });
}

/** Breadth-first search from A: a queue hands out nodes in order of distance, and each node is marked the moment it is queued. */
export function breadthFirstSearch(): Walkthrough {
  const names = ["A", "B", "C", "D", "E", "F", "G"];
  const edges: Array<[number, number]> = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6]];
  const pos = [
    { x: 40, y: 90 }, { x: 130, y: 30 }, { x: 130, y: 150 }, { x: 220, y: 90 }, { x: 220, y: 210 }, { x: 310, y: 150 }, { x: 400, y: 150 },
  ];
  const R = 18;
  const adj = names.map((_, i) => edges.flatMap(([a, b]) => (a === i ? [b] : b === i ? [a] : [])).sort((a, b) => a - b));
  const dist: number[] = names.map(() => -1);
  const parent: number[] = names.map(() => -1);
  const frames: Frame[] = [];
  const QY = 270;

  const draw = (queue: number[], current: number, fresh: number[] = []): Item[] => {
    const items: Item[] = [];
    edges.forEach(([a, b], i) => {
      const tree = parent[b] === a || parent[a] === b;
      items.push(link(`e${i}`, pos[a], pos[b], R, { tone: tree ? "accent" : "line" }));
    });
    names.forEach((n, i) => {
      const tone = i === current ? "strong" : fresh.includes(i) ? "accent" : dist[i] >= 0 && !queue.includes(i) ? "muted" : dist[i] >= 0 ? "accent" : "plain";
      items.push({ k: "node", id: `n${i}`, x: pos[i].x, y: pos[i].y, r: R, text: n, tone });
      if (dist[i] >= 0) items.push(note(`d${i}`, `d=${dist[i]}`, pos[i].x, pos[i].y + R + 11, { anchor: "middle", tone: "accent", size: 11 }));
    });
    items.push(rowLabel("ql", "queue", -10, QY));
    if (queue.length === 0) items.push(note("qe", "empty", 0, QY + CELL / 2, { tone: "faint", size: 12 }));
    // A queued node keeps its id, so it slides left as the front is taken.
    queue.forEach((q, i) => items.push({ k: "cell", id: `q${q}`, x: slotX(i), y: QY, w: CELL, h: CELL, text: names[q], tone: fresh.includes(q) ? "accent" : "plain" }));
    if (queue.length) items.push({ k: "text", id: "front", x: slotX(0) + CELL / 2, y: QY + CELL + 12, text: "front", tone: "faint", anchor: "middle", size: 10 });
    return items;
  };

  dist[0] = 0;
  let queue = [0];
  frames.push({
    caption: `Start at A: its distance is 0, it is marked as seen, and it is the only node in the queue. The queue is what keeps the search in order of distance.`,
    items: draw(queue, -1, [0]),
  });
  while (queue.length) {
    const [u, ...rest] = queue;
    const fresh: number[] = [];
    for (const v of adj[u]) {
      if (dist[v] >= 0) continue;
      dist[v] = dist[u] + 1;
      parent[v] = u;
      fresh.push(v);
    }
    queue = [...rest, ...fresh];
    const skipped = adj[u].filter((v) => !fresh.includes(v)).map((v) => names[v]);
    frames.push({
      caption: fresh.length
        ? `Take ${names[u]} off the front (distance ${dist[u]}). Its unseen neighbour${fresh.length > 1 ? "s" : ""} ${and(fresh.map((v) => names[v]))} ${fresh.length > 1 ? "are" : "is"} marked at distance ${dist[u] + 1} and joined the back of the queue${skipped.length ? `; ${and(skipped)} ${skipped.length > 1 ? "were" : "was"} already seen and ${skipped.length > 1 ? "are" : "is"} skipped` : ""}.`
        : `Take ${names[u]} off the front (distance ${dist[u]}). Every neighbour (${and(adj[u].map((v) => names[v]))}) is already marked, so nothing is added.`,
      items: draw(queue, u, fresh),
    });
  }
  const far = names[dist.indexOf(Math.max(...dist))];
  frames.push({
    caption: `The queue is empty and every node has its shortest distance from A in edges — ${far} is the farthest at ${Math.max(...dist)}. The marked edges are the BFS tree: following them back from any node gives a shortest path. Each node and edge was handled once: O(V + E).`,
    items: draw([], -1),
  });
  return finish({ title: "Breadth-first search from A, level by level", input: `edges = ${edges.map(([a, b]) => `${names[a]}–${names[b]}`).join(", ")}; start = A`, frames });
}

/** CELL and GAP re-exported for the generators that place their own rows next to these. */
export { CELL, GAP };
