import { and, finish, link, note, rowLabel, slotMid, slotX, treeLayout, type Frame, type Item, type LineTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { box, chart, label, type Pt } from "./kit.js";

/**
 * Trie (Prefix Tree): the lesson's figures (content/roadmap/trie.md places
 * each with "@figure <name>").
 *
 * The lesson's trie holds car, cat, cart and dog. Each generator builds it
 * with the real insert (children, end mark, pass count) and runs the real
 * walk — search, startsWith, countPrefix, autocomplete, a walk along a text,
 * the XOR trie's greedy descent — recording a frame per step. A node's id is
 * the prefix it spells (`tcar`), so it never moves between frames.
 */

const WORDS = ["car", "cat", "cart", "dog"];
const R = 17;

type TNode = { key: string; kids: Map<string, TNode>; end: boolean; pass: number };

function buildTrie(words: readonly string[]): Map<string, TNode> {
  const nodes = new Map<string, TNode>();
  const root: TNode = { key: "", kids: new Map(), end: false, pass: 0 };
  nodes.set("", root);
  for (const w of words) {
    let node = root;
    for (const ch of w) {
      let next = node.kids.get(ch);
      if (!next) {
        next = { key: node.key + ch, kids: new Map(), end: false, pass: 0 };
        node.kids.set(ch, next);
        nodes.set(next.key, next);
      }
      node = next;
      node.pass++;
    }
    node.end = true;
  }
  return nodes;
}

/** The lesson's walk: the node a prefix leads to, or null where a letter is missing (with how far it got). */
function walk(nodes: Map<string, TNode>, prefix: string): { node: TNode | null; reached: string } {
  let node = nodes.get("")!;
  let reached = "";
  for (const ch of prefix) {
    const next = node.kids.get(ch);
    if (!next) return { node: null, reached };
    node = next;
    reached += ch;
  }
  return { node, reached };
}

const childKeys = (nodes: Map<string, TNode>, k: string) => [...nodes.get(k)!.kids.keys()].sort().map((c) => k + c);

function layout(nodes: Map<string, TNode>, dx: number, dy: number, x = 0, y = 0): Map<string, Pt> {
  return treeLayout<string>("", (k) => childKeys(nodes, k), { dx, dy, x, y });
}

/** Edges, end rings, nodes, and optionally pass counts (left of a node) and words (right of an end node). */
function drawTrie(
  nodes: Map<string, TNode>,
  at: Map<string, Pt>,
  o: { tone?: (k: string) => Tone; edge?: (k: string) => LineTone; counts?: boolean; countTone?: (k: string) => "faint" | "accent"; words?: boolean; wordTone?: (k: string) => "soft" | "accent" | "ink" } = {},
): Item[] {
  const items: Item[] = [];
  for (const [k] of nodes) if (k) items.push(link(`e${k}`, at.get(k.slice(0, -1))!, at.get(k)!, R, { tone: o.edge?.(k) ?? "line" }));
  for (const [k, n] of nodes) if (n.end) items.push({ k: "node", id: `r${k}`, x: at.get(k)!.x, y: at.get(k)!.y, r: R + 5, text: "", tone: "ghost" });
  for (const [k] of nodes) items.push({ k: "node", id: `t${k}`, x: at.get(k)!.x, y: at.get(k)!.y, r: R, text: k ? k[k.length - 1] : "", tone: o.tone?.(k) ?? "plain" });
  const root = at.get("")!;
  items.push(label("root", "root", root.x, root.y - R - 11, { size: 11 }));
  if (o.counts) for (const [k, n] of nodes) if (k) items.push(label(`c${k}`, String(n.pass), at.get(k)!.x - R - 11, at.get(k)!.y, { anchor: "end", tone: o.countTone?.(k) ?? "faint", size: 11, mono: true, weight: 600 }));
  if (o.words) for (const [k, n] of nodes) if (n.end) items.push(label(`w${k}`, k, at.get(k)!.x + R + 10, at.get(k)!.y, { anchor: "start", tone: o.wordTone?.(k) ?? "soft", size: 11.5 }));
  return items;
}

/* ── How a trie is stored ─────────────────────────────────────────── */

function stored(): Walkthrough {
  const nodes = buildTrie(WORDS);
  const CW = 14;
  const CG = 2;
  const rowW = 26 * (CW + CG) - CG;
  const lay = layout(nodes, 110, 54);
  const xs = [...lay.values()].map((p) => p.x);
  const at = new Map([...lay].map(([k, p]) => [k, { x: p.x + rowW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, y: p.y }]));
  const depth = Math.max(...[...nodes.keys()].map((k) => k.length));
  const PICK = "ca";
  const pick = nodes.get(PICK)!;
  const items = drawTrie(nodes, at, { counts: true, words: true, tone: (k) => (k === PICK ? "accent" : "plain") });
  const legendY = depth * 54 + R + 22;
  items.push(label("lg", "number = words through the node · ring = a word ends here", rowW / 2, legendY, { tone: "faint", size: 11 }));
  const AY = legendY + 52;
  items.push(label("al", `node "${PICK}": next[26], one slot per letter`, 0, AY - 14, { anchor: "start", tone: "ink", size: 11.5, weight: 600 }));
  const used = [...pick.kids.keys()];
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(97 + i);
    items.push(box(`s${i}`, slotX(i, 0, CW, CG), AY, ch, { w: CW, h: 22, tone: used.includes(ch) ? "accent" : "muted", size: 10.5 }));
  }
  items.push(label("an", `${26 - used.length} of 26 empty`, rowW, AY + 36, { anchor: "end", tone: "faint", size: 11 }));
  const shared = WORDS.filter((w) => w.startsWith(PICK));
  return finish({
    title: "Inside a trie: shared prefixes, end marks and pass counts",
    input: `words = ${WORDS.map((w) => `"${w}"`).join(", ")}`,
    frames: [
      {
        caption: `Each node stands for the prefix its path spells; ${and(shared.map((w) => `"${w}"`))} share the nodes for c and a. A ring marks where a word ends, and the number is how many words pass through. Node "${PICK}" keeps 26 child slots, of which only ${and(used)} are used.`,
        items,
      },
    ],
  });
}

