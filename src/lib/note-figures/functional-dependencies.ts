import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label } from "../lesson-figures/kit.js";

/**
 * Functional Dependencies in DBMS: the note's figures
 * (content/notes/dbms/functional-dependencies.md places each with
 * "@figure <name>"). Every figure runs the algorithm it shows on the note's
 * own example — closure, the key search, the canonical cover — and checks
 * the answers the note's text states, so the prose and the pictures cannot
 * drift apart.
 *
 *  - fd-rows: five candidate dependencies tested on four rows, by grouping
 *    the rows on the left side and looking for a pair that disagrees on the
 *    right.
 *  - armstrong: the union rule derived by applying augmentation and
 *    transitivity (each line computed from the one before and checked by
 *    closure), then two rows on which AB → C holds and A → C fails.
 *  - closure: (AG)+ under F, one dependency a frame, until a pass adds nothing.
 *  - candidate-keys: Example 2's search — singletons, then pairs, then
 *    triples, skipping supersets of keys found.
 *  - canonical-cover: extraneous attributes, redundant dependencies, union.
 */

type FD = { l: string[]; r: string[] };
const fd = (s: string): FD => {
  const [l, r] = s.split("->").map((x) => x.trim().split(""));
  return { l, r };
};
const show = (f: FD) => `${f.l.join("")} → ${f.r.join("")}`;
const setStr = (s: Iterable<string>, order: readonly string[]) => order.filter((a) => new Set(s).has(a)).join("");

/** Attribute closure: the set, and every dependency that fired, in the order the passes met them. */
function closure(start: readonly string[], fds: readonly FD[]): { set: Set<string>; steps: Array<{ i: number; added: string[]; pass: number }>; passes: number } {
  const set = new Set(start);
  const steps: Array<{ i: number; added: string[]; pass: number }> = [];
  let passes = 0;
  for (let changed = true; changed; ) {
    changed = false;
    passes++;
    fds.forEach((f, i) => {
      if (!f.l.every((a) => set.has(a))) return;
      const added = f.r.filter((a) => !set.has(a));
      added.forEach((a) => set.add(a));
      steps.push({ i, added, pass: passes });
      if (added.length) changed = true;
    });
  }
  return { set, steps, passes };
}

/** Every candidate key, by the note's method: forced attributes first, then the rest in growing combinations, skipping supersets of keys found. */
function candidateKeys(attrs: readonly string[], fds: readonly FD[]): { keys: string[][]; tested: Array<{ set: string[]; closure: string; key: boolean }>; skipped: string[][] } {
  const onLeft = new Set(fds.flatMap((f) => f.l));
  const onRight = new Set(fds.flatMap((f) => f.r));
  const forced = attrs.filter((a) => !onRight.has(a));
  const free = attrs.filter((a) => onLeft.has(a) && onRight.has(a));
  const keys: string[][] = [];
  const tested: Array<{ set: string[]; closure: string; key: boolean }> = [];
  const skipped: string[][] = [];
  const combos = (xs: readonly string[], k: number): string[][] => (k === 0 ? [[]] : xs.flatMap((x, i) => combos(xs.slice(i + 1), k - 1).map((c) => [x, ...c])));
  for (let k = 0; k <= free.length; k++)
    for (const extra of combos(free, k)) {
      const set = [...forced, ...extra];
      if (keys.some((key) => key.every((a) => set.includes(a)))) {
        skipped.push(set);
        continue;
      }
      const c = closure(set, fds).set;
      const key = attrs.every((a) => c.has(a));
      tested.push({ set, closure: setStr(c, attrs), key });
      if (key) keys.push(set);
    }
  return { keys, tested, skipped };
}

/* ── Testing dependencies on rows ─────────────────────────────────── */

