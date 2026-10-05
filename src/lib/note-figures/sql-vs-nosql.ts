import { finish, type Frame, type Item, type Tone, type Walkthrough } from "../walkthroughs/core.js";
import { arrow, box, label, region } from "../lesson-figures/kit.js";
import { boxRim } from "./kit.js";

/**
 * SQL vs NoSQL Databases: the note's figures
 * (content/notes/dbms/sql-vs-nosql.md places each with "@figure <name>").
 *
 * four-models draws one customer-and-orders structure five ways, each view
 * derived from the same object (the tables split it by key, the document
 * nests it, the key-value store holds its serialised bytes — sizes counted,
 * the wide-column partition sorts it by the clustering columns, the graph
 * makes each relationship an edge). The distributed-systems figures run
 * small simulations: two replicas across a failed link under a CP and an
 * AP policy, asynchronous leader-follower replication with one follower
 * behind, every read set of a quorum checked against the write set, and
 * order ids placed on shards by range and by a real hash (FNV-1a). Each
 * generator throws if its simulation disagrees with the note's claim.
 */

/* ── One customer, five models ────────────────────────────────────── */

type Order = { order_id: number; order_date: string; total: number; items: string[] };
const CUSTOMER = {
  _id: 101,
  name: "Asha",
  city: "Pune",
  orders: [
    { order_id: 9001, order_date: "2026-09-12", total: 1499, items: ["keyboard"] },
    { order_id: 9002, order_date: "2026-10-01", total: 299, items: ["mouse pad", "cable"] },
  ] as Order[],
};

/** The customer as the note's JSON document stores it (order dates belong to the wide-column table only). */
const asDocument = (c: typeof CUSTOMER) => ({ _id: c._id, name: c.name, city: c.city, orders: c.orders.map((o) => ({ order_id: o.order_id, total: o.total, items: o.items })) });