/* ── The four queries ─────────────────────────────────────────────── */

function queries(): Walkthrough {
  const nodes = buildTrie(WORDS);
  const at = layout(nodes, 88, 54, 0, 0);
  const frames: Frame[] = [];
  const pathOf = (s: string) => [...s].map((_, i) => s.slice(0, i + 1));
  const base = 4 * 54 + R + 28;

  const draw = (o: { path: string[]; hit?: string; miss?: { from: string; ch: string }; countAt?: string; lines: string[]; fail?: boolean }): Item[] => {
    const path = new Set(o.path);
    const items: Item[] = [];
    if (o.miss) {
      const from = at.get(o.miss.from)!;
      const first = at.get(childKeys(nodes, o.miss.from)[0])!;
      const gp = { x: first.x - 70, y: from.y + 54 };
      items.push(link("gx", from, gp, R, { tone: "error", dashed: true }));
      items.push({ k: "node", id: "gn", x: gp.x, y: gp.y, r: R, text: o.miss.ch, tone: "ghost" });
      items.push(label("gl", "no child", gp.x, gp.y + R + 11, { tone: "error", size: 11 }));
    }
    items.push(
      ...drawTrie(nodes, at, {
        counts: true,
        countTone: (k) => (k === o.countAt ? "accent" : "faint"),
        tone: (k) => (k === o.hit ? "strong" : path.has(k) ? "accent" : "plain"),
        edge: (k) => (path.has(k) ? "accent" : "line"),
      }),
    );
    o.lines.forEach((t, i) => items.push(note(`l${i}`, t, -60, base + i * 20, { tone: i === 0 ? "ink" : o.fail ? "error" : "accent", size: 12.5, weight: 600 })));
    return items;
  };

  const search = (w: string) => {
    const { node } = walk(nodes, w);
    return node !== null && node.end;
  };
  const starts = (p: string) => walk(nodes, p).node !== null;
  const count = (p: string) => walk(nodes, p).node?.pass ?? 0;
  const letters = (s: string) => [...s].join(", ");

  const w1 = "car";
  frames.push({
    caption: `search("${w1}") walks ${letters(w1)} from the root, one child lookup per letter. The walk completes and ${w1[w1.length - 1]} carries an end mark, so "${w1}" is a stored word: ${search(w1)}.`,
    items: draw({ path: pathOf(w1), hit: w1, lines: [`search("${w1}")`, `→ ${search(w1)}`] }),
  });
  const w2 = "ca";
  frames.push({
    caption: `search("${w2}") walks ${letters(w2)} and completes too, but ${w2[w2.length - 1]} has no end mark: "${w2}" is only the start of longer words, so the answer is ${search(w2)}. Without end marks, every prefix would pass for a word.`,
    items: draw({ path: pathOf(w2), lines: [`search("${w2}")`, `→ ${search(w2)}`], fail: !search(w2) }),
  });
  frames.push({
    caption: `startsWith("${w2}") asks less: the same walk completing is enough, mark or no mark, because some word continues through that node. The answer is ${starts(w2)}.`,
    items: draw({ path: pathOf(w2), lines: [`startsWith("${w2}")`, `→ ${starts(w2)}`] }),
  });
  const w3 = "cab";
  const got = walk(nodes, w3).reached;
  frames.push({
    caption: `startsWith("${w3}") walks ${letters(got)}, then finds no ${w3[got.length]} child: no stored word continues that way, so the answer is ${starts(w3)} — found out after ${got.length + 1} lookups, however many words are stored.`,
    items: draw({ path: pathOf(got), miss: { from: got, ch: w3[got.length] }, lines: [`startsWith("${w3}")`, `→ ${starts(w3)}`], fail: true }),
  });
  const holders = WORDS.filter((w) => w.startsWith(w1));
  frames.push({
    caption: `countPrefix("${w1}") reads the pass count of the node the walk reaches: ${count(w1)} words, ${and(holders.map((w) => `"${w}"`))}, run through it. Insert kept the count up to date, so the answer costs only the walk: O(L).`,
    items: draw({ path: pathOf(w1), countAt: w1, lines: [`countPrefix("${w1}")`, `→ ${count(w1)}`] }),
  });
  return finish({ title: "search, startsWith and countPrefix: one walk, three questions", input: `words = ${WORDS.map((w) => `"${w}"`).join(", ")}`, frames });
}

