import fs from "node:fs/promises";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

/**
 * What every server-drawn link-preview card shares: the palette, the tiny
 * element helpers satori's tree is written with, the fonts and brand mark,
 * and the render itself. Split out of lib/battles-card.ts (2026-09-30) when
 * the content pages got cards of their own (lib/content-card.ts) — resvg's
 * WASM may be initialised once per process, so the two cannot each load it.
 *
 * satori lays the tree out and turns the text into paths (so resvg needs no
 * fonts of its own), resvg rasterises — both pure JS/WASM, so the arm64 image
 * needs no native build. content/og holds what the cards draw with: the
 * Gilroy weights decompressed to TTF from the site's own woff2 (satori reads
 * TTF/OTF/WOFF, not WOFF2) and the light brand mark as PNG. The Dockerfile
 * copies content/ beside dist/, hence the path.
 */

// palette.ts, light mode — the colours the site's own cards are drawn in.
export const INK = "#111111";
export const SECONDARY = "#5F5F5F";
export const HAIRLINE = "#E5E5E5";
export const MIST = "#F1F1F1";
export const TEAL = "#018790";
export const TEAL_DEEP = "#005461";

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

interface Assets {
  fonts: { name: string; data: Buffer; weight: 400 | 500 | 600 | 700 }[];
  mark: string;
}

const DIR = new URL("../../content/og/", import.meta.url);
let loading: Promise<Assets> | null = null;

/** The fonts, the mark and resvg's WASM, read once per process. */
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

/** A card tree as PNG bytes; `build` gets the brand mark as a data URI. */
export async function renderCard(build: (mark: string) => Node, width: number, height: number): Promise<Buffer> {
  const { fonts, mark } = await assets();
  const svgText = await satori(build(mark) as unknown as Parameters<typeof satori>[0], { width, height, fonts });
  const resvg = new Resvg(svgText, { fitTo: { mode: "original" }, font: { loadSystemFonts: false } });
  const image = resvg.render();
  try {
    return Buffer.from(image.asPng());
  } finally {
    image.free();
    resvg.free();
  }
}