function fdRows(): Walkthrough {
  const cols = ["roll_no", "name", "course_id", "grade"];
  const W: Record<string, number> = { roll_no: 60, name: 66, course_id: 76, grade: 54 };
  const rows = [
    ["101", "Asha", "CS301", "A"],
    ["101", "Asha", "CS302", "B"],
    ["102", "Vikram", "CS301", "A"],
    ["103", "Asha", "CS302", "B"],
  ].map((v) => Object.fromEntries(cols.map((c, i) => [c, v[i]])));
  // The college's rules, and two dependencies that are not rules.
  const tests: Array<{ x: string[]; y: string[]; rule: boolean }> = [
    { x: ["roll_no"], y: ["name"], rule: true },
    { x: ["name"], y: ["roll_no"], rule: false },
    { x: ["roll_no"], y: ["grade"], rule: false },
    { x: ["roll_no", "course_id"], y: ["grade"], rule: true },
    { x: ["course_id"], y: ["grade"], rule: false },
  ];
  /** The first pair of rows that agree on x and differ on y, or null. */
  const breach = (x: string[], y: string[]): [number, number] | null => {
    for (let i = 0; i < rows.length; i++)
      for (let j = i + 1; j < rows.length; j++)
        if (x.every((c) => rows[i][c] === rows[j][c]) && y.some((c) => rows[i][c] !== rows[j][c])) return [i, j];
    return null;
  };
  const xs: number[] = [];
  let at = 0;
  for (const c of cols) {
    xs.push(at);
    at += W[c] + 3;
  }
  /** Rows that share their x values with another row: the ones a dependency on x says something about. */
  const shared = (x: string[]) => new Set(rows.flatMap((r, i) => (rows.some((o, j) => j !== i && x.every((c) => o[c] === r[c])) ? [i] : [])));
  const frames: Frame[] = tests.map((t) => {
    const b = breach(t.x, t.y);
    const twins = shared(t.x);
    if (t.rule && b) throw new Error(`fd-rows: the rule ${t.x.join(",")} → ${t.y.join(",")} is broken by the rows`);
    const items: Item[] = [label("fd", `${t.x.join(", ")} → ${t.y.join(", ")}`, at / 2, -48, { tone: "ink", size: 13, mono: true, weight: 700 })];
    cols.forEach((c, k) => items.push(label(`h-${c}`, c, xs[k] + W[c] / 2, -14, { tone: t.x.includes(c) ? "accent" : t.y.includes(c) ? "ink" : "faint", size: 10.5, mono: true, weight: t.x.includes(c) || t.y.includes(c) ? 700 : undefined })));
    rows.forEach((r, i) =>
      cols.forEach((c, k) => {
        const inPair = b !== null ? b.includes(i) : twins.has(i);
        const tone: Tone = t.x.includes(c) ? (inPair ? "accent" : "plain") : t.y.includes(c) ? (inPair ? (b ? "error" : "accent") : "plain") : "muted";
        items.push(box(`c${i}-${c}`, xs[k], i * 27, r[c], { w: W[c], h: 24, size: 11.5, tone }));
      }),
    );
    const verdict = b ? `violated by rows ${b[0] + 1} and ${b[1] + 1}` : t.rule ? "holds, and it is a rule" : "holds here, by coincidence";
    items.push(label("v", verdict, at / 2, 4 * 27 + 14, { tone: b ? "error" : t.rule ? "accent" : "soft", size: 12, weight: 600 }));
    const lhs = t.x.join(", ");
    const caption = b
      ? `${lhs} → ${t.y.join(", ")} is not a dependency: rows ${b[0] + 1} and ${b[1] + 1} agree on ${lhs} (${t.x.map((c) => rows[b[0]][c]).join(", ")}) but differ on ${t.y.join(", ")}. One such pair disproves it for good.`
      : t.rule && twins.size === 0
        ? `No two rows share a (${lhs}) pair, so nothing here can contradict ${lhs} → ${t.y.join(", ")}. It holds because of the college's rule, not because of these rows.`
        : t.rule
        ? `${lhs} → ${t.y.join(", ")}: the rows that agree on ${lhs} also agree on ${t.y.join(", ")}. The rows are consistent with it, and the college's rules say it always holds.`
        : `${lhs} → ${t.y.join(", ")} holds in these four rows by coincidence. No rule says every student in a course gets the same grade, so the next row may break it: data can only disprove a dependency.`;
    return { caption, items };
  });
  return finish({ title: "Testing candidate dependencies against rows", input: "four enrolment rows", frames });
}

/* ── Armstrong's axioms ───────────────────────────────────────────── */

