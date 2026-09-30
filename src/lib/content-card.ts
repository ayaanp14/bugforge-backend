import { HAIRLINE, INK, MIST, SECONDARY, TEAL_DEEP, el, renderCard, text, type Node } from "./og-card.js";

/**
 * A content page's link-preview picture (og:image), 1200×630 PNG — what
 * WhatsApp, LinkedIn, X and Discord show under a shared problem, bug hunt,
 * lesson, aptitude question or test pattern. Until 2026-09-30 all 3,229
 * indexable pages shared the site's one card (frontend public/og/
 * codekairo.png), so a link sent to a study group named no problem at all.
 *
 * The same look as the Battles card (lib/battles-card.ts) and the site's
 * own: white ground, ink type, one teal, Gilroy; no gradient, glow or grid
 * (frontend DESIGN_SYSTEM.md). Sized for the thumbnail — the platforms draw
 * it ~300–400 px wide — so nothing is under 34 px or lighter than semibold.
 * What it says comes from the page's own head (services/seo.ts), so the
 * card never claims anything the page does not.
 */

export type ContentKind = "problem" | "bug" | "lesson" | "aptitude" | "test";

export interface ContentCard {
  kind: ContentKind;
  /** The chip at the top right: what kind of page this is. */
  label: string;
  /** The small uppercase line over the title. */
  eyebrow: string;
  title: string;
  /** Up to three figures along the bottom — a value and one word. */
  facts: Array<{ value: string; unit: string }>;
}

/** Bumped with any change to the layout: it is the `d=` on the card's URL, so the new look is a new address. */
export const CONTENT_CARD_DESIGN = 1;
export const CONTENT_CARD_WIDTH = 1200;
export const CONTENT_CARD_HEIGHT = 630;

/** The title's size by its length, one line down to three (Gilroy Bold is ~0.53 em a character over 1,056 px). */
function titleSize(title: string): { size: number; lines: number } {
  const n = title.length;
  if (n <= 24) return { size: 96, lines: 1 };
  if (n <= 40) return { size: 80, lines: 2 };
  if (n <= 62) return { size: 66, lines: 2 };
  if (n <= 90) return { size: 56, lines: 3 };
  return { size: 48, lines: 3 };
}

function tree(c: ContentCard, mark: string): Node {
  const { size, lines } = titleSize(c.title);
  const header = el(
    { alignItems: "center", justifyContent: "space-between", width: "100%" },
    el(
      { alignItems: "center", gap: 18 },
      { type: "img", props: { src: mark, width: 88, height: 58, style: { width: 88, height: 58 } } },
      el({ fontSize: 44, fontWeight: 700, letterSpacing: "-0.015em", color: INK }, "CodeKairo"),
    ),
    el({ alignItems: "center", height: 68, paddingLeft: 30, paddingRight: 30, borderRadius: 34, backgroundColor: MIST, color: SECONDARY, fontSize: 32, fontWeight: 700 }, c.label),
  );
  const band = el(
    { width: "100%", borderTop: `3px solid ${HAIRLINE}`, paddingTop: 30 },
    ...c.facts.slice(0, 3).map((f) =>
      el(
        { flexDirection: "column", flex: 1, minWidth: 0 },
        text({ fontSize: 50, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, f.value),
        text({ marginTop: 6, fontSize: 36, fontWeight: 600, lineHeight: 1.1, color: SECONDARY, whiteSpace: "nowrap" }, f.unit),
      ),
    ),
  );
  return el(
    { width: CONTENT_CARD_WIDTH, height: CONTENT_CARD_HEIGHT, flexDirection: "column", backgroundColor: "#FFFFFF", padding: "48px 72px 50px", fontFamily: "Gilroy", color: INK },
    header,
    el(
      { flexDirection: "column", flex: 1, justifyContent: "center", width: "100%" },
      text({ fontSize: 34, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TEAL_DEEP, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }, c.eyebrow),
      text({ marginTop: 10, fontSize: size, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.03em", color: INK, lineClamp: lines, maxWidth: "100%" }, c.title),
    ),
    band,
  );
}

/** The card as PNG bytes. */
export function renderContentCard(card: ContentCard): Promise<Buffer> {
  return renderCard((mark) => tree(card, mark), CONTENT_CARD_WIDTH, CONTENT_CARD_HEIGHT);
}

/**
 * The last cards drawn, by path. A render is ~70 ms and the API is not behind
 * a shared cache, but a preview is fetched once per share, not per visit — so
 * a small LRU (~200 × ~60 KB) covers a burst of shares of the same link
 * without letting 3,229 possible cards pile up in a 2 GB box.
 */
const MAX_CACHED = 200;
const recent = new Map<string, Buffer>();

export async function contentCardPng(key: string, card: ContentCard): Promise<Buffer> {
  const hit = recent.get(key);
  if (hit) {
    recent.delete(key);
    recent.set(key, hit);
    return hit;
  }
  const png = await renderContentCard(card);
  recent.set(key, png);
  if (recent.size > MAX_CACHED) recent.delete(recent.keys().next().value as string);
  return png;
}