function fourModels(): Walkthrough {
  const c = CUSTOMER;
  const H = 24;
  const G = 3;
  const frames: Frame[] = [];
  const tableAt = (p: string, title: string, cols: ReadonlyArray<{ name: string; w: number; x: number; key?: boolean }>, rows: ReadonlyArray<ReadonlyArray<string | number>>, y: number): Item[] => {
    const items: Item[] = [label(`${p}T`, title, cols[0].x, y, { anchor: "start", tone: "ink", size: 12, weight: 700 })];
    cols.forEach((col, j) => items.push(label(`${p}H${j}`, col.name, col.x + col.w / 2, y + 18, { tone: col.key ? "accent" : "soft", size: 11, mono: true })));
    rows.forEach((r, i) => r.forEach((v, j) => items.push(box(`${p}${i}-${j}`, cols[j].x, y + 30 + i * (H + G), v, { w: cols[j].w, h: H, size: 11.5, tone: cols[j].key ? "accent" : "plain" }))));
    return items;
  };

  // Relational: split by key into three tables; each FK column sits under the key it references.
  {
    const items: Item[] = [];
    const cust = [{ name: "customer_id", w: 88, x: 0, key: true }, { name: "name", w: 62, x: 91 }, { name: "city", w: 62, x: 156 }];
    const ord = [{ name: "customer_id", w: 88, x: 0, key: true }, { name: "total", w: 62, x: 91 }, { name: "order_id", w: 74, x: 156, key: true }];
    const IX = 270;
    const itm = [{ name: "order_id", w: 74, x: IX, key: true }, { name: "item", w: 92, x: IX + 77 }];
    const orderRows = c.orders.map((o) => [c._id, o.total, o.order_id]);
    const itemRows = c.orders.flatMap((o) => o.items.map((it) => [o.order_id, it]));
    const OY = 78;
    items.push(...tableAt("c", "customers", cust, [[c._id, c.name, c.city]], 0));
    items.push(...tableAt("o", "orders", ord, orderRows, OY));
    items.push(...tableAt("i", "order_items", itm, itemRows, OY));
    // Each foreign key drawn to the row it references.
    const rowMid = (y: number, i: number) => y + 30 + i * (H + G) + H / 2;
    // customers to orders: an arc round the left margin, clear of the orders title.
    items.push({ k: "edge", id: "fc", x1: -3, y1: 30 + H / 2, x2: -3, y2: OY + 30 + H / 2, tone: "accent", bow: 16 });
    itemRows.forEach(([oid], j) => {
      const i = orderRows.findIndex((r) => r[2] === oid);
      items.push({ k: "edge", id: `fo${j}`, x1: 156 + 74 + 3, y1: rowMid(OY, i), x2: IX - 3, y2: rowMid(OY, j), tone: "accent" });
    });
    items.push(label("j", `${itemRows.length + orderRows.length + 1} rows, 3 tables, 2 joins`, IX, 18, { anchor: "start", tone: "soft", size: 11.5 }));
    frames.push({
      caption: `Relational: the customer, her ${c.orders.length} orders and their ${itemRows.length} items go into three tables linked by keys, each fact stored once. Showing her profile with orders takes two joins.`,
      items,
    });
  }
  // Document: the orders nest inside the customer.
  {
    const items: Item[] = [];
    const OX = 14;
    const ow = 300;
    const oh = 58;
    const top = 56;
    items.push(...region("doc", 0, 0, OX * 2 + ow, top + c.orders.length * (oh + 8) + 6, `document _id: ${c._id}`, { tone: "accent", labelTone: "accent" }));
    items.push(label("f1", `name: "${c.name}"   city: "${c.city}"`, OX, 18, { anchor: "start", tone: "ink", size: 12, mono: true }));
    items.push(label("f2", `orders: [ ${c.orders.length} embedded documents ]`, OX, 40, { anchor: "start", tone: "soft", size: 12, mono: true }));
    c.orders.forEach((o, k) => {
      const x = OX;
      const y = top + k * (oh + 8);
      items.push(...region(`od${k}`, x, y, ow, oh, undefined, { tone: "plain" }));
      items.push(label(`ot${k}`, `order_id: ${o.order_id}   total: ${o.total}`, x + 10, y + 15, { anchor: "start", tone: "ink", size: 11.5, mono: true }));
      let ix = x + 10;
      o.items.forEach((it, j) => {
        const w = Math.max(60, it.length * 7 + 14);
        items.push(box(`it${k}-${j}`, ix, y + 27, it, { w, h: 24, size: 11.5, tone: "plain" }));
        ix += w + 6;
      });
    });
    const bytes = JSON.stringify(asDocument(c)).length;
    frames.push({
      caption: `Document: the orders and their items are embedded inside the customer, so one read of ${bytes} bytes returns everything the profile page needs. Data another document also needs would have to be copied into it.`,
      items,
    });
  }
  // Key-value: the store sees a key and opaque bytes.
  {
    const items: Item[] = [label("kh", "key", 60, 6, { tone: "soft", size: 11.5, weight: 600 }), label("vh", "value (opaque bytes)", 280, 6, { tone: "soft", size: 11.5, weight: 600 })];
    const doc = asDocument(c);
    const pairs: Array<[string, string]> = [[`customer:${c._id}`, JSON.stringify(doc)], ...doc.orders.map((o) => [`order:${o.order_id}`, JSON.stringify(o)] as [string, string])];
    pairs.forEach(([k, v], i) => {
      const y = 22 + i * 34;
      items.push(box(`k${i}`, 0, y, k, { w: 120, h: 26, size: 11.5, tone: "accent" }));
      items.push(arrow(`a${i}`, { x: 124, y: y + 13 }, { x: 166, y: y + 13 }, { tone: "line" }));
      items.push(box(`v${i}`, 170, y, `${v.slice(0, 18)}…  ${v.length} bytes`, { w: 240, h: 26, size: 11, tone: "muted" }));
    });
    frames.push({
      caption: `Key-value: the store knows only keys and the bytes stored under them. GET customer:${c._id} is one very fast lookup, but "orders above ₹1,000" cannot be asked: the store cannot look inside a value.`,
      items,
    });
  }
  // Wide-column: one partition per customer_id, rows sorted by the clustering columns, newest first.
  {
    const rows = [...c.orders].sort((a, b) => (a.order_date !== b.order_date ? (a.order_date < b.order_date ? 1 : -1) : b.order_id - a.order_id));
    if (rows[0].order_id !== 9002) throw new Error("four-models: the newest order should come first");
    const items: Item[] = [];
    items.push(box("pk", 0, 40, `customer_id ${c._id}`, { w: 120, h: 30, size: 11.5, tone: "strong" }));
    items.push(label("pkl", "partition key", 0, 88, { anchor: "start", tone: "soft", size: 11 }));
    items.push(...region("part", 140, 18, 312, 30 + rows.length * 30 + 4, `partition ${c._id}`, { tone: "accent", labelTone: "accent" }));
    const cols = [{ n: "order_date", w: 104 }, { n: "order_id", w: 76 }, { n: "total", w: 64 }];
    let x = 152;
    cols.forEach((col, j) => {
      items.push(label(`ph${j}`, col.n, x + col.w / 2, 32, { tone: j < 2 ? "accent" : "soft", size: 11, mono: true }));
      rows.forEach((r, i) => items.push(box(`pr${i}-${j}`, x, 44 + i * 30, [r.order_date, r.order_id, r.total][j], { w: col.w, h: 26, size: 11.5 })));
      x += col.w + 4;
    });
    items.push(arrow("pa", { x: 122, y: 55 }, { x: 138, y: 55 }, { tone: "accent" }));
    items.push(label("ck", "clustering columns: sorted newest first", 152, 44 + rows.length * 30 + 22, { anchor: "start", tone: "soft", size: 11 }));
    frames.push({
      caption: `Wide-column: customer_id is the partition key, so all of ${c.name}'s orders live together on the same nodes, sorted by the clustering columns, newest first. Reading her latest orders is one sequential read; the table exists for that one query.`,
      items,
    });
  }
  // Graph: every relationship an edge.
  {
    const items: Item[] = [];
    type N = { id: string; text: string; x: number; y: number; w: number; tone: Tone };
    const nodes: N[] = [{ id: "g0", text: c.name, x: 0, y: 80, w: 70, tone: "strong" }];
    const edges: Array<[string, string, string]> = [];
    const products = c.orders.flatMap((o) => o.items);
    c.orders.forEach((o, k) => {
      nodes.push({ id: `go${k}`, text: `order ${o.order_id}`, x: 150, y: 30 + k * 110, w: 96, tone: "accent" });
      edges.push(["g0", `go${k}`, "PLACED"]);
    });
    products.forEach((p, j) => {
      nodes.push({ id: `gp${j}`, text: p, x: 340, y: 10 + j * 70, w: 92, tone: "plain" });
      const k = c.orders.findIndex((o) => o.items.includes(p));
      edges.push([`go${k}`, `gp${j}`, "CONTAINS"]);
    });
    const NH = 28;
    const mid = (n: N) => ({ x: n.x + n.w / 2, y: n.y + NH / 2 });
    for (const [a, b, t] of edges) {
      const A = nodes.find((n) => n.id === a)!;
      const B = nodes.find((n) => n.id === b)!;
      const p1 = boxRim(mid(A), A.w + 6, NH + 6, mid(B));
      const p2 = boxRim(mid(B), B.w + 8, NH + 8, mid(A));
      items.push(arrow(`ge${a}${b}`, p1, p2, { tone: "line", label: t }));
    }
    nodes.forEach((n) => items.push(box(n.id, n.x, n.y, n.text, { w: n.w, h: NH, size: 11.5, tone: n.tone })));
    frames.push({
      caption: `Graph: ${c.name}, her orders and the products are nodes, and each relationship is a stored edge. A question that follows relationships, such as which products she bought, walks edges from her node instead of joining tables.`,
      items,
    });
  }
  return finish({ title: "One customer and her orders in five data models", input: `${c.name} (id ${c._id}) with orders ${c.orders.map((o) => o.order_id).join(" and ")}`, frames });
}

