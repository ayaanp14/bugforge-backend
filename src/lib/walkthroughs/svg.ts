import type { Frame, Item, LineTone, TextTone, Tone, Walkthrough } from "./core.js";

/**
 * One frame as a static SVG string — for the preview script
 * (scripts/preview-walkthroughs.ts) that lays every frame of every
 * walkthrough side by side for review. The page itself draws frames with
 * React (frontend components/challenges/TopicWalkthrough.tsx) so it can
 * animate between them; the two follow the same rules, and the colours here
 * are the design system's variables with the light theme's values as the
 * fallback, so a preview reads like the page.
 */

const V = {
  ink: "var(--color-text, #111111)",
  soft: "var(--color-text-secondary, #5F5F5F)",
  faint: "var(--color-text-tertiary, #737373)",
  line: "var(--color-border-strong, #D6D6D6)",
  hair: "var(--color-border, #E5E5E5)",
  surface: "var(--color-surface, #FFFFFF)",
  well: "var(--color-bg-subtle, #F4F4F4)",
  accent: "var(--color-accent, #0164FD)",
  error: "var(--color-error, #C22D32)",
  onAccent: "var(--color-on-primary, #FFFFFF)",
  edge: "var(--color-text-disabled, #AFAFAF)",
};
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";
const SANS = "var(--font-sans), system-ui, sans-serif";

const BOX: Record<Tone, string> = {
  plain: `fill:${V.surface};stroke:${V.line}`,
  accent: `fill:${V.accent};fill-opacity:0.13;stroke:${V.accent}`,
  strong: `fill:${V.accent};stroke:${V.accent}`,
  muted: `fill:${V.well};stroke:${V.hair}`,
  error: `fill:${V.error};fill-opacity:0.1;stroke:${V.error}`,
  ghost: `fill:none;stroke:${V.line};stroke-dasharray:3 3`,
};
const BAND: Record<Tone, string> = {
  plain: `fill:${V.well}`,
  accent: `fill:${V.accent};fill-opacity:0.08`,
  strong: `fill:${V.accent};fill-opacity:0.16`,
  muted: `fill:${V.well}`,
  error: `fill:${V.error};fill-opacity:0.07`,
  ghost: `fill:none;stroke:${V.line};stroke-dasharray:3 3`,
};
const INK: Record<TextTone, string> = { ink: V.ink, soft: V.soft, faint: V.faint, accent: V.accent, error: V.error };
const STROKE: Record<LineTone, string> = { line: V.edge, faint: V.hair, accent: V.accent, error: V.error, ink: V.soft };
const onBox = (t: Tone): string => (t === "strong" ? V.onAccent : t === "muted" ? V.faint : t === "error" ? V.error : V.ink);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function text(x: number, y: number, s: string, o: { fill: string; size: number; mono?: boolean; weight?: number; anchor?: string }): string {
  return `<text x="${x}" y="${y}" text-anchor="${o.anchor ?? "middle"}" dominant-baseline="central" style="fill:${o.fill};font-family:${o.mono === false ? SANS : MONO};font-size:${o.size}px;font-weight:${o.weight ?? 500}">${esc(s)}</text>`;
}

/** An arrow's head as its own triangle (no <marker>: ids would collide between figures). */
function arrowHead(x2: number, y2: number, fromX: number, fromY: number, color: string, head = 6): { d: string; bx: number; by: number } {
  const tx = x2 - fromX;
  const ty = y2 - fromY;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const hw = head * 0.55;
  return { d: `<polygon points="${x2},${y2} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}" style="fill:${color}"/>`, bx, by };
}