function armstrong(): Walkthrough {
  const F = [fd("X -> Y"), fd("X -> Z")];
  const uniq = (xs: string[]) => [...new Set(xs)].sort();
  const augment = (f: FD, z: string[]): FD => ({ l: uniq([...f.l, ...z]), r: uniq([...f.r, ...z]) });
  const transit = (f: FD, g: FD): FD => {
    if (setStr(f.r, ["X", "Y", "Z"]) !== setStr(g.l, ["X", "Y", "Z"])) throw new Error("armstrong: transitivity needs f's right side to be g's left side");
    return { l: f.l, r: g.r };
  };
  const s1 = augment(F[0], ["X"]);
  const s2 = augment(F[1], ["Y"]);
  const s3 = transit(s1, s2);
  // Every line must follow from F (closure), and the last must be the union.
  for (const f of [s1, s2, s3]) {
    const c = closure(f.l, F).set;
    if (!f.r.every((a) => c.has(a))) throw new Error(`armstrong: ${show(f)} does not follow from F`);
  }
  if (show(s3) !== "X → YZ") throw new Error(`armstrong: derived ${show(s3)}, expected X → YZ`);
  const BW = 104;
  const BH = 30;
  const items: Item[] = [];
  const node = (id: string, x: number, y: number, f: FD, tone: Tone) => items.push(box(id, x, y, show(f), { w: BW, h: BH, size: 13, tone }));
  const step = (id: string, from: { x: number; y: number }, to: { x: number; y: number }, text: string) => {
    items.push(arrow(id, { x: from.x + BW / 2, y: from.y + BH + 1 }, { x: to.x + BW / 2, y: to.y - 2 }, { tone: "line" }));
    items.push(label(`${id}-t`, text, (from.x + to.x) / 2 + BW / 2 + (from.x < to.x ? -6 : from.x > to.x ? 6 : 8), (from.y + BH + to.y) / 2, { anchor: from.x > to.x ? "start" : from.x < to.x ? "end" : "start", tone: "soft", size: 11 }));
  };
  const P = [{ x: 0, y: 0 }, { x: 236, y: 0 }];
  const S = [{ x: 0, y: 84 }, { x: 236, y: 84 }];
  const T = { x: 118, y: 168 };
  node("p0", P[0].x, P[0].y, F[0], "plain");
  node("p1", P[1].x, P[1].y, F[1], "plain");
  step("a0", P[0], S[0], "augment by X");
  step("a1", P[1], S[1], "augment by Y");
  node("s0", S[0].x, S[0].y, s1, "accent");
  node("s1", S[1].x, S[1].y, s2, "accent");
  items.push(arrow("t0", { x: S[0].x + BW / 2, y: S[0].y + BH + 1 }, { x: T.x + 24, y: T.y - 2 }, { tone: "line" }));
  items.push(arrow("t1", { x: S[1].x + BW / 2, y: S[1].y + BH + 1 }, { x: T.x + BW - 24, y: T.y - 2 }, { tone: "line" }));
  items.push(label("tt", "transitivity", T.x + BW / 2, T.y - 22, { tone: "soft", size: 11 }));
  node("r", T.x, T.y, s3, "strong");
  items.push(label("given", "given", P[1].x + BW + 10, BH / 2, { anchor: "start", tone: "faint", size: 11 }));
  items.push(label("union", "the union rule", T.x + BW + 10, T.y + BH / 2, { anchor: "start", tone: "accent", size: 11.5, weight: 600 }));

  // The trap: decomposition splits right sides only. Two rows where AB → C holds and A → C does not.
  const rows = [
    { A: "a1", B: "b1", C: "c1" },
    { A: "a1", B: "b2", C: "c2" },
  ];
  const holds = (x: Array<"A" | "B" | "C">, y: "C") => !(x.every((c) => rows[0][c] === rows[1][c]) && rows[0][y] !== rows[1][y]);
  if (!holds(["A", "B"], "C") || holds(["A"], "C")) throw new Error("armstrong: the rows should satisfy AB → C and break A → C");
  const trap: Item[] = [];
  const TX = 34;
  const TY = 30;
  (["A", "B", "C"] as const).forEach((c, k) => {
    trap.push(label(`th${c}`, c, TX + k * 57 + 27, TY - 14, { tone: c === "A" ? "accent" : c === "C" ? "error" : "faint", size: 11, mono: true, weight: 700 }));
    rows.forEach((r, i) => trap.push(box(`tc${i}${c}`, TX + k * 57, TY + i * 29, r[c], { w: 54, h: 26, size: 12, tone: c === "A" ? "accent" : c === "C" ? "error" : "plain" })));
  });
  trap.push(label("n1", "AB → C holds: the two AB pairs differ", 220, TY + 6, { anchor: "start", tone: "accent", size: 11.5 }));
  trap.push(label("n2", "A → C fails: a1 gives c1 and c2", 220, TY + 38, { anchor: "start", tone: "error", size: 11.5 }));
  return finish({
    title: "Armstrong's axioms: proving the union rule, and a split they forbid",
    input: "F = {X → Y, X → Z}",
    frames: [
      {
        caption: `Augment X → Y by X to get ${show(s1)}, and X → Z by Y to get ${show(s2)}. The right side of the first is the left side of the second, so transitivity gives ${show(s3)}: the union rule, built from the three axioms alone.`,
        items,
      },
      {
        caption: "Decomposition splits a right side, never a left one. These two rows satisfy AB → C, because no two rows share A and B, yet they break A → C: the same a1 gives c1 and c2.",
        items: trap,
      },
    ],
  });
}