/* ── A partition: CP or AP ────────────────────────────────────────── */

function partition(): Walkthrough {
  type Replica = { name: string; likes: number };
  const mumbai: Replica = { name: "Mumbai", likes: 41 };
  const singapore: Replica = { name: "Singapore", likes: 41 };
  let linkUp = true;
  const write = (r: Replica, v: number) => {
    r.likes = v;
    if (linkUp) (r === mumbai ? singapore : mumbai).likes = v;
  };
  const read = (r: Replica, policy: "CP" | "AP"): string => {
    if (!linkUp && policy === "CP") return "error: unavailable";
    return `likes = ${r.likes}${r.likes !== mumbai.likes ? " (stale)" : ""}`;
  };
  const W = 150;
  const H = 54;
  const XS = 280;
  const Y = 70;
  type Snap = { m: number; s: number; link: boolean; writeTo?: string; readOut?: string; readTone?: "error" | "accent" | "strong"; repl?: boolean };
  const draw = (o: Snap): Item[] => {
    const items: Item[] = [];
    const rep = (id: string, x: number, name: string, v: number, stale: boolean) => {
      items.push(box(id, x, Y, "", { w: W, h: H, tone: stale ? "muted" : "plain" }));
      items.push(label(`${id}n`, `${name} replica`, x + W / 2, Y + 16, { tone: "soft", size: 11.5, weight: 600 }));
      items.push(label(`${id}v`, `likes = ${v}`, x + W / 2, Y + 36, { tone: stale ? "faint" : "ink", size: 13, mono: true, weight: 600 }));
    };
    rep("m", 0, "Mumbai", o.m, false);
    rep("s", XS, "Singapore", o.s, o.s !== o.m);
    items.push({ k: "edge", id: "link", x1: W + 4, y1: Y + H / 2, x2: XS - 4, y2: Y + H / 2, tone: o.link ? (o.repl ? "accent" : "line") : "error", dashed: !o.link, arrow: !!o.repl });
    items.push(label("lt", o.link ? (o.repl ? "replicate" : "network link") : "partition: link down", (W + XS) / 2, Y + H / 2 - 12, { tone: o.link ? (o.repl ? "accent" : "faint") : "error", size: 11, weight: 600 }));
    if (o.writeTo) {
      items.push(box("wc", 7, 0, o.writeTo, { w: 136, h: 26, size: 11.5, tone: "accent" }));
      items.push(arrow("wa", { x: 75, y: 29 }, { x: 75, y: Y - 4 }, { tone: "accent" }));
    }
    if (o.readOut) {
      items.push(box("rc", XS + 7, 0, "read likes", { w: 136, h: 26, size: 11.5, tone: "plain" }));
      items.push(arrow("ra", { x: XS + 75, y: 29 }, { x: XS + 75, y: Y - 4 }, { tone: "line" }));
      items.push(box("ro", XS - 10, Y + H + 18, o.readOut, { w: W + 20, h: 28, size: 11.5, tone: o.readTone ?? "plain" }));
    }
    return items;
  };
  const frames: Frame[] = [];
  write(mumbai, 42);
  frames.push({ caption: `Two replicas of the same data, in Mumbai and Singapore. While the link works, a write to Mumbai (likes = ${mumbai.likes}) is copied to Singapore, and both answer alike.`, items: draw({ m: mumbai.likes, s: singapore.likes, link: true, writeTo: "write likes = 42", repl: true }) });
  linkUp = false;
  write(mumbai, 43);
  frames.push({ caption: `The link fails: a partition. A new write reaches Mumbai, which now holds ${mumbai.likes}, but cannot be copied, so Singapore still holds ${singapore.likes}. Now a read arrives in Singapore.`, items: draw({ m: mumbai.likes, s: singapore.likes, link: false, writeTo: "write likes = 43" }) });
  const cp = read(singapore, "CP");
  const ap = read(singapore, "AP");
  if (cp !== "error: unavailable" || ap !== "likes = 42 (stale)") throw new Error(`partition: ${cp} / ${ap}`);
  frames.push({ caption: `A CP choice keeps consistency: Singapore cannot confirm it has the latest value, so it refuses the read with an error until the link is back. Everyone who gets an answer gets the latest one.`, items: draw({ m: mumbai.likes, s: singapore.likes, link: false, readOut: cp, readTone: "error" }) });
  frames.push({ caption: `An AP choice keeps availability: Singapore answers with what it has, ${singapore.likes}, which is stale. Every request gets an answer, and some answers are out of date.`, items: draw({ m: mumbai.likes, s: singapore.likes, link: false, readOut: ap, readTone: "accent" }) });
  linkUp = true;
  singapore.likes = mumbai.likes;
  frames.push({ caption: `When the link returns, the AP replicas exchange updates and converge on ${singapore.likes}: eventual consistency. CAP's choice only bites during a partition; with the link up, a system can be both consistent and available.`, items: draw({ m: mumbai.likes, s: singapore.likes, link: true, repl: true, readOut: read(singapore, "AP"), readTone: "strong" }) });
  return finish({ title: "A network partition forces a choice: consistency or availability", input: "", frames });
}

