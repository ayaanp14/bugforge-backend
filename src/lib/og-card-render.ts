import fs from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { MARK, type Child, type Node } from "./og-card.js";

/**
 * The render itself: satori lays the tree out and turns the text into paths
 * (so resvg needs no fonts of its own), resvg rasterises — both pure JS/WASM,
 * so the arm64 image needs no native build. content/og holds what the cards
 * draw with: the Gilroy weights decompressed to TTF from the site's own woff2
 * (satori reads TTF/OTF/WOFF, not WOFF2) and the light brand mark as PNG. The
 * Dockerfile copies content/ beside dist/, hence the path.
 *
 * Loaded by lib/og-card-worker.ts, off the main thread (lib/og-card.ts says
 * why), and by lib/og-card.ts itself only when that worker cannot run.
 * resvg's WASM may be initialised once per isolate, which is why every card
 * kind renders through this one module.
 */

interface Assets {
  fonts: { name: string; data: Buffer; weight: 400 | 500 | 600 | 700 }[];
  mark: string;
}

const DIR = new URL("../../content/og/", import.meta.url);
let loading: Promise<Assets> | null = null;

/** The fonts, the mark and resvg's WASM, read once per isolate. */
function assets(): Promise<Assets> {
  loading ??= (async () => {
    const read = (name: string) => fs.readFile(new URL(name, DIR));
    const wasm = await fs.readFile(createRequire(import.meta.url).resolve("@resvg/resvg-wasm/index_bg.wasm"));
    await initWasm(wasm);
    const [g500, g600, g700, mark] = await Promise.all(["Gilroy-500.ttf", "Gilroy-600.ttf", "Gilroy-700.ttf", "mark-light-144.png"].map(read));
    return {
      fonts: [
        { name: "Gilroy", data: g500, weight: 500 },
        { name: "Gilroy", data: g600, weight: 600 },
        { name: "Gilroy", data: g700, weight: 700 },
      ],
      mark: `data:image/png;base64,${mark.toString("base64")}`,
    };
  })();
  // A failed read is retried on the next card rather than remembered.
  loading.catch(() => {
    loading = null;
  });
  return loading;
}

/** The tree with every `src` that names the MARK placeholder pointed at the brand mark's data URI. */
function withMark(child: Child, mark: string): Child {
  if (typeof child === "string") return child;
  const { children, ...props } = child.props;
  const out: Node = { type: child.type, props: props.src === MARK ? { ...props, src: mark } : props };
  if (children !== undefined) out.props.children = Array.isArray(children) ? children.map((c) => withMark(c, mark)) : withMark(children, mark);
  return out;
}

/** A card tree as PNG bytes. The array owns its buffer (resvg copies out of WASM memory), so it can be transferred. */
export async function renderTree(tree: Node, width: number, height: number): Promise<Uint8Array> {
  const { fonts, mark } = await assets();
  const svgText = await satori(withMark(tree, mark) as unknown as Parameters<typeof satori>[0], { width, height, fonts });
  const resvg = new Resvg(svgText, { fitTo: { mode: "original" }, font: { loadSystemFonts: false } });
  const image = resvg.render();
  try {
    return image.asPng();
  } finally {
    image.free();
    resvg.free();
  }
}