/* ── Attribute closure ────────────────────────────────────────────── */

const R1 = ["A", "B", "C", "G", "H", "I"];
const F1 = ["A -> B", "A -> C", "CG -> H", "CG -> I", "B -> H"].map(fd);

function closureFigure(): Walkthrough {
  const start = ["A", "G"];
  const run = closure(start, F1);
  if (setStr(run.set, R1) !== "ABCGHI") throw new Error(`closure: (AG)+ = ${setStr(run.set, R1)}, the note says ABCGHI`);
  const aPlus = setStr(closure(["A"], F1).set, R1);
  const gPlus = setStr(closure(["G"], F1).set, R1);
  const bPlus = setStr(closure(["B"], F1).set, R1);
  if (aPlus !== "ABCH" || gPlus !== "G" || bPlus !== "BH") throw new Error(`closure: A+ ${aPlus}, G+ ${gPlus}, B+ ${bPlus} disagree with the note`);
  const FX = 0;
  const FW = 96;
  const RX = 150;
  const S = 38;
  const items = (o: { cur?: number; done: Set<number>; idle: Set<number>; have: Set<string>; fresh: string[]; extra?: Item[] }): Item[] => {
    const out: Item[] = [label("fl", "F", FX + FW / 2, -16, { tone: "faint", size: 11, weight: 600 })];
    F1.forEach((f, i) => out.push(box(`f${i}`, FX, i * 34, show(f), { w: FW, h: 28, size: 12.5, tone: i === o.cur ? (o.fresh.length ? "accent" : "muted") : o.done.has(i) ? "plain" : o.idle.has(i) ? "muted" : "plain" })));
    out.push(label("rl", "(AG)+", RX, -16, { anchor: "start", tone: "faint", size: 11, weight: 600 }));
    R1.forEach((a, k) => out.push(box(`a${a}`, RX + k * (S + 5), 20, a, { w: S, h: S, size: 15, tone: o.fresh.includes(a) ? "accent" : o.have.has(a) ? "strong" : "plain" })));
    out.push(...(o.extra ?? []));
    return out;
  };
  const have = new Set(start);
  const frames: Frame[] = [
    {
      caption: "Start with the set itself: (AG)+ begins as {A, G}. Then go down F again and again; a dependency fires when its whole left side is already inside the set, and adds its right side.",
      items: items({ done: new Set(), idle: new Set(), have, fresh: [] }),
    },
  ];
  const done = new Set<number>();
  const idle = new Set<number>();
  for (const s of run.steps.filter((x) => x.pass === 1)) {
    const f = F1[s.i];
    s.added.forEach((a) => have.add(a));
    const why = f.l.length > 1 ? `${f.l.join(" and ")} are both inside` : `${f.l[0]} is inside`;
    frames.push({
      caption: s.added.length ? `${show(f)} fires because ${why}: add ${s.added.join(", ")}. The set is now {${setStr(have, R1).split("").join(", ")}}.` : `${show(f)} could fire, but ${f.r.join("")} is already in the set, so it adds nothing new.`,
      items: items({ cur: s.i, done, idle, have, fresh: s.added }),
    });
    (s.added.length ? done : idle).add(s.i);
  }
  if (run.passes !== 2) throw new Error(`closure: expected a second pass that adds nothing, got ${run.passes} passes`);
  const sub = (y: number, name: string, value: string): Item[] => [
    label(`${name}l`, `${name}+`, RX, y + 13, { anchor: "start", tone: "soft", size: 11.5, mono: true, weight: 600 }),
    ...R1.map((a, k): Item => box(`${name}${a}`, RX + 40 + k * 31, y, a, { w: 27, h: 26, size: 12, tone: value.includes(a) ? "accent" : "muted" })),
  ];
  frames.push({
    caption: `A second pass changes nothing, so the loop stops: (AG)+ = ${setStr(have, R1)}, every attribute, so AG is a super key. Neither part is: A+ = ${aPlus} and G+ = ${gPlus}, so AG is a candidate key.`,
    items: items({ done, idle, have, fresh: [], extra: [...sub(78, "A", aPlus), ...sub(112, "G", gPlus)] }),
  });
  return finish({ title: "Computing the closure (AG)+, one dependency at a time", input: "R(A, B, C, G, H, I), F = {A → B, A → C, CG → H, CG → I, B → H}", frames });
}