/* ── Leader-follower replication lag ──────────────────────────────── */

function replication(): Walkthrough {
  // The leader's log of profile versions, and how far each follower has applied it.
  const log = ["Asha", "Asha Patel"];
  const applied = { leader: 2, f1: 2, f2: 1 };
  const valueAt = (n: number) => log[n - 1];
  const nodes = [
    { id: "leader", name: "leader", x: 170 },
    { id: "f1", name: "follower 1", x: 0 },
    { id: "f2", name: "follower 2", x: 340 },
  ] as const;
  const W = 120;
  const LX = 170;
  const FX = 340;
  const H = 50;
  const Y = 90;
  const draw = (o: { readFrom?: "f2" | "leader"; write?: boolean }): Item[] => {
    const items: Item[] = [];
    items.push(box("cl", LX + W / 2 - 60, 0, "user's browser", { w: 120, h: 26, size: 11.5, tone: "plain" }));
    for (const n of nodes) {
      const v = applied[n.id];
      const behind = v < applied.leader;
      items.push(box(n.id, n.x, Y, "", { w: W, h: H, tone: behind ? "muted" : n.id === "leader" ? "accent" : "plain" }));
      items.push(label(`${n.id}n`, n.name, n.x + W / 2, Y + 15, { tone: "soft", size: 11.5, weight: 600 }));
      items.push(label(`${n.id}v`, `"${valueAt(v)}"`, n.x + W / 2, Y + 34, { tone: behind ? "faint" : "ink", size: 11.5, mono: true, weight: 600 }));
    }
    items.push(arrow("r1", { x: LX - 3, y: Y + H / 2 }, { x: W + 3, y: Y + H / 2 }, { tone: "accent" }));
    items.push({ k: "edge", id: "r2x", x1: LX + W + 3, y1: Y + H / 2, x2: FX - 3, y2: Y + H / 2, tone: "line", dashed: true, arrow: true });
    items.push(label("lag", "behind", (LX + W + FX) / 2, Y + H / 2 + 14, { tone: "faint", size: 11 }));
    if (o.write) items.push(arrow("w", { x: LX + W / 2, y: 29 }, { x: LX + W / 2, y: Y - 4 }, { tone: "accent" }), label("wt", `write "${log[log.length - 1]}"`, LX + W / 2 + 6, 56, { anchor: "start", tone: "accent", size: 11, mono: true }));
    if (o.readFrom) {
      const n = nodes.find((x) => x.id === o.readFrom)!;
      const got = valueAt(applied[o.readFrom]);
      const stale = got !== log[log.length - 1];
      items.push(arrow("rd", { x: LX + W / 2 + (o.readFrom === "f2" ? 60 : 0), y: 29 }, { x: n.x + W / 2, y: Y - 4 }, { tone: stale ? "error" : "accent", bow: o.readFrom === "f2" ? -14 : 0 }));
      items.push(box("res", n.x + (W - 170) / 2, Y + H + 18, `page shows "${got}"`, { w: 170, h: 28, size: 11.5, tone: stale ? "error" : "strong" }));
    }
    return items;
  };
  if (valueAt(applied.f2) === valueAt(applied.leader)) throw new Error("replication: follower 2 should lag");
  return finish({
    title: "Replication lag breaks read-your-writes",
    input: "",
    frames: [
      {
        caption: `The user renames her profile to "${log[1]}". The write goes to the leader, which acknowledges it and streams it to the followers without waiting: follower 1 has applied it, follower 2 has not yet.`,
        items: draw({ write: true }),
      },
      {
        caption: `The next page load is a read, sent to follower 2, which still shows "${valueAt(applied.f2)}". The user's own change seems to have vanished, though it is safe on the leader.`,
        items: draw({ readFrom: "f2" }),
      },
      {
        caption: "A common fix: for a short while after a user writes, read that user's own data from the leader. Everyone else's reads can still go to any follower.",
        items: draw({ readFrom: "leader" }),
      },
    ],
  });
}