export function itemSvg(it: Item): string {
  switch (it.k) {
    case "band":
      return `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="6" style="${BAND[it.tone ?? "accent"]}"/>`;
    case "cell": {
      const tone = it.tone ?? "plain";
      return `<rect x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" rx="4" style="${BOX[tone]};stroke-width:${tone === "strong" ? 0 : 1}"/>${it.text !== "" ? text(it.x + it.w / 2, it.y + it.h / 2 + 0.5, it.text, { fill: onBox(tone), size: it.size ?? 14, weight: tone === "strong" ? 600 : 500 }) : ""}`;
    }
    case "node": {
      const tone = it.tone ?? "plain";
      return `<circle cx="${it.x}" cy="${it.y}" r="${it.r}" style="${BOX[tone]};stroke-width:${tone === "strong" ? 0 : 1.25}"/>${text(it.x, it.y + 0.5, it.text, { fill: onBox(tone), size: it.size ?? 13, weight: 600 })}`;
    }
    case "edge": {
      const color = STROKE[it.tone ?? "line"];
      const dash = it.dashed ? ";stroke-dasharray:4 3" : "";
      const w = it.tone === "accent" || it.tone === "error" ? 2 : 1.4;
      let out: string;
      let mx = (it.x1 + it.x2) / 2;
      let my = (it.y1 + it.y2) / 2;
      if (it.bow) {
        const dx = it.x2 - it.x1;
        const dy = it.y2 - it.y1;
        const len = Math.hypot(dx, dy) || 1;
        const cx = mx - (dy / len) * it.bow;
        const cy = my + (dx / len) * it.bow;
        const head = it.arrow ? arrowHead(it.x2, it.y2, cx, cy, color) : null;
        out = `<path d="M${it.x1} ${it.y1} Q${cx} ${cy} ${head ? head.bx : it.x2} ${head ? head.by : it.y2}" style="fill:none;stroke:${color};stroke-width:${w}${dash}"/>${head ? head.d : ""}`;
        mx = (mx + cx) / 2;
        my = (my + cy) / 2;
      } else {
        const head = it.arrow ? arrowHead(it.x2, it.y2, it.x1, it.y1, color) : null;
        out = `<line x1="${it.x1}" y1="${it.y1}" x2="${head ? head.bx : it.x2}" y2="${head ? head.by : it.y2}" style="stroke:${color};stroke-width:${w}${dash}"/>${head ? head.d : ""}`;
      }
      if (it.label) out += `<rect x="${mx - it.label.length * 3.4 - 3}" y="${my - 8}" width="${it.label.length * 6.8 + 6}" height="16" rx="3" style="fill:${V.surface}"/>${text(mx, my, it.label, { fill: it.tone === "accent" ? V.accent : V.soft, size: 11 })}`;
      return out;
    }
    case "ptr": {
      const color = it.tone === "error" ? V.error : it.tone === "ink" ? V.soft : V.accent;
      const s = it.up === false ? -1 : 1;
      return `<polygon points="${it.x},${it.y} ${it.x - 4.5},${it.y + 7 * s} ${it.x + 4.5},${it.y + 7 * s}" style="fill:${color}"/>${text(it.x, it.y + 15 * s, it.label, { fill: color, size: 11, weight: 600 })}`;
    }
    case "span": {
      const color = STROKE[it.tone ?? "accent"];
      const t = it.down ? -5 : 5;
      return `<path d="M${it.x1} ${it.y + t} L${it.x1} ${it.y} L${it.x2} ${it.y} L${it.x2} ${it.y + t}" style="fill:none;stroke:${color};stroke-width:1.4"/>${it.label ? text((it.x1 + it.x2) / 2, it.down ? it.y + 10 : it.y - 9, it.label, { fill: it.tone === "error" ? V.error : it.tone === "accent" || !it.tone ? V.accent : V.soft, size: 10.5, mono: false, weight: 600 }) : ""}`;
    }
    case "text":
      return text(it.x, it.y, it.text, { fill: INK[it.tone ?? "ink"], size: it.size ?? 13, mono: it.mono ?? true, weight: it.weight, anchor: it.anchor ?? "start" });
    case "path": {
      const pts = it.pts.map(([x, y]) => `${x},${y}`).join(" ");
      const stroke = `stroke:${STROKE[it.tone ?? "line"]};stroke-width:${it.width ?? 1.6};stroke-linejoin:round;stroke-linecap:round${it.dashed ? ";stroke-dasharray:4 3" : ""}`;
      return it.closed || it.fill
        ? `<polygon points="${pts}" style="${it.fill ? BAND[it.fill] : "fill:none"};${stroke}"/>`
        : `<polyline points="${pts}" style="fill:none;${stroke}"/>`;
    }
  }
}

export function frameSvg(w: Walkthrough, f: Frame, label = w.title): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.width} ${w.height}" width="${w.width}" height="${w.height}" role="img" aria-label="${esc(label)}">${f.items.map(itemSvg).join("")}</svg>`;
}