/* ── Finding every candidate key ──────────────────────────────────── */

function candidateKeysFigure(): Walkthrough {
  const R = ["A", "B", "C", "D", "E"];
  const F = ["A -> BC", "CD -> E", "B -> D", "E -> A"].map(fd);
  const found = candidateKeys(R, F);
  const keyNames = found.keys.map((k) => k.join(""));
  if (keyNames.join(",") !== "A,E,BC,CD") throw new Error(`candidate-keys: found ${keyNames.join(",")}, the note says A, E, BC, CD`);
  // The interview question's relation, checked by the same search.
  const iq = candidateKeys(["A", "B", "C", "D"], ["AB -> C", "C -> D", "D -> A"].map(fd)).keys.map((k) => [...k].sort().join(""));
  if (iq.sort().join(",") !== "AB,BC,BD") throw new Error(`candidate-keys: the interview question's keys are ${iq.join(",")}, the note says AB, BC, BD`);
  const onLeft = new Set(F.flatMap((f) => f.l));
  const onRight = new Set(F.flatMap((f) => f.r));
  if (!R.every((a) => onLeft.has(a) && onRight.has(a))) throw new Error("candidate-keys: every attribute should appear on both sides");

  const combos = (k: number, xs = R): string[][] => (k === 0 ? [[]] : xs.flatMap((x, i) => combos(k - 1, xs.slice(i + 1)).map((c) => [x, ...c])));
  const rowsBySize = [1, 2, 3].map((k) => combos(k));
  const W = 44;
  const H = 26;
  const G = 5;
  const RG = 30;
  const widest = 10 * (W + G) - G;
  const tested = new Map(found.tested.map((t) => [t.set.join(""), t]));
  const skipped = new Set(found.skipped.map((s) => s.join("")));
  const draw = (upTo: number): Item[] => {
    const items: Item[] = [label("fds", "F = {A → BC, CD → E, B → D, E → A}", widest / 2, -26, { tone: "soft", size: 11.5, mono: true })];
    rowsBySize.forEach((row, r) => {
      const x0 = (widest - (row.length * (W + G) - G)) / 2;
      const y = r * (H + RG);
      items.push(label(`sz${r}`, `${r + 1}`, -14, y + H / 2, { tone: "faint", size: 10.5, mono: true }));
      row.forEach((set, i) => {
        const n = set.join("");
        const t = tested.get(n);
        const live = r <= upTo;
        const tone: Tone = !live ? "plain" : t ? (t.key ? "strong" : "muted") : skipped.has(n) ? "ghost" : "plain";
        items.push(box(`s${n}`, x0 + i * (W + G), y, n, { w: W, h: H, size: 12, tone }));
        if (live && t) items.push(label(`c${n}`, `+ ${t.closure}`, x0 + i * (W + G) + W / 2, y + H + 9, { tone: t.key ? "accent" : "faint", size: 10, mono: true }));
      });
    });
    return items;
  };
  const single = found.tested.filter((t) => t.set.length === 1);
  const pairs = found.tested.filter((t) => t.set.length === 2);
  const tripleSkips = found.skipped.filter((s) => s.length === 3 && !s.includes("A") && !s.includes("E"));
  const frames: Frame[] = [
    {
      caption: `Every attribute appears on both sides of some dependency, so none is forced into the key and none is ruled out. Test sets by size: ${single.map((t) => `${t.set.join("")}+ = ${t.closure}`).join(", ")}. A and E reach everything.`,
      items: draw(0),
    },
    {
      caption: `A pair containing A or E holds a key already, so it cannot be minimal and is skipped (dashed). Of the other three, ${pairs.filter((t) => t.key).map((t) => t.set.join("")).join(" and ")} reach everything and ${pairs.filter((t) => !t.key).map((t) => t.set.join("")).join(", ")} does not.`,
      items: draw(1),
    },
    {
      caption: `Every triple contains a key found already — the only one without A or E, ${tripleSkips.map((s) => s.join("")).join("")}, contains BC — so the search stops. The candidate keys are ${keyNames.join(", ")}, and every attribute is prime.`,
      items: draw(2),
    },
  ];
  return finish({ title: "Finding every candidate key of R(A, B, C, D, E)", input: "F = {A → BC, CD → E, B → D, E → A}", frames });
}