/* ── Quorums: R + W > N ───────────────────────────────────────────── */

function quorum(): Walkthrough {
  const N = 3;
  const W = 2;
  const replicas = Array.from({ length: N }, (_, i) => i);
  const writeSet = replicas.slice(0, W);
  const version = (r: number) => (writeSet.includes(r) ? 2 : 1);
  const subsets = (k: number): number[][] => {
    const out: number[][] = [];
    const go = (start: number, acc: number[]) => {
      if (acc.length === k) return void out.push(acc);
      for (let i = start; i < N; i++) go(i + 1, [...acc, i]);
    };
    go(0, []);
    return out;
  };
  const evaluate = (R: number) => subsets(R).map((s) => ({ set: s, newest: Math.max(...s.map(version)) }));
  const ok = evaluate(2);
  const weak = evaluate(1);
  if (!ok.every((r) => r.newest === 2) || weak.every((r) => r.newest === 2)) throw new Error("quorum: R + W > N should overlap and R + W = N should not");

  const CW = 64;
  const RH = 28;
  const X0 = 90;
  const draw = (R: number, reads: ReturnType<typeof evaluate>): Item[] => {
    const items: Item[] = [label("wl", `write, W = ${W}`, X0 - 12, 13, { anchor: "end", tone: "accent", size: 11.5, weight: 600 })];
    replicas.forEach((r) => {
      items.push(label(`rh${r}`, `replica ${r + 1}`, X0 + r * (CW + 8) + CW / 2, -12, { tone: "soft", size: 11, weight: 600 }));
      items.push(box(`w${r}`, X0 + r * (CW + 8), 0, `v${version(r)}`, { w: CW, h: RH, size: 12, tone: writeSet.includes(r) ? "accent" : "muted" }));
    });
    reads.forEach((rd, i) => {
      const y = 50 + i * (RH + 8);
      items.push(label(`rl${i}`, `read ${i + 1}, R = ${R}`, X0 - 12, y + RH / 2, { anchor: "end", tone: "soft", size: 11.5 }));
      replicas.forEach((r) => {
        const inSet = rd.set.includes(r);
        items.push(box(`r${i}-${r}`, X0 + r * (CW + 8), y, inSet ? `v${version(r)}` : "", { w: CW, h: RH, size: 12, tone: inSet ? (version(r) === 2 ? "accent" : "plain") : "ghost" }));
      });
      const good = rd.newest === 2;
      items.push(box(`res${i}`, X0 + N * (CW + 8) + 10, y, good ? "sees v2" : "misses v2", { w: 90, h: RH, size: 11.5, tone: good ? "strong" : "error" }));
    });
    return items;
  };
  return finish({
    title: "Quorums: a read set must overlap the write set",
    input: `N = ${N} replicas, W = ${W}`,
    frames: [
      {
        caption: `A write of v2 waits for W = ${W} of the ${N} replicas. With R = 2, all ${ok.length} possible read sets share at least one replica with the write set, because ${2} + ${W} > ${N}: every read sees v2 and keeps the newest version.`,
        items: draw(2, ok),
      },
      {
        caption: `With R = 1, R + W = ${1 + W} is not greater than ${N}: a read that happens to ask only replica 3 gets the old v1. The overlap rule, not the number of copies, is what makes reads current.`,
        items: draw(1, weak),
      },
    ],
  });
}