/* ── Autocomplete ─────────────────────────────────────────────────── */

function autocomplete(): Walkthrough {
  const nodes = buildTrie(WORDS);
  const PREFIX = "ca";
  const at = layout(nodes, 88, 54);
  const OY = 4 * 54 + R + 34;
  const OW = 52;
  const out: string[] = [];
  const frames: Frame[] = [];
  const pathTo = [...PREFIX].map((_, i) => PREFIX.slice(0, i + 1));

  const draw = (o: { cur?: string; visited: Set<string>; final?: boolean }): Item[] => {
    const items = drawTrie(nodes, at, {
      words: true,
      wordTone: (k) => (out.includes(k) ? "accent" : "soft"),
      tone: (k) => (o.final && out.includes(k) ? "strong" : k === o.cur ? "accent" : pathTo.includes(k) || o.visited.has(k) ? "accent" : o.final && k && !k.startsWith(PREFIX) && !PREFIX.startsWith(k) ? "muted" : "plain"),
      edge: (k) => (pathTo.includes(k) || o.visited.has(k) ? "accent" : "line"),
    });
    items.push(rowLabel("ol", "output", -60, OY, 30));
    out.forEach((w, i) => items.push(box(`o${w}`, -50 + i * (OW + 6), OY, w, { w: OW, h: 30, tone: o.final ? "strong" : w === o.cur ? "accent" : "plain", size: 12.5 })));
    return items;
  };

  frames.push({
    caption: `To list every word starting with "${PREFIX}", first walk to its node: ${[...PREFIX].join(", then ")}. Everything below that node starts with "${PREFIX}", and nothing outside it does.`,
    items: draw({ cur: PREFIX, visited: new Set() }),
  });
  const visited = new Set<string>();
  const dfs = (k: string) => {
    visited.add(k);
    const n = nodes.get(k)!;
    if (n.end && k !== PREFIX) {
      out.push(k);
      const kids = childKeys(nodes, k);
      const prev = out[out.length - 2];
      frames.push({
        caption:
          out.length === 1
            ? `Search the subtree depth-first, trying children from a to z. The first end mark met is at ${k[k.length - 1]}: write "${k}".${kids.length ? " Its own children come next, before its siblings." : ""}`
            : k.startsWith(prev)
              ? `Depth-first goes down before it goes sideways: the ${k[k.length - 1]} below "${prev}" carries an end mark, so "${k}" is written before any sibling of "${prev}".`
              : `That branch is finished, so the search backs up to "${k.slice(0, -1)}" and tries its next child, ${k[k.length - 1]}: another end mark, so "${k}" is written.`,
        items: draw({ cur: k, visited: new Set(visited) }),
      });
    }
    for (const c of childKeys(nodes, k)) dfs(c);
  };
  dfs(PREFIX);
  const untouched = [...nodes.keys()].filter((k) => k && !k.startsWith(PREFIX) && !PREFIX.startsWith(k));
  frames.push({
    caption: `The subtree is done: ${and(out.map((w) => `"${w}"`))}, in alphabetical order because children were tried from a to z. The ${untouched.length}-node branch for "${untouched[untouched.length - 1]}" was never touched: the cost is the walk plus the subtree listed.`,
    items: draw({ visited: new Set(visited), final: true }),
  });
  return finish({ title: "Autocomplete: walk to the prefix, then list its subtree", input: `words = ${WORDS.map((w) => `"${w}"`).join(", ")}; prefix "${PREFIX}"`, frames });
}