/* ── Canonical cover ──────────────────────────────────────────────── */

function canonicalCover(): Walkthrough {
  const R = ["A", "B", "C", "D"];
  const original = ["A -> B", "AB -> C", "C -> D", "A -> D"].map(fd);
  type Row = { f: FD; id: string; state: "live" | "gone" };
  // Step 1: single attributes on the right (already so here; split anyway).
  const rows: Row[] = original.flatMap((f, i) => f.r.map((a, k) => ({ f: { l: [...f.l], r: [a] }, id: `d${i}-${k}`, state: "live" as const })));
  if (rows.length !== original.length) throw new Error("canonical-cover: the right sides were expected to be single already");
  const live = () => rows.filter((r) => r.state === "live").map((r) => r.f);
  const frames: Frame[] = [];
  const LW = 92;
  const TX = 136;
  const draw = (o: { cur?: string; tone?: Tone; test: string; set?: string; hit?: string; verdict?: string; verdictTone?: "accent" | "error" | "soft" }): Item[] => {
    const items: Item[] = [label("fh", "F", LW / 2, -16, { tone: "faint", size: 11, weight: 600 })];
    rows.forEach((r, i) => items.push(box(r.id, 0, i * 34, show(r.f), { w: LW, h: 28, size: 12.5, tone: r.id === o.cur ? (o.tone ?? "accent") : r.state === "gone" ? "muted" : "plain" })));
    items.push(label("q", o.test, TX, 4, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
    const set = o.set;
    if (set !== undefined) R.forEach((a, k) => items.push(box(`x${a}`, TX + k * 36, 26, a, { w: 32, h: 30, size: 13, tone: a === o.hit ? (set.includes(a) ? "accent" : "error") : set.includes(a) ? "strong" : "plain" })));
    if (o.verdict) items.push(label("v", o.verdict, TX, 76, { anchor: "start", tone: o.verdictTone ?? "soft", size: 12, weight: 600 }));
    return items;
  };
  frames.push({
    caption: "Start from F. Every right side is already a single attribute, so step 1 changes nothing. Step 2 looks for extraneous attributes on left sides; only AB → C has two.",
    items: draw({ test: "F = {A → B, AB → C, C → D, A → D}" }),
  });
  // Step 2: an attribute a of the left side is extraneous if the rest of the left side, under all of F, still reaches the right side.
  for (const row of rows.filter((r) => r.f.l.length > 1)) {
    for (const a of [...row.f.l]) {
      if (row.f.l.length < 2) break;
      const rest = row.f.l.filter((b) => b !== a);
      const c = setStr(closure(rest, live()).set, R);
      const target = row.f.r[0];
      const extraneous = c.includes(target);
      const before = show(row.f);
      if (extraneous) row.f = { l: rest, r: row.f.r };
      frames.push({
        caption: extraneous
          ? `Is ${a} extraneous in ${before}? Without it the left side is ${rest.join("")}, and ${rest.join("")}+ under all of F is ${c}, which contains ${target}. So ${a} is extraneous: ${before} becomes ${show(row.f)}.`
          : `Is ${a} extraneous in ${before}? Without it the left side is ${rest.join("")}, and ${rest.join("")}+ under all of F is only ${c}, which lacks ${target}. ${a} stays.`,
        items: draw({ cur: row.id, test: `${rest.join("")}+ under all of F`, set: c, hit: target, verdict: extraneous ? `${a} is extraneous: ${show(row.f)}` : `keep ${a}`, verdictTone: extraneous ? "accent" : "soft" }),
      });
    }
  }
  // Step 3: a dependency is redundant if its left side reaches its right side without it.
  for (const row of rows) {
    const others = rows.filter((r) => r !== row && r.state === "live").map((r) => r.f);
    const c = setStr(closure(row.f.l, others).set, R);
    const target = row.f.r[0];
    const redundant = c.includes(target);
    if (redundant) row.state = "gone";
    frames.push({
      caption: redundant
        ? `Is ${show(row.f)} redundant? Without it, ${row.f.l.join("")}+ is still ${c}, which contains ${target}, so the other dependencies imply it. Delete it.`
        : `Is ${show(row.f)} redundant? Without it, ${row.f.l.join("")}+ is only ${c}, with no ${target}. Nothing else implies it, so it stays.`,
      items: draw({ cur: row.id, tone: redundant ? "error" : "accent", test: `${row.f.l.join("")}+ without ${show(row.f)}`, set: c, hit: target, verdict: redundant ? "redundant: delete" : "needed: keep", verdictTone: redundant ? "error" : "soft" }),
    });
  }
  const minimal = live();
  if (minimal.map(show).join(", ") !== "A → B, A → C, C → D") throw new Error(`canonical-cover: minimal cover ${minimal.map(show).join(", ")}, the note says A → B, A → C, C → D`);
  // Step 4: union of dependencies with the same left side.
  const byLeft = new Map<string, string[]>();
  for (const f of minimal) byLeft.set(f.l.join(""), [...(byLeft.get(f.l.join("")) ?? []), ...f.r]);
  const canonical = [...byLeft].map(([l, r]) => ({ l: l.split(""), r }));
  if (canonical.map(show).join(", ") !== "A → BC, C → D") throw new Error(`canonical-cover: ${canonical.map(show).join(", ")}, the note says A → BC, C → D`);
  // Equivalence: every original dependency follows from the cover.
  for (const f of original) if (!f.r.every((a) => closure(f.l, canonical).set.has(a))) throw new Error(`canonical-cover: ${show(f)} does not follow from the cover`);
  const aPlus = setStr(closure(["A"], canonical).set, R);
  const final: Item[] = [label("fh", "canonical cover", 0, -16, { anchor: "start", tone: "faint", size: 11, weight: 600 })];
  canonical.forEach((f, i) => final.push(box(`k${i}`, 0, i * 34, show(f), { w: LW, h: 28, size: 12.5, tone: "strong" })));
  final.push(label("q", "check: A+ under the cover", TX, 4, { anchor: "start", tone: "ink", size: 12, weight: 600 }));
  R.forEach((a, k) => final.push(box(`x${a}`, TX + k * 36, 26, a, { w: 32, h: 30, size: 13, tone: aPlus.includes(a) ? "strong" : "plain" })));
  final.push(label("v", "every original dependency follows", TX, 76, { anchor: "start", tone: "accent", size: 12, weight: 600 }));
  frames.push({
    caption: `The minimal cover is ${minimal.map(show).join(", ")}. Joining the two with left side A gives the canonical cover {${canonical.map(show).join(", ")}}, and A+ = ${aPlus} under it confirms every original dependency still follows.`,
    items: final,
  });
  return finish({ title: "Computing a canonical cover", input: "R(A, B, C, D), F = {A → B, AB → C, C → D, A → D}", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "fd-rows": fdRows,
  armstrong,
  closure: closureFigure,
  "candidate-keys": candidateKeysFigure,
  "canonical-cover": canonicalCover,
};
