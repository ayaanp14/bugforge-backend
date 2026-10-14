/**
 * A bug hunt's code map as SVG markup, for the hunt's static-first view
 * (lib/seo-views/bug-hunt.ts → frontend lib/seo/views/api/bug-hunt.ts).
 *
 * A line-for-line port of the SPA's frontend/src/components/diagrams/
 * code-map.tsx (the reading of the files, the call order, the geometry) and
 * of the primitives it draws with (core.tsx: textW, Box, Txt, Arrow,
 * DiagramSvg's 6 px pad), writing the same elements as a string instead of
 * JSX. Why it exists at all: the map sits right under the briefing's
 * description, so at 768 × 1024 and 1920 × 1080 its first cards are inside
 * the first viewport (measured 2026-10-14: four and eight of its text runs),
 * and a view that left them out painted a hole the app then filled. Change
 * code-map.tsx and this together — `npx tsx scripts/…` is not needed, the
 * view's compare (frontend scripts/static-views) shows any drift as moved or
 * missing text runs at 768 and 1920.
 */

export interface MapFile {
  filePath: string;
  content: string;
  isEditable: boolean;
  language: string;
}

type Kind = "fn" | "method" | "class" | "const";

interface Def {
  id: number;
  file: number;
  name: string;
  owner?: string;
  kind: Kind;
  line: number;
  exported: boolean;
}

interface Import {
  alias: string | null;
  file: number;
  member: string | null;
}

interface Parsed {
  defs: Def[];
  imports: Import[];
  lines: string[];
}

const KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "return", "function", "typeof", "new", "else", "do", "try", "throw", "await", "yield",
  "super", "this", "self", "print", "len", "range", "int", "str", "float", "list", "dict", "set", "tuple", "isinstance", "sorted",
  "min", "max", "sum", "abs", "any", "all", "map", "filter", "zip", "enumerate", "require", "bug_require", "synchronized", "assert",
]);

const baseName = (p: string) => p.split("/").pop() ?? p;
const stem = (p: string) => baseName(p).replace(/\.(js|mjs|cjs|ts|py|java)$/, "");

function resolve(files: MapFile[], from: number, spec: string): number {
  const dir = files[from]!.filePath.split("/").slice(0, -1);
  const joined = spec.startsWith(".")
    ? spec.split("/").reduce((acc, part) => (part === "." ? acc : part === ".." ? acc.slice(0, -1) : [...acc, part]), dir).join("/")
    : spec.replace(/\./g, spec.includes("/") ? "." : "/");
  const want = joined.replace(/\.(js|mjs|cjs|ts|py|java)$/, "");
  let hit = files.findIndex((f) => f.filePath.replace(/\.(js|mjs|cjs|ts|py|java)$/, "") === want);
  if (hit < 0) hit = files.findIndex((f) => f.filePath.replace(/\.(js|mjs|cjs|ts|py|java)$/, "").endsWith(`/${want.split("/").pop()}`) || stem(f.filePath) === want.split("/").pop());
  return hit;
}