/* ── The cost of a prefix question ────────────────────────────────── */

const commas = (k: number) => String(k).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function prefixCost(): Walkthrough {
  const L = 10;
  const c = chart("c", { w: 360, h: 180, xMax: 100, yMax: 1000, xLabel: "words stored (thousands)", yLabel: "letters compared (thousands)", xTicks: [0, 25, 50, 75, 100], yTicks: [0, 250, 500, 750, 1000] });
  const scan = (nk: number) => nk * L; // thousands of words × L letters, in thousands
  const trie = () => L / 1000;
  const items: Item[] = [
    ...c.items,
    c.curve("scan", scan, { tone: "error" }),
    c.curve("trie", trie, { tone: "accent", width: 2.4 }),
    label("sl", `check every word: N × L = ${commas(scan(100) * 1000)} at N = 100,000`, c.px(4), c.py(940), { anchor: "start", tone: "error", size: 11 }),
    label("tl", `trie: L = ${L} steps, whatever N is`, c.px(100), c.py(0) - 14, { anchor: "end", tone: "accent", size: 11 }),
  ];
  return finish({
    title: "Does any word start with p? The cost against the number of words",
    input: "",
    frames: [
      {
        caption: `With a hash set, the only way to answer a prefix question is to compare p with every stored word: up to N × L letters, a million for 100,000 words when L = ${L}. The trie walks p's ${L} letters once and is done, whether it holds ten words or ten million.`,
        items,
      },
    ],
  });
}

/* ── Walking the trie along a text ────────────────────────────────── */

