import { finish, note, row, rowLabel, show, slotMid, slotX, spanOver, under, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "./kit.js";

/**
 * Hashing: the lesson's figures (content/roadmap/hashing.md places each
 * with "@figure <name>"). How a hash table stores keys (chaining, open
 * addressing), why it stays O(1) (resizing, and what a bad hash does),
 * and the patterns — every bucket computed with the same mod the caption
 * names, every group built by running the grouping.
 */

const small = (id: string, text: string, x: number, y: number, tone: "soft" | "faint" | "accent" = "faint"): Item => label(id, text, x, y, { mono: true, size: 10.5, tone });

/** Scanning the earlier numbers against one lookup in a map of them. */
function scanVsLookup(): Walkthrough {
  const nums = [7, 3, 9, 4, 12, 2];
  const target = 14;
  const i = nums.length - 1;
  const need = target - nums[i];
  const at = nums.indexOf(need);
  const S = { size: 40, gap: 6 };
  const items: Item[] = [];
  items.push(label("t1", "Scan: compare with every earlier number", 0, -48, { anchor: "start", size: 12.5, weight: 600, tone: "ink" }));
  items.push(rowLabel("l1", "nums", -10, 0, S.size));
  items.push(...row("a", nums, { ...S, tone: (k) => (k === i ? "accent" : k === at ? "strong" : k < at ? "muted" : "plain") }));
  items.push(under("ip", i, `need ${need}`, { ...S }));
  items.push(spanOver("sc", 0, at, `${at + 1} comparisons, more as i grows`, { ...S, tone: "line" }));
  const Y2 = 128;
  items.push(label("t2", "Hash map: look the value up", 0, Y2 - 28, { anchor: "start", size: 12.5, weight: 600, tone: "ink" }));
  // The map as value → index entries, built from the numbers before i.
  const seen = nums.slice(0, i);
  items.push(rowLabel("l2", "value", -10, Y2, 30));
  items.push(rowLabel("l3", "index", -10, Y2 + 34, 30));
  seen.forEach((v, k) => {
    items.push(box(`mv${k}`, slotX(k, 0, S.size, S.gap), Y2, v, { tone: v === need ? "strong" : "plain", w: S.size, h: 30 }));
    items.push(box(`mi${k}`, slotX(k, 0, S.size, S.gap), Y2 + 34, k, { tone: v === need ? "strong" : "plain", w: S.size, h: 30 }));
  });
  const nx = slotX(seen.length, 0, S.size, S.gap) + 30;
  items.push(note("nq", `${need}?`, nx, Y2 + 15, { weight: 600, tone: "accent" }));
  items.push(arrow("jump", { x: nx - 6, y: Y2 + 6 }, { x: slotMid(at, 0, S.size, S.gap) + 8, y: Y2 - 4 }, { tone: "accent", bow: 22 }));
  items.push(note("one", "1 lookup, whatever i is", nx, Y2 + 49, { tone: "soft", size: 12 }));
  return finish({
    title: "Have I seen the partner before? Scan against lookup",
    input: `nums = ${show(nums)}, target = ${target}`,
    frames: [
      {
        caption: `At index ${i} the partner must be ${target} − ${nums[i]} = ${need}. A scan compares with every earlier number, so over the whole array it is about n²/2 checks. A hash map of the numbers seen so far answers in one step.`,
        items,
      },
    ],
  });
}

/** Separate chaining: keys placed by key mod 8, colliding keys in a list per bucket, then a hit and a miss. */
function chaining(): Walkthrough {
  const keys = [12, 7, 20, 33, 15];
  const B = 8;
  const H = 28;
  const ROW = H + 6;
  const BW = 30;
  const KW = 38;
  const KGAP = 20;
  const chains: number[][] = Array.from({ length: B }, () => []);
  const frames: Frame[] = [];
  const keyX = (pos: number) => BW + KGAP + pos * (KW + KGAP);

  const draw = (o: { bucket?: number; hot?: number; compared?: number[]; found?: number; line: string }): Item[] => {
    const items: Item[] = [];
    for (let b = 0; b < B; b++) {
      items.push(box(`b${b}`, 0, b * ROW, b, { tone: b === o.bucket ? "accent" : chains[b].length ? "plain" : "ghost", w: BW, h: H, size: 12 }));
      chains[b].forEach((k, pos) => {
        const tone: Tone = k === o.found ? "strong" : k === o.hot ? "accent" : o.compared?.includes(k) ? "muted" : "plain";
        items.push(box(`k${k}`, keyX(pos), b * ROW, k, { tone, w: KW, h: H, size: 13 }));
        const from = pos === 0 ? BW + 2 : keyX(pos - 1) + KW + 2;
        items.push(arrow(`a${k}`, { x: from, y: b * ROW + H / 2 }, { x: keyX(pos) - 2, y: b * ROW + H / 2 }, { tone: "line" }));
      });
    }
    items.push(label("bl", "bucket", BW / 2, -14, { size: 10.5, tone: "faint" }));
    items.push(note("ln", o.line, 0, B * ROW + 14, { weight: 600, size: 12.5 }));
    return items;
  };

  frames.push({ caption: `A hash table is an ordinary array of ${B} buckets. A key's bucket is computed from the key itself — here key mod ${B} — so finding it later repeats the same sum instead of searching.`, items: draw({ line: `bucket = key mod ${B}` }) });
  for (const k of keys) {
    const b = k % B;
    const before = chains[b].length;
    chains[b].push(k);
    frames.push({
      caption: before
        ? `${k} mod ${B} = ${b}, but ${chains[b][0]} is already in bucket ${b}: a collision. Separate chaining just adds ${k} to that bucket's list.`
        : `${k} mod ${B} = ${b}, so ${k} goes into bucket ${b}.${k === keys[0] ? " Equal keys always give equal buckets — the hash must be deterministic." : ""}`,
      items: draw({ bucket: b, hot: k, line: `${k} mod ${B} = ${b}` }),
    });
  }
  const hit = 20;
  const hb = hit % B;
  const path = chains[hb].slice(0, chains[hb].indexOf(hit) + 1);
  frames.push({
    caption: `Finding ${hit}: ${hit} mod ${B} = ${hb}, then compare along bucket ${hb}'s list — ${path.length} comparisons. The keys in other buckets are never looked at.`,
    items: draw({ bucket: hb, compared: path.filter((k) => k !== hit), found: hit, line: `find ${hit}: bucket ${hb}, ${path.length} comparisons` }),
  });
  const miss = 28;
  const mb = miss % B;
  frames.push({
    caption: `Finding ${miss}: bucket ${mb} again, and neither ${and2(chains[mb])} is ${miss}, so it is not in the table. A lookup costs only the length of one list — kept short, that is O(1).`,
    items: draw({ bucket: mb, compared: chains[mb], line: `find ${miss}: bucket ${mb}, not there` }),
  });
  return finish({ title: "A hash table with separate chaining", input: `insert ${keys.join(", ")} into ${B} buckets`, frames });
}

const and2 = (xs: number[]) => (xs.length === 2 ? `${xs[0]} nor ${xs[1]}` : xs.join(", "));

/** Open addressing with linear probing: a taken slot sends the key to the next one, wrapping at the end. */
function openAddressing(): Walkthrough {
  const keys = [12, 7, 20, 33, 15];
  const B = 8;
  const slots: Array<number | null> = new Array(B).fill(null);
  const S = { size: 40, gap: 6 };
  const mid = (i: number) => slotMid(i, 0, S.size, S.gap);
  const frames: Frame[] = [];

  const draw = (o: { probes?: number[]; placed?: number; found?: number; line: string }): Item[] => {
    const items: Item[] = [rowLabel("lbl", "slots", -10, 0, S.size)];
    const rejected = new Set(o.probes?.slice(0, -1) ?? []);
    for (let i = 0; i < B; i++) items.push(box(`s${i}`, slotX(i, 0, S.size, S.gap), 0, "", { tone: rejected.has(i) ? "error" : "ghost", w: S.size, h: S.size }));
    slots.forEach((k, i) => {
      if (k === null) return;
      const tone: Tone = i === o.found ? "strong" : i === o.placed ? "accent" : rejected.has(i) ? "error" : "plain";
      items.push(box(`k${k}`, slotX(i, 0, S.size, S.gap), 0, k, { tone, w: S.size, h: S.size }));
    });
    for (let i = 0; i < B; i++) items.push(small(`i${i}`, String(i), mid(i), S.size + 13));
    (o.probes ?? []).forEach((p, j, all) => {
      if (j === 0) return;
      const from = all[j - 1];
      const wraps = p < from;
      items.push(arrow(`pr${j}`, { x: mid(from) + (wraps ? -4 : 6), y: -6 }, { x: mid(p) + (wraps ? 4 : -2), y: -6 }, { tone: "accent", bow: wraps ? 46 : -16 }));
    });
    items.push(note("ln", o.line, 0, S.size + 44, { weight: 600, size: 12.5 }));
    return items;
  };

  frames.push({ caption: `Open addressing keeps every key in the array itself — no lists. A key starts at its home slot, key mod ${B}; if that slot is taken it tries the next one, and the next, until one is free.`, items: draw({ line: `home slot = key mod ${B}` }) });
  for (const k of keys) {
    const home = k % B;
    const probes = [home];
    while (slots[probes[probes.length - 1]] !== null) probes.push((probes[probes.length - 1] + 1) % B);
    const at = probes[probes.length - 1];
    slots[at] = k;
    let caption: string;
    if (probes.length === 1) caption = `${k} mod ${B} = ${home}, and slot ${home} is free: ${k} goes there.`;
    else if (at < home) caption = `${k}'s home slot ${home} holds ${slots[home]}, and probing past the end wraps round to slot ${at}, which is free. Linear probing treats the array as a circle.`;
    else caption = `${k} mod ${B} = ${home}, but slot ${home} holds ${slots[home]}. Linear probing tries the next slot, ${at}, which is free — ${k} lives there, away from home.`;
    frames.push({ caption, items: draw({ probes, placed: at, line: probes.length === 1 ? `${k} → slot ${at}` : `${k}: tried ${probes.join(", then ")}` }) });
  }
  const find = 15;
  const probes = [find % B];
  while (slots[probes[probes.length - 1]] !== find) probes.push((probes[probes.length - 1] + 1) % B);
  frames.push({
    caption: `Finding ${find} follows the same path: slot ${probes[0]} holds ${slots[probes[0]]}, not ${find}, so step on to slot ${probes[probes.length - 1]} — found. A lookup stops at the key or at an empty slot, which proves the key is absent.`,
    items: draw({ probes, found: probes[probes.length - 1], line: `find ${find}: ${probes.length} probes` }),
  });
  return finish({ title: "Open addressing with linear probing", input: `insert ${keys.join(", ")} into ${B} slots`, frames });
}

/** Load factor and resizing: the table doubles before its lists grow, and a hash that sends every key to one bucket ruins it. */
function resize(): Walkthrough {
  const first = [5, 12, 9];
  const trigger = 16;
  const later = [27, 14];
  const LIMIT = 0.75;
  const H = 26;
  const ROW = H + 6;
  const BW = 28;
  const KW = 36;
  const KGAP = 18;
  const keyX = (pos: number) => BW + KGAP + pos * (KW + KGAP);
  const frames: Frame[] = [];

  const draw = (B: number, keys: number[], o: { hot?: number[]; bucketOf?: (k: number) => number; line: string; long?: boolean }): Item[] => {
    const bucketOf = o.bucketOf ?? ((k: number) => k % B);
    const chains: number[][] = Array.from({ length: B }, () => []);
    for (const k of keys) chains[bucketOf(k)].push(k);
    const items: Item[] = [];
    for (let b = 0; b < B; b++) {
      items.push(box(`b${b}`, 0, b * ROW, b, { tone: chains[b].length ? "plain" : "ghost", w: BW, h: H, size: 11.5 }));
      chains[b].forEach((k, pos) => {
        items.push(box(`k${k}`, keyX(pos), b * ROW, k, { tone: o.long ? "accent" : o.hot?.includes(k) ? "accent" : "plain", w: KW, h: H, size: 12.5 }));
        const from = pos === 0 ? BW + 2 : keyX(pos - 1) + KW + 2;
        items.push(arrow(`a${k}`, { x: from, y: b * ROW + H / 2 }, { x: keyX(pos) - 2, y: b * ROW + H / 2 }, { tone: "line" }));
      });
    }
    const longest = Math.max(...chains.map((c) => c.length));
    items.push(note("lf", o.line, 0, 8 * ROW + 14, { weight: 600, size: 12.5 }));
    items.push(note("lg", `longest list: ${longest}`, 0, 8 * ROW + 36, { tone: "soft", size: 12 }));
    return items;
  };

  const lf = (k: number, b: number) => `${k} keys / ${b} buckets = ${(k / b).toFixed(2)}`;
  frames.push({
    caption: `The load factor is keys divided by buckets. With ${first.length} keys in 4 buckets it is ${(first.length / 4).toFixed(2)}, and 5 and 9 already share bucket 1. More keys in the same 4 buckets would mean longer lists to search.`,
    items: draw(4, first, { hot: [5, 9], line: lf(first.length, 4) }),
  });
  const all1 = [...first, trigger];
  frames.push({
    caption: `Adding ${trigger} would push the load past ${LIMIT}, so the table doubles to 8 buckets and re-inserts every key, since each key's bucket depends on the bucket count. One resize costs O(n), but doubling makes it rare: amortised O(1).`,
    items: draw(8, all1, { hot: all1, line: lf(all1.length, 8) }),
  });
  const all2 = [...all1, ...later];
  frames.push({
    caption: `${later.join(" and ")} go in without a resize. The load stays at or below ${LIMIT}, so a lookup checks about one key on average, whatever n is: that is the O(1). Java's HashMap resizes past 0.75; C++'s unordered_map past 1.0.`,
    items: draw(8, all2, { hot: later, line: lf(all2.length, 8) }),
  });
  frames.push({
    caption: `The guarantee rests on the hash spreading keys. A hash that sent every key to bucket 0 would make one list of all n keys: each lookup O(n), and n inserts O(n²). Built-in hashes do not do this by accident — but inputs built to attack them can.`,
    items: draw(8, all2, { bucketOf: () => 0, long: true, line: "every key in bucket 0" }),
  });
  return finish({ title: "Why lookups stay O(1): resizing keeps the lists short", input: `insert ${[...first, trigger, ...later].join(", ")}, bucket = key mod buckets`, frames });
}

/** Group anagrams: each word's sorted letters is its key, and the word joins that key's list. */
function groupAnagrams(): Walkthrough {
  const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
  const keyOf = (w: string) => [...w].sort().join("");
  const W = 46;
  const GAP = 6;
  const Y0 = 96;
  const GROW = 44;
  const groups = new Map<string, number[]>();
  const frames: Frame[] = [];

  const draw = (o: { current?: number; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("lw", "words", -10, 0, W)];
    const placed = new Set([...groups.values()].flat());
    words.forEach((w, k) => {
      if (placed.has(k)) return;
      items.push(box(`w${k}`, slotX(k, 0, W, GAP), 0, w, { tone: "plain", w: W, h: 36, size: 13 }));
    });
    items.push(label("mh", "map: sorted letters → words", 0, Y0 - 24, { anchor: "start", size: 11, tone: "soft", weight: 600 }));
    [...groups.entries()].forEach(([key, members], g) => {
      const y = Y0 + g * GROW;
      const hot = o.current !== undefined && keyOf(words[o.current]) === key;
      items.push(box(`key-${key}`, 0, y, key, { tone: o.done ? "strong" : hot ? "accent" : "ghost", w: W, h: 36, size: 13 }));
      items.push(arrow(`ka-${key}`, { x: W + 2, y: y + 18 }, { x: W + 20, y: y + 18 }, { tone: "line" }));
      members.forEach((k, pos) => items.push(box(`w${k}`, W + 24 + pos * (W + GAP), y, words[k], { tone: k === o.current ? "accent" : "plain", w: W, h: 36, size: 13 })));
    });
    return items;
  };

  frames.push({
    caption: `To group anagrams, give every word a canonical key that all its anagrams share and no other word has: its letters in sorted order. Then keep a map from key to the list of words.`,
    items: draw({}),
  });
  words.forEach((w, k) => {
    const key = keyOf(w);
    const isNew = !groups.has(key);
    if (isNew) groups.set(key, []);
    groups.get(key)!.push(k);
    frames.push({
      caption: isNew ? `"${w}" sorts to "${key}", a key not seen before, so it starts a new list.` : `"${w}" sorts to "${key}" too, so it joins the list that already holds ${groups.get(key)!.slice(0, -1).map((m) => `"${words[m]}"`).join(" and ")}. One lookup, no comparing words with each other.`,
      items: draw({ current: k }),
    });
  });
  frames.push({
    caption: `Every word was handled once: ${groups.size} groups from ${words.length} words. Sorting a word of length k costs O(k log k); a key made of the 26 letter counts costs O(k) for long words.`,
    items: draw({ done: true }),
  });
  return finish({ title: "Grouping anagrams by a canonical key", input: `words = [${words.map((w) => `"${w}"`).join(", ")}]`, frames });
}

/** Longest Consecutive Sequence: only a value with no left neighbour starts a walk, so each value is touched at most twice. */
function consecutive(): Walkthrough {
  const nums = [100, 4, 200, 1, 3, 2];
  const set = new Set(nums);
  const sorted = [...nums].sort((a, b) => a - b);
  const S = { size: 40, gap: 6 };
  const Y_LINE = 104;
  const frames: Frame[] = [];
  // The number line: sorted present values, with a gap wherever they are not consecutive.
  const lineX: number[] = [];
  let x = 0;
  sorted.forEach((v, k) => {
    if (k > 0) x += sorted[k - 1] + 1 === v ? S.size + S.gap : S.size + 34;
    lineX.push(x);
  });
  const lineAt = (v: number) => lineX[sorted.indexOf(v)];
  let lookups = 0;
  let best = 0;
  let bestStart = 0;

  const draw = (o: { i?: number; run?: number[]; skipLeft?: number; done?: boolean }): Item[] => {
    const items: Item[] = [rowLabel("ln", "nums", -10, 0, S.size)];
    items.push(...row("n", nums, { ...S, tone: (k) => (k === o.i ? "accent" : "plain") }));
    if (o.i !== undefined) items.push(under("ip", o.i, "x", { ...S, tone: "ink" }));
    items.push(rowLabel("ls", "set", -10, Y_LINE, S.size));
    const bestRun = o.done ? Array.from({ length: best }, (_, k) => bestStart + k) : [];
    sorted.forEach((v) => {
      // A skipped x is out of play; its present left neighbour is the reason, so it is the one marked.
      const skipped = o.skipLeft !== undefined && o.i !== undefined && v === nums[o.i];
      const tone: Tone = bestRun.includes(v) ? "strong" : o.run?.includes(v) || v === o.skipLeft ? "accent" : skipped ? "muted" : "plain";
      items.push(box(`s${v}`, lineAt(v), Y_LINE, v, { tone, w: S.size, h: S.size }));
    });
    sorted.forEach((v, k) => {
      if (k > 0 && sorted[k - 1] + 1 !== v) items.push(label(`gap${k}`, "…", lineAt(v) - 17, Y_LINE + S.size / 2, { size: 13, tone: "faint" }));
    });
    if (o.skipLeft !== undefined && o.i !== undefined) {
      const from = lineAt(nums[o.i]);
      items.push(arrow("left", { x: from + 8, y: Y_LINE - 6 }, { x: lineAt(o.skipLeft) + S.size - 8, y: Y_LINE - 6 }, { tone: "accent", bow: 16 }));
    }
    items.push(note("lk", `set lookups so far: ${lookups}`, 0, Y_LINE + S.size + 26, { tone: "soft", size: 12 }));
    items.push(note("bs", `longest run: ${best}`, 0, Y_LINE + S.size + 48, { weight: 600 }));
    return items;
  };

  frames.push({
    caption: `Put every value in a set — drawn here on a number line, though nothing is sorted. A run of consecutive values can only begin at a value whose left neighbour, x − 1, is missing.`,
    items: draw({}),
  });
  nums.forEach((v, i) => {
    lookups++;
    if (set.has(v - 1)) {
      frames.push({ caption: `x = ${v}: ${v - 1} is in the set, so ${v} sits inside a run that starts further left. Skip it — one lookup, no walk.`, items: draw({ i, skipLeft: v - 1 }) });
      return;
    }
    const run = [v];
    lookups++;
    while (set.has(run[run.length - 1] + 1)) {
      run.push(run[run.length - 1] + 1);
      lookups++;
    }
    if (run.length > best) {
      best = run.length;
      bestStart = v;
    }
    frames.push({
      caption: run.length > 1 ? `x = ${v}: ${v - 1} is missing, so ${v} starts a run. Walk right while the next value is present: ${run.join(", ")} — length ${run.length}.` : `x = ${v}: ${v - 1} is missing, so ${v} starts a run, but ${v + 1} is missing too: length 1.`,
      items: draw({ i, run }),
    });
  });
  frames.push({
    caption: `Longest run: ${best}. ${lookups} lookups for n = ${nums.length}: each value is checked once as x and walked over at most once, inside its own run, so the total is O(n). Without the start rule, walking from every value is O(n²).`,
    items: draw({ done: true }),
  });
  return finish({ title: "Longest consecutive sequence: walk only from the start of a run", input: `nums = ${show(nums)}`, frames });
}

export const FIGURES: Readonly<Record<string, () => Walkthrough>> = {
  "scan-vs-lookup": scanVsLookup,
  chaining,
  "open-addressing": openAddressing,
  resize,
  "group-anagrams": groupAnagrams,
  consecutive,
};