/* ── Sharding by range and by hash ────────────────────────────────── */

/** FNV-1a, 32-bit: a real, deterministic string hash. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function sharding(): Walkthrough {
  const SHARDS = 3;
  const OLD = Array.from({ length: 9 }, (_, i) => 1001 + i);
  const NEW = [1010, 1011, 1012];
  const ranges: Array<[number, number | null]> = [[1001, 1004], [1005, 1008], [1009, null]];
  const byRange = (k: number) => ranges.findIndex(([lo, hi]) => k >= lo && (hi === null || k <= hi));
  const byHash = (k: number) => fnv1a(String(k)) % SHARDS;
  const RANGE_Q: [number, number] = [1005, 1008];
  const inQ = (k: number) => k >= RANGE_Q[0] && k <= RANGE_Q[1];
  const all = [...OLD, ...NEW];
  const newRange = new Set(NEW.map(byRange));
  const newHash = new Set(NEW.map(byHash));
  const qRange = new Set(all.filter(inQ).map(byRange));
  const qHash = new Set(all.filter(inQ).map(byHash));
  if (newRange.size !== 1 || newHash.size < 2 || qRange.size !== 1 || qHash.size < 2) throw new Error(`sharding: the sample does not show the trade-off (${newRange.size}/${newHash.size}/${qRange.size}/${qHash.size})`);

  const CW = 128;
  const KW = 54;
  const KH = 24;
  const draw = (place: (k: number) => number, title: (s: number) => string, hot: Set<number>): Item[] => {
    const items: Item[] = [];
    const counts = Array.from({ length: SHARDS }, () => 0);
    for (let s = 0; s < SHARDS; s++) {
      const x = s * (CW + 16);
      const keys = all.filter((k) => place(k) === s);
      items.push(...region(`sh${s}`, x, 18, CW, 22 + Math.ceil(7 / 2) * (KH + 4) + 6, title(s), { tone: hot.has(s) ? "accent" : "ghost", labelTone: hot.has(s) ? "accent" : "soft" }));
      keys.forEach((k, i) => {
        counts[s]++;
        const isNew = NEW.includes(k);
        items.push(box(`k${k}`, x + 8 + (i % 2) * (KW + 4), 28 + Math.floor(i / 2) * (KH + 4), k, { w: KW, h: KH, size: 11.5, tone: isNew ? "strong" : inQ(k) ? "accent" : "plain" }));
      });
    }
    return items;
  };
  const fmtRange = (s: number) => {
    const [lo, hi] = ranges[s];
    return `shard ${s + 1}: ${lo}–${hi ?? "…"}`;
  };
  return finish({
    title: "Sharding order ids by range and by hash",
    input: `orders ${OLD[0]}–${OLD[OLD.length - 1]}, then new orders ${NEW.join(", ")}`,
    frames: [
      {
        caption: `By range, each shard holds a contiguous run of ids. A range query for ${RANGE_Q[0]}–${RANGE_Q[1]} (blue) stays on one shard, but every new order, ${NEW.join(", ")} (solid), lands on the last shard: a hot spot.`,
        items: draw(byRange, fmtRange, newRange),
      },
      {
        caption: `By hash, each id goes to shard (FNV-1a hash of the id) mod ${SHARDS}. The new orders spread over ${newHash.size} shards, but neighbouring ids are scattered, so the same range query must ask ${qHash.size === SHARDS ? "every shard" : `${qHash.size} shards`}.`,
        items: draw(byHash, (s) => `shard ${s + 1}: hash mod ${SHARDS} = ${s}`, newHash),
      },
    ],
  });
}

export const FIGURES: Record<string, () => Walkthrough> = {
  "four-models": fourModels,
  partition,
  replication,
  quorum,
  sharding,
};
