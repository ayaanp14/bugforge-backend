import { finish, type Frame, type Item, type TextTone, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";

/**
 * Object Equality, Hashing and Copying: the note's figures
 * (content/notes/oop/object-equality-and-copying.md places each with
 * "@figure <name>"). Everything is run on small models of the JVM, CPython
 * or C++ memory, and the drawn answers come out of those runs:
 *
 *  - identity: == against equals() on the note's two Points, then the string
 *    pool (literals interned, new String not) and Integer.valueOf's cache of
 *    -128..127 — each == answered by comparing the model's object ids;
 *  - hash-lookup: a HashSet's 16 buckets with Java's own arithmetic —
 *    Objects.hash, String.hashCode, HashMap's h ^ (h >>> 16) and the
 *    (n − 1) & hash index — for the note's points and the "Aa"/"BB" collision;
 *  - shallow-deep: the note's Team program step by step on a model heap,
 *    its printed lines checked against the note's output fence;
 *  - copy-and-swap: the C++ Buffer program on a model of stack objects and
 *    heap arrays — the default member-wise copy (two owners of one array),
 *    the user-written copy constructor, and operator= by copy-and-swap, with
 *    its printed log checked against the note's output.
 */

const HEAD = 22;
const ROW = 20;

/** An object: a header with its name, then one row per field (mono). */
function objectBox(id: string, x: number, y: number, title: string, rows: readonly string[], o: { w: number; tone?: Tone; rowTone?: (i: number) => TextTone | undefined }) {
  const tone = o.tone ?? "plain";
  const h = HEAD + rows.length * ROW + (rows.length ? 4 : 0);
  const items: Item[] = [{ k: "cell", id, x, y, w: o.w, h, text: "", tone }];
  items.push({ k: "text", id: `${id}-n`, x: x + o.w / 2, y: y + HEAD / 2 + 1, text: title, tone: tone === "muted" ? "faint" : "ink", anchor: "middle", size: 12, mono: false, weight: 700 });
  if (rows.length) items.push({ k: "path", id: `${id}-d`, pts: [[x, y + HEAD], [x + o.w, y + HEAD]], tone: "line", width: 1 });
  const rowMid = (i: number) => y + HEAD + 2 + ROW / 2 + i * ROW;
  rows.forEach((r, i) => items.push({ k: "text", id: `${id}-r${i}`, x: x + 8, y: rowMid(i), text: r, tone: tone === "muted" ? "faint" : (o.rowTone?.(i) ?? "ink"), anchor: "start", size: 11.5, mono: true }));
  return { items, h, rowMid, left: x, right: x + o.w, top: y, bottom: y + h };
}

/** Where the dot of a reference row ("players ●") sits: after `chars` characters of 11.5 px mono. */
const dotAt = (left: number, chars: number) => left + 8 + chars * 11.5 * 0.6 + 3.5;

/** A variable: its name and a box holding a reference dot. */
function variable(id: string, name: string, x: number, y: number, tone: Tone = "plain"): Item[] {
  return [label(`${id}-n`, name, x + 54, y + 11, { anchor: "end", tone: "ink", size: 12, mono: true }), box(id, x + 60, y, "●", { w: 22, h: 22, size: 11, tone })];
}

function results(prefix: string, rows: ReadonlyArray<{ expr: string; value: boolean }>, x: number, y: number): Item[] {
  const col = x + Math.max(...rows.map((r) => r.expr.length)) * 11.5 * 0.6 + 16;
  return rows.flatMap((r, i) => [
    { k: "text", id: `${prefix}${i}`, x, y: y + i * 18, text: r.expr, tone: "ink", anchor: "start", size: 11.5, mono: true } as Item,
    { k: "text", id: `${prefix}v${i}`, x: col, y: y + i * 18, text: String(r.value), tone: r.value ? "accent" : "error", anchor: "start", size: 11.5, mono: true, weight: 700 } as Item,
  ]);
}

/* ── identity: == against equals ──────────────────────────────────── */

/** A model JVM heap: objects get ids in allocation order; == compares ids, equals compares values. */
class Jvm {
  objs: Array<{ id: number; cls: string; value: string }> = [];
  pool = new Map<string, number>();
  cache = new Map<number, number>();
  alloc(cls: string, value: string) {
    const o = { id: this.objs.length, cls, value };
    this.objs.push(o);
    return o.id;
  }
  /** A string literal: interned, one shared object per distinct text. */
  literal(s: string) {
    if (!this.pool.has(s)) this.pool.set(s, this.alloc("String", s));
    return this.pool.get(s)!;
  }
  /** Integer.valueOf, which autoboxing calls: cached objects for -128..127, a new one otherwise. */
  valueOf(n: number) {
    if (n >= -128 && n <= 127) {
      if (!this.cache.has(n)) this.cache.set(n, this.alloc("Integer", String(n)));
      return this.cache.get(n)!;
    }
    return this.alloc("Integer", String(n));
  }
  same = (a: number, b: number) => a === b;
  equal = (a: number, b: number) => this.objs[a].cls === this.objs[b].cls && this.objs[a].value === this.objs[b].value;
}

function identity(): Walkthrough {
  // Frame 1: Point p = new Point(1, 2), q = new Point(1, 2).
  const j1 = new Jvm();
  const p = j1.alloc("Point", "x = 1, y = 2");
  const q = j1.alloc("Point", "x = 1, y = 2");
  if (j1.same(p, q) || !j1.equal(p, q)) throw new Error("identity: two new points are equal but not the same");
  // Frame 2: two literals and a new String.
  const j2 = new Jvm();
  const s1 = j2.literal("hi");
  const s2 = j2.literal("hi");
  const s3 = j2.alloc("String", "hi"); // new String("hi") always allocates
  if (!j2.same(s1, s2) || j2.same(s3, s1) || !j2.equal(s3, s1)) throw new Error("identity: string pool model disagrees with the note");
  // Frame 3: Integer a = 127, b = 127; Integer c = 128, d = 128.
  const j3 = new Jvm();
  const a = j3.valueOf(127);
  const b = j3.valueOf(127);
  const c = j3.valueOf(128);
  const d = j3.valueOf(128);
  if (!j3.same(a, b) || j3.same(c, d) || !j3.equal(c, d)) throw new Error("identity: Integer cache model disagrees with the note");

  const VX = 0;
  const OX = 160;
  /** Variables down the left, each pointing at its object; objects listed by id, `regions` boxing some of them. */
  const draw = (j: Jvm, vars: Array<[string, number]>, objW: number, regions: Array<{ ids: number[]; text: string }>, lines: Array<{ expr: string; value: boolean }>): Item[] => {
    const items: Item[] = [];
    const objY = new Map<number, number>();
    let y = 0;
    j.objs.forEach((o) => {
      objY.set(o.id, y);
      y += 64;
    });
    // Variables sit level with their target, spread when several share one.
    const seen = new Map<number, number>();
    const varY = vars.map(([, id]) => {
      const k = seen.get(id) ?? 0;
      seen.set(id, k + 1);
      return objY.get(id)! + k * 30 - 4;
    });
    for (const r of regions) {
      const top = Math.min(...r.ids.map((id) => objY.get(id)!));
      const bottom = Math.max(...r.ids.map((id) => objY.get(id)!)) + 44;
      items.push(...region(`rg${r.ids[0]}`, OX - 10, top - 10, objW + 20, bottom - top + 20, r.text));
    }
    j.objs.forEach((o) => {
      const b = objectBox(`o${o.id}`, OX, objY.get(o.id)!, `${o.cls} #${o.id + 1}`, [o.cls === "String" ? `"${o.value}"` : o.value], { w: objW });
      items.push(...b.items);
    });
    vars.forEach(([name, id], i) => {
      items.push(...variable(`v${i}`, name, VX, varY[i]));
      items.push(arrow(`a${i}`, { x: VX + 84, y: varY[i] + 11 }, { x: OX - 2, y: objY.get(id)! + 22 }, { tone: "ink" }));
    });
    items.push(...results("res", lines, VX, y + 18));
    return items;
  };
  return finish({
    title: "Identity (==) against equality (equals)",
    input: "",
    frames: [
      {
        caption: "Two new Point(1, 2) calls make two objects. p == q compares the references, which differ, so it is false; p.equals(q) compares the fields the class chose, so it is true.",
        items: draw(j1, [["p", p], ["q", q]], 124, [], [
          { expr: "p == q", value: j1.same(p, q) },
          { expr: "p.equals(q)", value: j1.equal(p, q) },
        ]),
      },
      {
        caption: "String literals are interned: every \"hi\" in the program is one shared object in the pool, so s1 == s2 is true. new String(\"hi\") always builds another object, so == fails where equals still succeeds.",
        items: draw(j2, [["s1", s1], ["s2", s2], ["s3", s3]], 124, [{ ids: [s1], text: "string pool" }], [
          { expr: "s1 == s2", value: j2.same(s1, s2) },
          { expr: "s3 == s1", value: j2.same(s3, s1) },
          { expr: "s3.equals(s1)", value: j2.equal(s3, s1) },
        ]),
      },
      {
        caption: "Autoboxing calls Integer.valueOf, which hands out one cached object for each value from -128 to 127. Both 127s get the cached one, so a == b; each 128 is a new object, so c == d is false.",
        items: draw(j3, [["a", a], ["b", b], ["c", c], ["d", d]], 124, [{ ids: [a], text: "Integer cache (-128 to 127)" }], [
          { expr: "a == b", value: j3.same(a, b) },
          { expr: "c == d", value: j3.same(c, d) },
        ]),
      },
    ],
  });
}

/* ── hash-lookup: buckets, then equals ────────────────────────────── */

const toInt32 = (n: number) => n | 0;
/** Java's Arrays.hashCode / Objects.hash over ints. */
const objectsHash = (...xs: number[]) => xs.reduce((h, x) => toInt32(31 * h + x), 1);
/** Java's String.hashCode: s[0]·31^(n−1) + … + s[n−1], in 32-bit arithmetic. */
const stringHash = (s: string) => [...s].reduce((h, ch) => toInt32(31 * h + ch.charCodeAt(0)), 0);
/** HashMap.hash spreads the high bits down; the bucket is (n − 1) & hash. */
const bucketOf = (h: number, n: number) => (h ^ (h >>> 16)) & (n - 1);

function hashLookup(): Walkthrough {
  const N = 16; // HashMap's default table size
  const hp = objectsHash(1, 2);
  const hq = objectsHash(1, 2);
  const bp = bucketOf(hp, N);
  const hAa = stringHash("Aa");
  const hBB = stringHash("BB");
  if (hAa !== 2112 || hBB !== 2112) throw new Error(`hash-lookup: "Aa" and "BB" should both hash to 2112 (the note), got ${hAa} and ${hBB}`);
  const bs = bucketOf(hAa, N);

  // The set, run: add(p), contains(q), add(q); then a String set with "Aa" and "BB".
  type Entry = { id: string; text: string };
  const buckets: Entry[][] = Array.from({ length: N }, () => []);
  const pointEq = (a: Entry, b: Entry) => a.text === b.text;
  const add = (e: Entry, h: number) => {
    const bk = buckets[bucketOf(h, N)];
    const hit = bk.find((x) => pointEq(x, e));
    if (!hit) bk.push(e);
    return { added: !hit, compared: bk.length };
  };
  const P: Entry = { id: "p", text: "(1, 2)" };
  const Q: Entry = { id: "q", text: "(1, 2)" };
  add(P, hp);
  const snap1 = buckets.map((b) => [...b]);
  const found = buckets[bucketOf(hq, N)].some((x) => pointEq(x, Q));
  const r = add(Q, hq);
  const size1 = buckets.reduce((s, b) => s + b.length, 0);
  if (!found || r.added || size1 !== 1) throw new Error("hash-lookup: the set should find q and stay at size 1 (the note's output)");
  const strBuckets: Entry[][] = Array.from({ length: N }, () => []);
  for (const [s, h] of [["Aa", hAa], ["BB", hBB]] as const) {
    const bk = strBuckets[bucketOf(h, N)];
    if (!bk.some((x) => x.text === s)) bk.push({ id: s, text: `"${s}"` });
  }
  if (strBuckets[bs].length !== 2) throw new Error("hash-lookup: the two strings should share one bucket");

  const CW = 25;
  const G = 3;
  const BX = 34;
  const BY = 54;
  const bx = (i: number) => BX + i * (CW + G);
  const draw = (o: { table: Entry[][]; hot?: number; probe?: { text: string; hash: number; bucket: number; tone: TextTone }; compare?: { a: string; b: string; ok: boolean; call: string }; size?: string }): Item[] => {
    const items: Item[] = [label("lbl", "bucket", BX - 6, BY - 10, { anchor: "end", size: 10.5 })];
    for (let i = 0; i < N; i++) {
      items.push(box(`b${i}`, bx(i), BY, "", { w: CW, h: 22, tone: i === o.hot ? "accent" : "plain" }));
      items.push(label(`bi${i}`, String(i), bx(i) + CW / 2, BY - 10, { size: 10, mono: true, tone: i === o.hot ? "accent" : "faint" }));
    }
    o.table.forEach((bk, i) =>
      bk.forEach((e, k) => {
        const y = BY + 40 + k * 34;
        items.push(box(`e-${e.id}`, bx(i) - 22, y, e.text, { w: 70, h: 24, size: 11, tone: o.compare && (o.compare.a === e.id || o.compare.b === e.id) ? "accent" : "plain" }));
        if (e.id === "p") items.push(label("e-p-n", "p", bx(i) - 30, y + 12, { anchor: "end", size: 11.5, mono: true, tone: "ink" }));
        items.push(arrow(`ea-${e.id}`, { x: bx(i) + CW / 2, y: k ? y - 10 : BY + 23 }, { x: bx(i) + CW / 2, y: y - 1 }, { tone: "ink" }));
      }),
    );
    if (o.probe) {
      items.push(label("pr", o.probe.text, 0, 0, { anchor: "start", size: 11.5, mono: true, tone: "ink", weight: 600 }));
      items.push(label("ph", `hash ${o.probe.hash} → bucket ${o.probe.bucket}`, 0, 18, { anchor: "start", size: 11.5, mono: true, tone: o.probe.tone }));
      items.push(arrow("pa", { x: bx(o.probe.bucket) + CW / 2, y: 26 }, { x: bx(o.probe.bucket) + CW / 2, y: BY - 18 }, { tone: "accent" }));
    }
    if (o.compare) items.push(label("cmp", `${o.compare.call} → ${o.compare.ok}`, bx(o.hot ?? 0) + 60, BY + 52, { anchor: "start", size: 11.5, mono: true, tone: o.compare.ok ? "accent" : "error", weight: 600 }));
    if (o.size) items.push(label("sz", o.size, 0, BY + 120, { anchor: "start", size: 11.5, mono: true, tone: "ink" }));
    return items;
  };
  const idx = `(h ^ (h >>> 16)) & 15`;
  const frames: Frame[] = [
    {
      caption: `add(p): Objects.hash(1, 2) is ${hp}. HashMap spreads it and keeps the low four bits, ${idx}, which picks bucket ${bp} of the table's 16. The point is stored there.`,
      items: draw({ table: snap1, hot: bp, probe: { text: "add(p)   p = Point(1, 2)", hash: hp, bucket: bp, tone: "accent" } }),
    },
    {
      caption: `contains(q): q is a different object with the same fields, so the same hash, ${hq}, leads to the same bucket. Only there is equals called, once, and it says yes.`,
      items: draw({ table: snap1, hot: bp, probe: { text: "contains(q)   q = Point(1, 2)", hash: hq, bucket: bucketOf(hq, N) as number, tone: "accent" }, compare: { a: "p", b: "q", ok: true, call: "q.equals(p)" } }),
    },
    {
      caption: `add(q) finds the equal point already in bucket ${bp} and does nothing, so the set's size stays ${size1} — the note's output. With equals but no matching hashCode, q would have gone to another bucket and never been compared.`,
      items: draw({ table: buckets, hot: bp, size: `size() = ${size1}` }),
    },
    {
      caption: `A collision: "Aa" and "BB" are unequal but both have String.hashCode ${hAa}, so both land in bucket ${bs}. That is legal; equals tells them apart, and the set holds both. Collisions cost time, not correctness.`,
      items: draw({ table: strBuckets, hot: bs, probe: { text: 'a String set: add("Aa"), add("BB")', hash: hAa, bucket: bs, tone: "accent" }, compare: { a: "Aa", b: "BB", ok: false, call: '"BB".equals("Aa")' }, size: `size() = ${strBuckets.reduce((s, b) => s + b.length, 0)}` }),
    },
  ];
  return finish({ title: "How a HashSet finds an object: hash first, then equals", input: "HashSet with Java's default 16 buckets", frames });
}

/* ── shallow-deep: the Team program ───────────────────────────────── */

const COPY_OUTPUT = ["original after shallow.players gains Kiran: Asha, Ravi, Kiran", "original name after shallow is renamed: Blue", "original after deep.players gains Meera: Asha, Ravi, Kiran", "deep copy: Asha, Ravi, Kiran, Meera"];

function shallowDeep(): Walkthrough {
  // A model heap: Team objects hold a name (immutable) and a reference to a list object.
  type Team = { id: string; name: string; players: number };
  const lists: string[][] = [];
  const teams = new Map<string, Team>();
  const vars: Record<string, string> = {};
  const out: string[] = [];
  const newList = (xs: string[]) => lists.push([...xs]) - 1;
  const shallowCopy = (t: Team, id: string): Team => ({ id, name: t.name, players: t.players }); // copy.copy: fields as they are
  const deepCopy = (t: Team, id: string): Team => ({ id, name: t.name, players: newList(lists[t.players]) }); // copy.deepcopy: the list too
  type Snap = { teams: Team[]; lists: string[][]; vars: Record<string, string>; out: string[] };
  const snaps: Snap[] = [];
  const snap = () => snaps.push({ teams: [...teams.values()].map((t) => ({ ...t })), lists: lists.map((l) => [...l]), vars: { ...vars }, out: [...out] });

  teams.set("t1", { id: "t1", name: "Blue", players: newList(["Asha", "Ravi"]) });
  vars.original = "t1";
  snap();
  teams.set("t2", shallowCopy(teams.get("t1")!, "t2"));
  vars.shallow = "t2";
  snap();
  lists[teams.get("t2")!.players].push("Kiran");
  out.push(`original after shallow.players gains Kiran: ${lists[teams.get("t1")!.players].join(", ")}`);
  snap();
  teams.get("t2")!.name = "Red";
  out.push(`original name after shallow is renamed: ${teams.get("t1")!.name}`);
  snap();
  teams.set("t3", deepCopy(teams.get("t1")!, "t3"));
  vars.deep = "t3";
  snap();
  lists[teams.get("t3")!.players].push("Meera");
  out.push(`original after deep.players gains Meera: ${lists[teams.get("t1")!.players].join(", ")}`);
  out.push(`deep copy: ${lists[teams.get("t3")!.players].join(", ")}`);
  snap();
  if (out.join("\n") !== COPY_OUTPUT.join("\n")) throw new Error(`shallow-deep: the model printed ${JSON.stringify(out)}`);
  if (teams.get("t1")!.players !== teams.get("t2")!.players || teams.get("t3")!.players === teams.get("t1")!.players) throw new Error("shallow-deep: shallow must share the list, deep must not");

  const TX = 96;
  const TW = 140;
  const LX = TX + TW + 44;
  const TY: Record<string, number> = { t1: 0, t2: 86, t3: 182 };
  const NW = 46;
  const listY = (l: number, s: Snap) => {
    // A list sits level with the first team that refers to it, or between two that share it.
    const owners = s.teams.filter((t) => t.players === l).map((t) => TY[t.id]);
    return owners.length ? (Math.min(...owners) + Math.max(...owners)) / 2 + 23 : 0;
  };
  const draw = (k: number, o: { hot?: string[]; hotList?: number; hotName?: string; fresh?: number }): Item[] => {
    const s = snaps[k];
    const hot = new Set(o.hot ?? []);
    const items: Item[] = [...region("vars", -16, -12, 98, 262, "variables"), ...region("heap", TX - 8, -12, LX + 4 * (NW + 4) + 4 - (TX - 8), 262, "heap")];
    for (const t of s.teams) {
      const b = objectBox(t.id, TX, TY[t.id], "Team", [`name = "${t.name}"`, "players ●"], { w: TW, tone: hot.has(t.id) ? "accent" : "plain", rowTone: (i) => (i === 0 && o.hotName === t.id ? "accent" : undefined) });
      items.push(...b.items);
      const ly = listY(t.players, s);
      items.push(arrow(`r-${t.id}`, { x: dotAt(TX, 8) + 6, y: b.rowMid(1) }, { x: LX - 2, y: ly + 12 }, { tone: o.hotList === t.players ? "accent" : "ink" }));
    }
    s.lists.forEach((names, l) => {
      if (!s.teams.some((t) => t.players === l)) return;
      const y = listY(l, s);
      items.push(label(`ll${l}`, `list #${l + 1}`, LX, y - 8, { anchor: "start", size: 10.5, tone: "faint" }));
      names.forEach((n, i) => items.push(box(`l${l}-${i}`, LX + i * (NW + 4), y + 2, n, { w: NW, h: 22, size: 11, tone: o.hotList === l && (i === names.length - 1 || hot.has(`all${l}`)) ? "accent" : "plain" })));
    });
    for (const [name, id] of Object.entries(s.vars)) {
      items.push(...variable(`v-${name}`, name, -6, TY[id], hot.has(`v-${name}`) ? "accent" : "plain"));
      items.push(arrow(`va-${name}`, { x: 78, y: TY[id] + 11 }, { x: TX - 2, y: TY[id] + 11 }, { tone: hot.has(`v-${name}`) ? "accent" : "ink" }));
    }
    s.out.forEach((t, i) => items.push({ k: "text", id: `out${i}`, x: -16, y: 274 + i * 16, text: t, tone: o.fresh !== undefined && i >= o.fresh ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
    return items;
  };
  const frames: Frame[] = [
    { caption: 'original is a Team whose players field refers to a list object holding Asha and Ravi. The name is an immutable string, so it can be thought of as a value.', items: draw(0, {}) },
    { caption: "copy.copy(original) makes a new Team and copies each field as it is. The players field holds a reference, so the copy refers to the very same list: one list, two owners.", items: draw(1, { hot: ["t2", "v-shallow"] }) },
    { caption: "shallow.players.append(\"Kiran\") changes that shared list, so the original sees Kiran too — the first line the program prints.", items: draw(2, { hotList: 0, fresh: 0 }) },
    { caption: "shallow.name = \"Red\" reassigns a field of the copy alone. Reassigning is not mutating: the original's name is still Blue.", items: draw(3, { hotName: "t2", fresh: 1 }) },
    { caption: "copy.deepcopy(original) copies the list as well, so deep gets a list of its own holding the same three names.", items: draw(4, { hot: ["t3", "v-deep", "all1"], hotList: 1 }) },
    { caption: "deep.players.append(\"Meera\") touches only deep's list. The original still has three players; nothing mutable is shared any more.", items: draw(5, { hotList: 1, fresh: 2 }) },
  ];
  return finish({ title: "Shallow copy shares the list; deep copy gets its own", input: 'original = Team("Blue", ["Asha", "Ravi"])', frames });
}

/* ── copy-and-swap: the C++ Buffer program ────────────────────────── */

const BUFFER_OUTPUT = ["copy constructor", "copy constructor", "copy assignment", "copy constructor", "copy assignment", "a[0] = 7, b[0] = 99, c[0] = 7"];

function copyAndSwap(): Walkthrough {
  // Stack objects hold n and a pointer into a model heap of arrays; delete[] marks an array freed.
  type Arr = { id: number; cells: number[]; freed: boolean };
  type Obj = { name: string; n: number; data: number };
  const heap: Arr[] = [];
  const log: string[] = [];
  const objs = new Map<string, Obj>();
  const newArr = (cells: number[]) => heap.push({ id: heap.length, cells: [...cells], freed: false }) - 1;
  const construct = (name: string, n: number) => objs.set(name, { name, n, data: newArr(Array(n).fill(0)) });
  const copyCtor = (name: string, from: Obj) => {
    objs.set(name, { name, n: from.n, data: newArr(heap[from.data].cells) }); // a deep copy
    log.push("copy constructor");
  };
  const destroy = (name: string) => {
    const o = objs.get(name)!;
    if (heap[o.data].freed) throw new Error("copy-and-swap: double delete");
    heap[o.data].freed = true;
    objs.delete(name);
  };
  /** operator=(Buffer o): o is built by the copy constructor, swapped with *this, and destroyed at the end. */
  const assign = (target: string, from: Obj, snapAfterSwap?: () => void) => {
    copyCtor("o", from);
    const t = objs.get(target)!;
    const o = objs.get("o")!;
    [t.n, o.n] = [o.n, t.n];
    [t.data, o.data] = [o.data, t.data];
    log.push("copy assignment");
    snapAfterSwap?.();
    destroy("o");
  };
  type Snap = { objs: Obj[]; heap: Arr[]; log: string[] };
  const snaps: Snap[] = [];
  const snap = () => snaps.push({ objs: [...objs.values()].map((o) => ({ ...o })), heap: heap.map((a) => ({ ...a, cells: [...a.cells] })), log: [...log] });

  // What the compiler-generated copy would have done: copy the pointer, so one array has two owners.
  const defaultCopy = (() => {
    const a = { n: 3, data: 0 };
    const b = { ...a };
    const owners = [a, b].filter((x) => x.data === 0).length;
    return { owners, n: b.n };
  })();
  if (defaultCopy.owners !== 2) throw new Error("copy-and-swap: a member-wise copy should share the array");

  construct("a", 3);
  heap[objs.get("a")!.data].cells[0] = 7;
  snap(); // 0
  copyCtor("b", objs.get("a")!);
  heap[objs.get("b")!.data].cells[0] = 99;
  snap(); // 1
  construct("c", 1);
  snap(); // 2
  const cOld = objs.get("c")!.data;
  assign("c", objs.get("a")!, snap); // 3: after the swap, o still alive
  snap(); // 4: o destroyed, c's old array freed
  if (!heap[cOld].freed) throw new Error("copy-and-swap: the old array should be freed by o's destructor");
  const cBefore = objs.get("c")!.data;
  assign("c", objs.get("c")!);
  snap(); // 5
  if (!heap[cBefore].freed || heap[objs.get("c")!.data].freed) throw new Error("copy-and-swap: self-assignment should replace c's array safely");
  const at0 = (n: string) => heap[objs.get(n)!.data].cells[0];
  log.push(`a[0] = ${at0("a")}, b[0] = ${at0("b")}, c[0] = ${at0("c")}`);
  snaps[5].log = [...log];
  if (log.join("\n") !== BUFFER_OUTPUT.join("\n")) throw new Error(`copy-and-swap: the model printed ${JSON.stringify(log)}`);

  const OW = 112;
  const AX = OW + 56;
  const SLOT: Record<string, number> = { a: 0, b: 76, c: 152, o: 228 };
  const CS = 30;
  const LOGX = AX + 3 * (CS + 3) + 26;
  const draw = (s: Snap, o: { hot?: string[]; shared?: boolean; freedNow?: number[]; fresh?: number }): Item[] => {
    const hot = new Set(o.hot ?? []);
    const items: Item[] = [...region("stk", -8, -14, OW + 16, 312, "stack"), ...region("hp", AX - 10, -14, 3 * (CS + 3) + 18, 312, "heap")];
    const arrY = new Map<number, number>();
    for (const ob of s.objs) arrY.set(ob.data, SLOT[ob.name] + 30);
    for (const id of o.freedNow ?? []) if (!arrY.has(id)) arrY.set(id, SLOT.o + 30);
    for (const ob of s.objs) {
      const b = objectBox(`s-${ob.name}`, 0, SLOT[ob.name], `${ob.name}: Buffer`, [`n = ${ob.n}`, "data ●"], { w: OW, tone: hot.has(ob.name) ? "accent" : "plain" });
      items.push(...b.items, arrow(`p-${ob.name}`, { x: dotAt(0, 5) + 6, y: b.rowMid(1) }, { x: AX - 2, y: arrY.get(ob.data)! + 11 }, { tone: hot.has(ob.name) ? "accent" : "ink" }));
    }
    if (o.shared) {
      // The rejected default copy: b's pointer is a copy of a's.
      const b = objectBox("s-b", 0, SLOT.b, "b: Buffer", [`n = ${defaultCopy.n}`, "data ●"], { w: OW, tone: "error" });
      items.push(...b.items, arrow("p-b", { x: dotAt(0, 5) + 6, y: b.rowMid(1) }, { x: AX - 2, y: arrY.get(0)! + 15 }, { tone: "error" }));
      items.push(label("dbl", "one array, two owners:", LOGX, SLOT.b + 22, { anchor: "start", size: 11, tone: "error", weight: 600 }), label("dbl2", "delete[] would run twice", LOGX, SLOT.b + 38, { anchor: "start", size: 11, tone: "error", weight: 600 }));
    }
    for (const [id, y] of arrY) {
      const arr = s.heap[id];
      const freed = (o.freedNow ?? []).includes(id);
      arr.cells.forEach((v, i) => items.push(box(`h${id}-${i}`, AX + i * (CS + 3), y, v, { w: CS, h: 22, size: 11.5, tone: freed ? "muted" : "plain" })));
      if (freed) items.push(label(`fr${id}`, "freed", AX + arr.cells.length * (CS + 3) + 4, y + 11, { anchor: "start", size: 11, tone: "faint", weight: 600 }));
    }
    if (s.log.length) items.push(label("log-h", "output", LOGX, -6, { anchor: "start", size: 11, weight: 600 }));
    s.log.forEach((t, i) => items.push({ k: "text", id: `log${i}`, x: LOGX, y: 12 + i * 16, text: t, tone: o.fresh !== undefined && i >= o.fresh ? "accent" : "ink", anchor: "start", size: 11, mono: true }));
    return items;
  };
  const [s0, s1, s2, s3, s4, s5] = snaps;
  const frames: Frame[] = [
    { caption: "Buffer a(3) owns a heap array of three ints through a raw pointer, and a[0] = 7 writes into it.", items: draw(s0, { hot: ["a"] }) },
    {
      caption: "If Buffer relied on the compiler's copy, b = a would copy the pointer: two objects owning one array, and both destructors would delete[] it. That is why a class like this needs its own copy constructor.",
      items: draw({ ...s0, log: [] }, { shared: true }),
    },
    { caption: "The user-written copy constructor allocates a fresh array and copies the values, so b[0] = 99 changes only b's array.", items: draw(s1, { hot: ["b"], fresh: 0 }) },
    { caption: "Buffer c(1) gets an array of its own. Next, c = a calls the assignment operator, whose parameter is taken by value.", items: draw(s2, { hot: ["c"] }) },
    {
      caption: "Taking the parameter by value runs the copy constructor, building o as a copy of a. The body then swaps n and data with o: c now owns the copy, and o holds c's old array.",
      items: draw(s3, { hot: ["c", "o"], fresh: 1 }),
    },
    { caption: "operator= returns and o is destroyed, freeing the array that used to be c's. If the copy had thrown, c would never have been touched: the strong guarantee.", items: draw(s4, { freedNow: [cOld], fresh: 3 }) },
    {
      caption: `c = c runs the same steps: copy, swap, free the old array. Self-assignment needs no special check, and the program ends with a[0] = ${at0("a")}, b[0] = ${at0("b")} and c[0] = ${at0("c")}.`,
      items: draw(s5, { hot: ["c"], fresh: 3 }),
    },
  ];
  return finish({ title: "A class that owns memory: deep copy and copy-and-swap", input: "the note's Buffer program", frames });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  identity,
  "hash-lookup": hashLookup,
  "shallow-deep": shallowDeep,
  "copy-and-swap": copyAndSwap,
};