function textWalk(): Walkthrough {
  const nodes = buildTrie(WORDS);
  const TEXT = "cartoon";
  const S = 32;
  const G = 4;
  const rowW = TEXT.length * (S + G) - G;
  const lay = layout(nodes, 80, 52);
  const xs = [...lay.values()].map((p) => p.x);
  const TY = S + 60;
  const at = new Map([...lay].map(([k, p]) => [k, { x: p.x + rowW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 + 30, y: p.y + TY }]));
  const FY = TY + 4 * 52 + R + 30;
  const found: string[] = [];
  const frames: Frame[] = [];

  const draw = (j: number, o: { stop?: boolean; fresh?: string }): Item[] => {
    const prefix = TEXT.slice(0, j);
    const path = new Set([...prefix].map((_, i) => prefix.slice(0, i + 1)));
    const items: Item[] = [rowLabel("tl", "text", -10, 0, S)];
    [...TEXT].forEach((ch, i) => items.push(box(`x${i}`, slotX(i, 0, S, G), 0, ch, { w: S, h: S, tone: i < j ? "accent" : o.stop && i === j ? "error" : "plain", size: 13 })));
    items.push(note("tii", "i = 0", slotMid(0, 0, S, G), S + 13, { anchor: "middle", tone: "faint", size: 10.5 }));
    if (j > 0 && !o.stop) items.push({ k: "ptr", id: "j", x: slotMid(j - 1, 0, S, G), y: -6, label: "j", tone: "accent", up: false });
    if (o.stop) items.push({ k: "ptr", id: "j", x: slotMid(j, 0, S, G), y: -6, label: "j", tone: "error", up: false });
    items.push(
      ...drawTrie(nodes, at, {
        words: true,
        wordTone: (k) => (found.includes(k) ? "accent" : "soft"),
        tone: (k) => (k === o.fresh ? "strong" : k === prefix || (k === "" && j === 0) ? "accent" : path.has(k) ? "accent" : "plain"),
        edge: (k) => (path.has(k) ? "accent" : "line"),
      }),
    );
    items.push(rowLabel("fl", "found", -10, FY, 30));
    found.forEach((w, i) => items.push(box(`f${w}`, i * 58, FY, w, { w: 52, h: 30, tone: w === o.fresh ? "strong" : "plain", size: 12.5 })));
    return items;
  };

  frames.push({
    caption: `Find every dictionary word that starts at position 0 of "${TEXT}" with one walk: step through the text's letters and the trie together, from the root.`,
    items: draw(0, {}),
  });
  let node = nodes.get("")!;
  for (let j = 0; j < TEXT.length; j++) {
    const ch = TEXT[j];
    const next = node.kids.get(ch);
    if (!next) {
      frames.push({
        caption: `"${ch}": the trie has no ${ch} below ${node.key ? `"${node.key}"` : "the root"}, so no stored word continues this way and the walk stops after ${j} letters. One walk found ${and(found.map((w) => `"${w}"`))}, in time bounded by the longest word, not the text.`,
        items: draw(j, { stop: true }),
      });
      break;
    }
    node = next;
    if (node.end) {
      found.push(node.key);
      frames.push({ caption: `"${ch}" leads to a node with an end mark: "${node.key}" is a dictionary word starting at position 0. Note it and keep walking — a longer word may follow.`, items: draw(j + 1, { fresh: node.key }) });
    } else frames.push({ caption: `"${ch}": there is a child for ${ch}${j === 0 ? " at the root" : ` below "${node.key.slice(0, -1)}"`}, so step down. No end mark yet, so "${node.key}" is not a word on its own.`, items: draw(j + 1, {}) });
  }
  return finish({ title: "Walking the trie along a text finds every word that starts there", input: `words = ${WORDS.map((w) => `"${w}"`).join(", ")}; text = "${TEXT}"`, frames });
}

/* ── The XOR trie ─────────────────────────────────────────────────── */

