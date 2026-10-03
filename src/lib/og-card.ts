import { Worker } from "node:worker_threads";

/**
 * What every server-drawn link-preview card shares: the palette, the tiny
 * element helpers satori's tree is written with, and the render. Split out
 * of lib/battles-card.ts (2026-09-30) when the content pages got cards of
 * their own (lib/content-card.ts). The render itself (fonts, mark, satori,
 * resvg) is lib/og-card-render.ts.
 *
 * Cards render on a worker thread, never on the API's event loop. A card is
 * ~80 ms of synchronous WASM, and crawlers fetch them in bursts — Amazonbot
 * walking the 3,229 content cards drew 3,269 of them in 36 h, up to 30 in ten
 * seconds (2026-10-03). Measured from Caddy's log over those 36 h, a request
 * that overlapped a render took 124 ms on average and 70 % went over 50 ms;
 * every other request took 18 ms and 4.4 % went over. The worker puts the
 * renders on the box's second vCPU, which was otherwise idle.
 */

// palette.ts, light mode — the colours the site's own cards are drawn in.
export const INK = "#111111";
export const SECONDARY = "#5F5F5F";
export const HAIRLINE = "#E5E5E5";
export const MIST = "#F1F1F1";
export const TEAL = "#0164FD";
export const TEAL_DEEP = "#074099";

export type Style = Record<string, string | number>;
export interface Node {
  type: string;
  props: { style?: Style; children?: Child | Child[]; [k: string]: unknown };
}
export type Child = Node | string;

/** A box; satori lays out every element with more than one child as flex, so each is one. */
export function el(style: Style, ...children: Array<Child | null | false>): Node {
  const kids = children.filter((c): c is Child => c !== null && c !== false);
  return { type: "div", props: { style: { display: "flex", ...style }, children: kids.length === 1 ? kids[0] : kids } };
}
/** A run of text that may wrap or clamp: a block, since satori clamps only blocks. */
export const text = (style: Style, value: string): Node => ({ type: "div", props: { style: { display: "block", ...style }, children: value } });

/** What a card's tree puts in an img `src` for the brand mark; the renderer swaps in the image. */
export const MARK = "og-card:mark";

/** The worker ran and the card itself failed — drawing it again here would fail the same way. */
class CardRenderError extends Error {}

interface Pending {
  resolve: (png: Buffer) => void;
  reject: (err: Error) => void;
}
interface Reply {
  id: number;
  png?: Uint8Array;
  error?: string;
}

/**
 * Built, the worker is dist/lib/og-card-worker.js beside this file. Under tsx
 * (dev, tests) both are .ts sources, and a worker thread does not inherit
 * tsx's loader — not from execArgv, not from an explicit `--import tsx` (Node
 * 22.16: "Unknown file extension .ts") — so the thread registers it itself
 * through tsx's API before importing the worker. tsx is a devDependency,
 * absent from the production image, which never takes this branch.
 */
function spawnWorker(options: { resourceLimits: { maxOldGenerationSizeMb: number } }): Worker {
  if (!import.meta.url.endsWith(".ts")) return new Worker(new URL("./og-card-worker.js", import.meta.url), options);
  const entry = new URL("./og-card-worker.ts", import.meta.url).href;
  const tsx = import.meta.resolve("tsx/esm/api");
  return new Worker(`import(${JSON.stringify(tsx)}).then((t) => { t.register(); return import(${JSON.stringify(entry)}); });`, { ...options, eval: true });
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, Pending>();

/**
 * The one renderer thread, started on the first card and kept: crawlers ask
 * for cards all day, and a fresh thread pays for the fonts and the WASM again.
 * It holds the process open only while a card is in flight (ref/unref), so a
 * test or a shutdown never waits on it. A thread that dies fails what it had
 * in flight, and the next card starts a new one.
 */
function cardWorker(): Worker {
  if (worker) return worker;
  // The heap cap bounds a runaway render on a 2 GB box; past it the thread
  // dies, its cards fall back to the main thread, and the next one respawns it.
  const w = spawnWorker({ resourceLimits: { maxOldGenerationSizeMb: 128 } });
  w.unref();
  w.on("message", (reply: Reply) => {
    const job = pending.get(reply.id);
    if (!job) return;
    pending.delete(reply.id);
    if (pending.size === 0) w.unref();
    if (reply.png) job.resolve(Buffer.from(reply.png.buffer, reply.png.byteOffset, reply.png.byteLength));
    else job.reject(new CardRenderError(reply.error ?? "card render failed"));
  });
  const fail = (err: Error) => {
    if (worker === w) worker = null;
    for (const job of pending.values()) job.reject(err);
    pending.clear();
  };
  w.on("error", fail);
  w.on("exit", (code) => fail(new Error(`card renderer exited with code ${code}`)));
  worker = w;
  return w;
}

function inWorker(tree: Node, width: number, height: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const w = cardWorker();
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.ref();
    w.postMessage({ id, tree, width, height });
  });
}

let warned = false;

/**
 * A card tree as PNG bytes; `build` gets the brand mark's placeholder. If the
 * worker cannot render (it failed to start or died mid-card), the card is
 * drawn here instead — every other request waits ~80 ms behind it, but a
 * preview that 500s is worse — and that is said once in the log.
 */
export async function renderCard(build: (mark: string) => Node, width: number, height: number): Promise<Buffer> {
  const tree = build(MARK);
  try {
    return await inWorker(tree, width, height);
  } catch (err) {
    if (err instanceof CardRenderError) throw err;
    if (!warned) {
      warned = true;
      console.error("[og-card] worker render failed, drawing on the main thread:", err);
    }
    const { renderTree } = await import("./og-card-render.js");
    const png = await renderTree(tree, width, height);
    return Buffer.from(png.buffer, png.byteOffset, png.byteLength);
  }
}