function parseFile(files: MapFile[], index: number, nextId: () => number): Parsed {
  const f = files[index]!;
  const lines = f.content.split("\n");
  const defs: Def[] = [];
  const imports: Import[] = [];
  const lang = f.language.toLowerCase();
  const add = (name: string, kind: Kind, line: number, exported: boolean, owner?: string) => {
    if (!name || KEYWORDS.has(name)) return;
    if (defs.some((d) => d.name === name && d.owner === owner && d.kind !== "class")) return;
    defs.push({ id: nextId(), file: index, name, kind, line, exported, owner });
  };

  if (lang === "python") {
    let cls: { name: string; indent: number } | null = null;
    lines.forEach((ln, i) => {
      const imp = ln.match(/^\s*(\w+)\s*=\s*bug_require\(\s*["']([^"']+)["']\s*\)(?:\.(\w+))?/);
      if (imp) { const t = resolve(files, index, imp[2]!); if (t >= 0 && t !== index) imports.push({ alias: imp[1]!, file: t, member: imp[3] ?? null }); return; }
      const from = ln.match(/^from\s+([\w.]+)\s+import\s+(.+)$/);
      if (from) {
        const t = resolve(files, index, from[1]!);
        if (t >= 0 && t !== index) for (const name of from[2]!.split(",").map((x) => x.trim().split(/\s+as\s+/))) imports.push({ alias: name[1] ?? name[0]!, file: t, member: name[0]! });
        return;
      }
      const imp2 = ln.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?/);
      if (imp2) { const t = resolve(files, index, imp2[1]!); if (t >= 0 && t !== index) imports.push({ alias: imp2[2] ?? imp2[1]!.split(".").pop()!, file: t, member: null }); return; }
      const indent = ln.match(/^(\s*)/)![1]!.length;
      if (cls && ln.trim() && indent <= cls.indent) cls = null;
      const c = ln.match(/^(\s*)class\s+(\w+)/);
      if (c) { add(c[2]!, "class", i, !c[2]!.startsWith("_")); cls = { name: c[2]!, indent }; return; }
      const d = ln.match(/^(\s*)(?:async\s+)?def\s+(\w+)\s*\(/);
      if (d) {
        if (/^__\w+__$/.test(d[2]!)) return;
        add(d[2]!, cls ? "method" : "fn", i, !d[2]!.startsWith("_"), cls?.name);
        return;
      }
      const k = ln.match(/^([A-Z][A-Z0-9_]+)\s*=/);
      if (k) add(k[1]!, "const", i, true);
    });
  } else if (lang === "java") {
    let cls: string | null = null;
    lines.forEach((ln, i) => {
      const c = ln.match(/^\s*(?:(?:public|final|abstract|static|sealed)\s+)*(?:class|interface|enum|record)\s+(\w+)/);
      if (c) { cls = c[1]!; add(c[1]!, "class", i, true); return; }
      const k = ln.match(/\bstatic\s+final\s+[\w<>[\],.?\s]+?\s+([A-Z][A-Z0-9_]+)\s*=/);
      if (k) { add(k[1]!, "const", i, !/\bprivate\b/.test(ln), cls ?? undefined); return; }
      const m = ln.match(/^\s*(?:(?:public|private|protected|static|final|synchronized|abstract|default)\s+)*(?:<[^>]+>\s+)?([\w<>[\],.?]+)\s+(\w+)\s*\([^)]*\)?\s*(?:throws\s+[\w.,\s]+)?\s*(?:\{.*)?$/);
      if (m && !/^(return|new|else|throw|case)$/.test(m[1]!) && !/^\s*(return|new|else|throw)\b/.test(ln) && !/=/.test(ln.split("(")[0]!) && m[2] !== cls) {
        add(m[2]!, "method", i, !/\bprivate\b/.test(ln), cls ?? undefined);
      }
    });
  } else {
    let cls: string | null = null;
    const exported = new Set<string>();
    lines.forEach((ln, i) => {
      for (const r of ln.matchAll(/(?:(?:var|let|const)\s+(\w+)\s*=\s*)?require\(\s*["']([^"']+)["']\s*\)(?:\.(\w+))?/g)) {
        const t = resolve(files, index, r[2]!);
        if (t >= 0 && t !== index) imports.push({ alias: r[1] ?? null, file: t, member: r[3] ?? null });
      }
      const es = ln.match(/^\s*import\s+(?:(\w+)|\{([^}]+)\}|\*\s+as\s+(\w+))\s+from\s+["']([^"']+)["']/);
      if (es) {
        const t = resolve(files, index, es[4]!);
        if (t >= 0 && t !== index) {
          if (es[2]) for (const part of es[2].split(",").map((x) => x.trim().split(/\s+as\s+/))) imports.push({ alias: part[1] ?? part[0]!, file: t, member: part[0]! });
          else imports.push({ alias: (es[1] ?? es[3])!, file: t, member: null });
        }
        return;
      }
      if (/^\S/.test(ln) && !/^\s*(?:export\s+)?class\b/.test(ln) && !/^\s*}/.test(ln)) cls = null;
      const c = ln.match(/^\s*(?:export\s+)?class\s+(\w+)/);
      if (c) { cls = c[1]!; add(c[1]!, "class", i, /export/.test(ln)); return; }
      const fnDecl = ln.match(/^\s*(export\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/);
      if (fnDecl) { add(fnDecl[2]!, "fn", i, !!fnDecl[1]); return; }
      const ex = ln.match(/^\s*(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=\s*(.*)$/);
      if (ex) {
        exported.add(ex[1]!);
        if (/^(async\s+)?(function\b|\(|[A-Za-z_$][\w$]*\s*=>)/.test(ex[2]!)) add(ex[1]!, "fn", i, true);
        else if (/^[A-Za-z_$][\w$]*\s*;?\s*$/.test(ex[2]!)) exported.add(ex[2]!.replace(/;?\s*$/, ""));
        else add(ex[1]!, "const", i, true);
        return;
      }
      const me = ln.match(/module\.exports\s*=\s*\{([^}]*)\}/);
      if (me) me[1]!.split(",").map((x) => x.trim().split(":")[0]!.trim()).filter(Boolean).forEach((x) => exported.add(x));
      const arrow = ln.match(/^\s*(export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/);
      if (arrow) { add(arrow[2]!, "fn", i, !!arrow[1]); return; }
      const k = ln.match(/^(export\s+)?(?:const|let|var)\s+([A-Z][A-Z0-9_]+)\s*=/);
      if (k) { add(k[2]!, "const", i, !!k[1]); return; }
      const prop = ln.match(/^\s+([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?function\b/);
      if (prop) { add(prop[1]!, "fn", i, true); return; }
      const hung = ln.match(/^\s*([A-Za-z_$][\w$]*)(?:\.prototype)?\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>)/);
      if (hung && hung[1] !== "exports" && hung[1] !== "module") { add(hung[2]!, "method", i, true, hung[1]); return; }
      const method = ln.match(/^\s+(?:static\s+)?(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{\s*$/);
      if (method && !KEYWORDS.has(method[1]!)) add(method[1]!, cls ? "method" : "fn", i, true, cls ?? undefined);
    });
    for (const d of defs) if (exported.has(d.name)) d.exported = true;
  }
  return { defs, imports, lines };
}

interface Link { from: number; to: number; kind: "call" | "ref" }

function buildLinks(files: MapFile[], parsed: Parsed[]): { links: Link[]; recursive: Set<number> } {
  const all = parsed.flatMap((p) => p.defs);
  const links: Link[] = [];
  const seen = new Set<string>();
  const recursive = new Set<number>();
  const push = (from: Def, to: Def | undefined, kind: Link["kind"] = "call") => {
    if (!to || (to.kind === "class" && kind === "ref")) return;
    if (to.id === from.id) { recursive.add(from.id); return; }
    const key = `${from.id}>${to.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ from: from.id, to: to.id, kind });
  };
  const unique = (pred: (d: Def) => boolean) => {
    const hits = all.filter(pred);
    return hits.length === 1 ? hits[0] : undefined;
  };

  parsed.forEach((p, fi) => {
    const bodies = p.defs.filter((d) => d.kind !== "const").sort((a, b) => a.line - b.line);
    bodies.forEach((d, k) => {
      if (d.kind === "class") return;
      const end = bodies[k + 1]?.line ?? p.lines.length;
      const body = p.lines.slice(d.line + 1, end).join("\n")
        .replace(/\/\/.*$|#.*$/gm, "")
        .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
      for (const m of body.matchAll(/(\b[A-Za-z_$][\w$]*)\s*\.\s*([A-Za-z_$][\w$]*)\s*(\()?/g)) {
        const [, obj, member, call] = m;
        const imp = p.imports.find((x) => x.alias === obj);
        if (imp) {
          push(d, parsed[imp.file]!.defs.find((x) => x.name === member && x.kind !== "class"), call ? "call" : "ref");
        } else if (obj === "this" || obj === "self") {
          if (call) push(d, p.defs.find((x) => x.name === member && x.owner === d.owner && x.kind === "method"));
        } else if (call) {
          const byClass = all.find((x) => x.kind === "class" && x.name === obj);
          if (byClass) push(d, all.find((x) => x.owner === obj && x.name === member && x.kind !== "class"));
          else if (member !== d.name) push(d, unique((x) => x.name === member && x.kind === "method" && x.file !== fi), "call");
        } else if (all.some((x) => x.kind === "class" && x.name === obj)) {
          push(d, all.find((x) => x.owner === obj && x.name === member && x.kind === "const"), "ref");
        }
      }
      for (const m of body.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
        const name = m[1]!;
        if (KEYWORDS.has(name)) continue;
        const local = p.defs.find((x) => x.name === name && (x.kind === "fn" || (x.kind === "method" && x.owner === d.owner) || x.kind === "class"));
        if (local) { push(d, local, "call"); continue; }
        const imp = p.imports.find((x) => x.alias === name);
        if (imp) {
          const target = parsed[imp.file]!.defs.find((x) => x.name === (imp.member ?? name) && x.kind !== "const");
          push(d, target, "call");
          continue;
        }
        if (files[fi]!.language === "java") push(d, unique((x) => x.name === name && x.kind === "class"), "call");
      }
      for (const m of body.matchAll(/\bnew\s+([A-Z]\w*)\s*\(/g)) push(d, all.find((x) => x.kind === "class" && x.name === m[1] && x.file !== fi), "call");
      for (const c of all.filter((x) => x.kind === "const")) {
        if (c.file === fi && new RegExp(`(?<![.\\w$])${c.name}\\b`).test(body)) push(d, c, "ref");
      }
    });
  });
  return { links, recursive };
}

// ── Drawing (core.tsx's primitives as strings) ─────────────────────
const ROW_H = 22;
const HEAD_H = 30;
const CARD_GAP = 18;
const MAX_ROWS = 9;
const PAD = 6;

const MONO = "var(--font-mono), 'JetBrains Mono', monospace";
const SANS = "var(--font-sans), system-ui, sans-serif";
const INK = { ink: "var(--color-text)", soft: "var(--color-text-secondary)", faint: "var(--color-text-tertiary)", accent: "var(--color-accent)", onStrong: "var(--color-on-primary)" } as const;

const textW = (s: string, size: number, mono = true) => s.length * size * (mono ? 0.6 : 0.56);
const q = (n: number) => Math.round(n * 10) / 10;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const NBSP = String.fromCharCode(0xa0);
const keepSpaces = (s: string) => (/ {2}|^ | $/.test(s) ? s.replace(/ /g, NBSP) : s);

function txt(x: number, y: number, text: string, o: { size?: number; tone?: keyof typeof INK; anchor?: "start" | "middle" | "end"; mono?: boolean; weight?: number; italic?: boolean } = {}): string {
  const style = `fill:${INK[o.tone ?? "ink"]};font-family:${o.mono ?? true ? MONO : SANS};font-size:${o.size ?? 12}px;font-weight:${o.weight ?? 500}${o.italic ? ";font-style:italic" : ""}`;
  return `<text x="${q(x)}" y="${q(y)}" text-anchor="${o.anchor ?? "middle"}" dominant-baseline="central" style="${esc(style)}">${esc(keepSpaces(text))}</text>`;
}

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, head: number, dashed: boolean): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const tl = Math.hypot(dx, dy) || 1;
  const ux = dx / tl;
  const uy = dy / tl;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const hw = head * 0.55;
  return (
    `<g><path d="M${q(x1)} ${q(y1)} L${q(bx)} ${q(by)}" style="fill:none;stroke:${color};stroke-width:1.25${dashed ? ";stroke-dasharray:4 3" : ""}"/>` +
    `<polygon points="${q(x2)},${q(y2)} ${q(bx - uy * hw)},${q(by + ux * hw)} ${q(bx + uy * hw)},${q(by - ux * hw)}" style="fill:${color}"/></g>`
  );
}

const rowText = (d: Def) => (d.kind === "const" ? d.name : d.kind === "class" ? `class ${d.name}` : `${d.owner ? `${d.owner}.` : ""}${d.name}()`);
const clip = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The map as DiagramSvg draws it: the `<svg>` (its natural size, scaled down only by CSS), or null when the SPA draws none. */
export function codeMapSvg(files: MapFile[], tests: string[], hiddenTests: number): { svg: string; w: number; h: number } | null {
  try {
    return draw(files, tests, hiddenTests);
  } catch {
    // Patterns over arbitrary source: a surprise costs the map (HuntCodeMap does the same).
    return null;
  }
}

function draw(files: MapFile[], tests: string[], hiddenTests: number): { svg: string; w: number; h: number } | null {
  if (files.length === 0) return null;
  let id = 0;
  const parsed = files.map((_, i) => parseFile(files, i, () => id++));
  const { links, recursive } = buildLinks(files, parsed);
  const defs = parsed.flatMap((p) => p.defs);
  const byId = new Map(defs.map((d) => [d.id, d]));

  const fileEdges = new Set(links.map((l) => `${byId.get(l.from)!.file}>${byId.get(l.to)!.file}`).filter((k) => k.split(">")[0] !== k.split(">")[1]));
  for (const p of parsed.map((p, i) => ({ p, i }))) for (const imp of p.p.imports) fileEdges.add(`${p.i}>${imp.file}`);
  const order: number[] = [];
  const state = new Map<number, number>();
  const visit = (f: number) => {
    if (state.get(f) === 2 || state.get(f) === 1) return;
    state.set(f, 1);
    for (const k of fileEdges) { const [a, b] = k.split(">").map(Number); if (a === f) visit(b!); }
    state.set(f, 2);
    order.unshift(f);
  };
  const starts = files.map((f, i) => ({ f, i })).sort((a, b) => Number(b.f.isEditable) - Number(a.f.isEditable)).map((x) => x.i);
  for (const i of [...starts].reverse()) visit(i);

  const words = tests.join(" ").toLowerCase();
  const callable = defs.filter((d) => d.kind === "fn" || d.kind === "method");
  let entries = callable.filter((d) => d.name.length > 2 && words.includes(d.name.toLowerCase()));
  if (entries.length === 0) entries = callable.filter((d) => files[d.file]!.isEditable && d.exported && !links.some((l) => l.to === d.id && byId.get(l.from)!.file === d.file));
  if (entries.length === 0) entries = callable.filter((d) => files[d.file]!.isEditable).slice(0, 1);
  entries = entries.slice(0, 4);

  const rowsOf = (fi: number) => {
    const ds = parsed[fi]!.defs.filter((d) => d.kind !== "class" || !parsed[fi]!.defs.some((x) => x.owner === d.name));
    return ds.slice(0, MAX_ROWS);
  };
  const cardW = Math.min(360, Math.max(230, ...files.map((f, fi) => Math.max(textW(f.filePath, 11.5) + 90, ...rowsOf(fi).map((d) => textW(clip(rowText(d)), 12) + 40)))));
  const left = 64;
  const testsH = 28;
  let y = testsH + 26;
  const rowY = new Map<number, number>();
  const cards: Array<{ fi: number; y: number; h: number; rows: Def[]; more: number }> = [];
  for (const fi of order) {
    const rows = rowsOf(fi);
    const more = parsed[fi]!.defs.filter((d) => d.kind !== "class" || !parsed[fi]!.defs.some((x) => x.owner === d.name)).length - rows.length;
    const h = HEAD_H + Math.max(1, rows.length) * ROW_H + (more > 0 ? ROW_H : 0) + 6;
    rows.forEach((d, k) => rowY.set(d.id, y + HEAD_H + k * ROW_H + ROW_H / 2));
    cards.push({ fi, y, h, rows, more });
    y += h + CARD_GAP;
  }
  const bottom = y - CARD_GAP;

  const headY = new Map(cards.map((c) => [c.fi, c.y + HEAD_H / 2 - 1]));
  const linked = new Set(links.map((l) => `${byId.get(l.from)!.file}>${byId.get(l.to)!.file}`));
  const arcs: Array<{ y1: number; y2: number; kind: "call" | "ref" | "import"; hot: boolean }> = [
    ...links.filter((l) => rowY.has(l.from) && rowY.has(l.to)).map((l) => ({
      y1: rowY.get(l.from)!,
      y2: rowY.get(l.to)!,
      kind: l.kind,
      hot: files[byId.get(l.from)!.file]!.isEditable || files[byId.get(l.to)!.file]!.isEditable,
    })),
    ...parsed.flatMap((p, fi) =>
      [...new Set(p.imports.map((imp) => imp.file))]
        .filter((to) => !linked.has(`${fi}>${to}`))
        .map((to) => ({ y1: headY.get(fi)!, y2: headY.get(to)!, kind: "import" as const, hot: files[fi]!.isEditable || files[to]!.isEditable })),
    ),
  ].sort((a, b) => Math.abs(a.y1 - a.y2) - Math.abs(b.y1 - b.y2));
  const lanes: Array<Array<[number, number]>> = [];
  const laneOf = arcs.map((a) => {
    const lo = Math.min(a.y1, a.y2);
    const hi = Math.max(a.y1, a.y2);
    let k = lanes.findIndex((lane) => lane.every(([p, q2]) => hi < p - 4 || lo > q2 + 4));
    if (k < 0) { k = lanes.length; lanes.push([]); }
    lanes[k]!.push([lo, hi]);
    return k;
  });
  const calls = arcs.filter((a) => a.kind === "call").length;
  const right = left + cardW;
  const gutter = 26 + lanes.length * 14;

  const testLabel = `tests · ${tests.length} visible${hiddenTests ? ` + ${hiddenTests} hidden` : ""}`;
  const testW = textW(testLabel, 11.5, false) + 24;
  const width = right + gutter + 8;
  const legendY = bottom + 22;

  let el = "";
  el += `<rect x="${q(left)}" y="0" width="${q(testW)}" height="${q(testsH)}" rx="14" style="fill:var(--color-accent);stroke:var(--color-accent);stroke-width:0"/>`;
  el += txt(left + testW / 2, testsH / 2 + 0.5, testLabel, { size: 11.5, tone: "onStrong", mono: false, weight: 600 });
  entries.filter((d) => rowY.has(d.id)).forEach((d, k) => {
    const ty = rowY.get(d.id)!;
    const x0 = left + 18 + k * 8;
    el +=
      `<g><path d="M${x0} ${testsH} L${x0} ${testsH + 8} Q${x0} ${testsH + 14} ${x0 - 8} ${testsH + 14} L${left - 22 - k * 8} ${testsH + 14} L${left - 22 - k * 8} ${ty}" style="fill:none;stroke:var(--color-accent);stroke-width:1.25;stroke-dasharray:4 3"/>` +
      `${arrow(left - 22 - k * 8, ty, left - 2, ty, "var(--color-accent)", 5, true)}</g>`;
  });

  for (const { fi, y: cy, h, rows, more } of cards) {
    const f = files[fi]!;
    const dir = f.filePath.includes("/") ? f.filePath.slice(0, f.filePath.lastIndexOf("/") + 1) : "";
    el += `<g><rect x="${left}" y="${cy}" width="${cardW}" height="${h}" rx="6" style="fill:var(--color-surface);stroke:${f.isEditable ? "var(--color-accent)" : "var(--color-border-strong)"};stroke-width:${f.isEditable ? 1.6 : 1}${f.isEditable ? "" : ";stroke-dasharray:4 3"}"/>`;
    el += `<rect x="${left + 0.5}" y="${cy + 0.5}" width="${cardW - 1}" height="${HEAD_H - 4}" rx="6" style="fill:${f.isEditable ? "var(--color-accent)" : "var(--color-bg-subtle)"};fill-opacity:${f.isEditable ? 0.1 : 1}"/>`;
    el +=
      `<text x="${left + 12}" y="${cy + HEAD_H / 2 - 1}" dominant-baseline="central" style="font-family:${esc(MONO)};font-size:11.5px">` +
      `<tspan style="fill:var(--color-text-tertiary)">${esc(clip(dir, 26))}</tspan><tspan style="fill:var(--color-text);font-weight:600">${esc(baseName(f.filePath))}</tspan></text>`;
    el += txt(left + cardW - 10, cy + HEAD_H / 2 - 1, f.isEditable ? "EDITABLE" : "LOCKED", { anchor: "end", size: 10, tone: f.isEditable ? "accent" : "faint", mono: false, weight: 600 });
    if (rows.length === 0) el += txt(left + 14, cy + HEAD_H + ROW_H / 2, "no functions — data or config", { anchor: "start", size: 11, tone: "faint", mono: false, italic: true });
    rows.forEach((d, k) => {
      const ry = cy + HEAD_H + k * ROW_H;
      const entry = entries.includes(d);
      el += "<g>";
      if (f.isEditable && d.kind !== "const") el += `<rect x="${left + 6}" y="${ry + 2}" width="${cardW - 12}" height="${ROW_H - 4}" rx="3" style="fill:var(--color-accent);fill-opacity:${entry ? 0.14 : 0.06}"/>`;
      el += txt(left + 14, ry + ROW_H / 2, clip(rowText(d)), { anchor: "start", size: 12, tone: d.kind === "const" ? "faint" : "ink", weight: entry ? 600 : 500, italic: d.kind === "const" });
      if (recursive.has(d.id)) el += txt(right - 12, ry + ROW_H / 2, "↻ recursive", { anchor: "end", size: 11, tone: "accent", mono: false });
      el += "</g>";
    });
    if (more > 0) el += txt(left + 14, cy + HEAD_H + rows.length * ROW_H + ROW_H / 2, `+${more} more`, { anchor: "start", size: 11, tone: "faint", mono: false });
    el += "</g>";
  }

  arcs.forEach((a, k) => {
    const { y1, y2 } = a;
    const bulge = 18 + laneOf[k]! * 14;
    const color = a.hot ? "var(--color-accent)" : "var(--color-text-tertiary)";
    const x = right + 2;
    el +=
      `<g><path d="M${x} ${y1} C${x + bulge} ${y1} ${x + bulge} ${y2} ${x + 7} ${y2}" style="fill:none;stroke:${color};stroke-width:${a.kind === "import" ? 1 : 1.3}${a.kind === "ref" ? ";stroke-dasharray:3 3" : a.kind === "import" ? ";stroke-dasharray:1 3" : ""}"/>` +
      `<polygon points="${x},${y2} ${x + 7},${y2 - 3.5} ${x + 7},${y2 + 3.5}" style="fill:${color}"/><circle cx="${x + 1}" cy="${y1}" r="2.2" style="fill:${color}"/>` +
      (a.kind === "import" ? txt(x + bulge + 4, (y1 + y2) / 2, "imports", { anchor: "start", size: 9.5, tone: "faint", mono: false }) : "") +
      "</g>";
  });

  el +=
    `<g><rect x="${left}" y="${legendY - 5}" width="12" height="10" rx="2" style="fill:var(--color-accent);fill-opacity:0.12;stroke:var(--color-accent)"/>` +
    txt(left + 18, legendY, "you can edit", { anchor: "start", size: 10.5, tone: "soft", mono: false }) +
    `<rect x="${left + 96}" y="${legendY - 5}" width="12" height="10" rx="2" style="fill:none;stroke:var(--color-border-strong);stroke-dasharray:3 2"/>` +
    txt(left + 114, legendY, "locked context", { anchor: "start", size: 10.5, tone: "soft", mono: false }) +
    txt(left + 206, legendY, "● → calls   ┄ reads a constant   ⋯ imports", { anchor: "start", size: 10.5, tone: "soft", mono: false }) +
    "</g>";

  const fnCount = callable.length;
  const label = `Code map: ${files.length} file${files.length === 1 ? "" : "s"} (${files.filter((f) => f.isEditable).map((f) => f.filePath).join(", ")} editable), ${fnCount} function${fnCount === 1 ? "" : "s"}, ${calls} call${calls === 1 ? "" : "s"} between them.`;
  const bw = Math.max(width + (arcs.some((a) => a.kind === "import") ? 40 : 0), left + 340);
  const bh = legendY + 10;
  const w = Math.ceil(bw + PAD * 2);
  const h = Math.ceil(bh + PAD * 2);
  return {
    svg: `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" style="display:block;max-width:100%;height:auto;overflow:visible"><g transform="translate(${PAD} ${PAD})">${el}</g></svg>`,
    w,
    h,
  };
}