function xorTrie(): Walkthrough {
  const nums = [3, 10, 5, 25, 2, 8];
  const X = 5;
  const B = 5;
  const bits = (v: number) => v.toString(2).padStart(B, "0");
  const nodes = buildTrie(nums.map(bits));
  const leafOf = new Map(nums.map((v) => [bits(v), v]));
  const DX = 46;
  const DY = 44;
  const r = 12;
  const at = layout(nodes, DX, DY);
  const xs = [...at.values()].map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const PX = maxX + 46;
  const frames: Frame[] = [];
  const xorBits: string[] = [];

  const draw = (path: string[], o: { final?: boolean; want?: string }): Item[] => {
    const on = new Set(path);
    const items: Item[] = [];
    for (const [k] of nodes) if (k) items.push(link(`e${k}`, at.get(k.slice(0, -1))!, at.get(k)!, r, { tone: on.has(k) ? "accent" : "line" }));
    for (const [k] of nodes) {
      const p = at.get(k)!;
      const tone: Tone = o.final && k === path[path.length - 1] ? "strong" : on.has(k) ? "accent" : "plain";
      items.push({ k: "node", id: `t${k}`, x: p.x, y: p.y, r, text: k ? k[k.length - 1] : "", tone, size: 11 });
    }
    for (const [k, v] of leafOf) items.push(label(`n${k}`, String(v), at.get(k)!.x, at.get(k)!.y + r + 11, { tone: o.final && k === path[path.length - 1] ? "accent" : "soft", size: 11, mono: true, weight: 600 }));
    for (let d = 1; d <= B; d++) items.push(label(`b${d}`, `bit ${B - d}`, minX - r - 14, d * DY, { anchor: "end", tone: "faint", size: 10.5 }));
    items.push(label("h1", `${X}`, PX, 0, { tone: "ink", size: 11.5, weight: 600, mono: true }));
    items.push(label("h2", "xor", PX + 34, 0, { tone: "ink", size: 11.5, weight: 600, mono: true }));
    for (let d = 1; d <= B; d++) {
      items.push(label(`x${d}`, bits(X)[d - 1], PX, d * DY, { tone: "soft", size: 12, mono: true }));
      if (d <= xorBits.length) items.push(label(`y${d}`, xorBits[d - 1], PX + 34, d * DY, { tone: xorBits[d - 1] === "1" ? "accent" : "faint", size: 12, mono: true, weight: 700 }));
    }
    return items;
  };

  frames.push({
    caption: `Each number is stored as a path of ${B} bits, highest first: 0 to the left, 1 to the right. To find ${X}'s best partner (${X} = ${bits(X)}₂), walk down and take the bit opposite to ${X}'s whenever that child exists — that bit of the XOR is then 1.`,
    items: draw([""], {}),
  });
  let cur = "";
  for (let d = 1; d <= B; d++) {
    const b = B - d;
    const mine = bits(X)[d - 1];
    const want = mine === "0" ? "1" : "0";
    const on = nums.filter((v) => bits(v).startsWith(cur)).map(String);
    if (nodes.has(cur + want)) {
      cur += want;
      xorBits.push("1");
      const left = nums.filter((v) => bits(v).startsWith(cur));
      frames.push({
        caption: `Bit ${b}: ${X} has ${mine}, so a ${want} here makes this XOR bit 1, worth ${2 ** b}${b > 0 ? ` — more than all the lower bits together, ${2 ** b - 1}` : ""}. The ${want} branch exists, so take it${left.length === 1 ? `: only ${left[0]} is left on this path` : `: ${and(left.map(String))} remain`}.`,
        items: draw(["", ...[...cur].map((_, i) => cur.slice(0, i + 1))], {}),
      });
    } else {
      cur += mine;
      xorBits.push("0");
      frames.push({
        caption: `Bit ${b}: ${X} has ${mine} and wants ${want}, but ${on.length === 1 ? `the only number left, ${on[0]},` : `every number left (${and(on)})`} has ${mine} here: no choice, so this XOR bit is 0.`,
        items: draw(["", ...[...cur].map((_, i) => cur.slice(0, i + 1))], {}),
      });
    }
  }
  const partner = leafOf.get(cur)!;
  // The walk's answer, checked against every pair.
  const best = Math.max(...nums.map((y) => X ^ y));
  if ((X ^ partner) !== best) throw new Error("xor-trie: the greedy walk missed the best partner");
  frames.push({
    caption: `The walk ends at ${partner}: ${X} XOR ${partner} = ${xorBits.join("")}₂ = ${X ^ partner}, the largest XOR ${X} can make with any number here. One walk of ${B} steps per number makes the whole search O(n × B) instead of O(n²) pairs.`,
    items: draw(["", ...[...cur].map((_, i) => cur.slice(0, i + 1))], { final: true }),
  });
  return finish({ title: "The XOR trie: take the opposite bit whenever it exists", input: `nums = [${nums.join(", ")}]; best partner for ${X}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  stored,
  queries,
  autocomplete,
  "prefix-cost": prefixCost,
  "text-walk": textWalk,
  "xor-trie": xorTrie,
};
