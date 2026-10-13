/**
 * The day's poster: one picture drawn by an image model (lib/ai/provider
 * `openaiImage`), with its words in it — generated once a day and posted
 * on every platform (the owner's ask, 2026-10-13). Pure, pinned by
 * social.test.ts; services/social.ts makes the call and stores the bytes.
 *
 * What the image model is given:
 * - The exact words, short and quoted. Image models spell a short line
 *   reliably and a paragraph badly, so the poster carries the hook, a
 *   label ("Asked at Amazon", "Aptitude · Problems on Ages"), at most
 *   three chips (difficulty, topics) and "codekairo.com" — never the
 *   statement, the options or the answer. Those stay on the drawn slides
 *   (lib/social/slides.ts), quoted from the catalogue.
 * - The scene the text model described (`copy.imageScene`), with no words
 *   of its own.
 * - The brand: the site's blue scale on white, a flat editorial look, one
 *   geometric sans (frontend DESIGN_SYSTEM.md), no other company's logo.
 *
 * Still a draft: a person looks at the poster before it goes out, and the
 * page can draw it again.
 */

import type { Item } from "./item.js";
import type { SocialCopy } from "./slides.js";

/** The words on the poster, top to bottom. */
export interface PosterWords {
  label: string;
  headline: string;
  sub: string;
  chips: string[];
  footer: string;
}

const short = (s: string, max: number) => {
  const t = s.replace(/["“”]/g, "'").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
};

export function posterWords(item: Item, copy: SocialCopy): PosterWords {
  const label =
    item.theme === "company-dsa" && item.company
      ? `Asked at ${item.company}`
      : item.theme === "aptitude"
        ? `Aptitude${item.topics?.[0] ? ` · ${item.topics[0]}` : ""}`
        : item.theme === "concept"
          ? "DSA roadmap"
          : item.theme === "cs-fundamentals"
            ? `Interview · ${item.topics?.[0] ?? "CS fundamentals"}`
            : item.theme === "sql"
              ? "SQL interview problem"
              : item.theme === "product"
                ? (item.feature?.name ?? "CodeKairo")
                : "For your prep";
  const chips = item.theme === "motivation" || item.theme === "product" ? [] : [item.difficulty, ...(item.topics ?? []).slice(0, 2)].filter((s): s is string => Boolean(s));
  return {
    label: short(label, 40),
    headline: short(copy.hook || item.title, 60),
    sub: short(copy.sub, 80),
    chips: chips.slice(0, 3).map((c) => short(c, 20)),
    footer: "codekairo.com",
  };
}

export function posterPrompt(item: Item, copy: SocialCopy): string {
  const w = posterWords(item, copy);
  const lines = [
    `A square social media poster for CodeKairo, a coding-interview and placement preparation site for students in India.`,
    ``,
    `Picture: ${copy.imageScene || `a clean, abstract illustration of "${item.title}"`}`,
    ``,
    `Text on the poster — render each line exactly as written, spelled exactly, and add no other words, letters or numbers anywhere:`,
    `1. A small uppercase label near the top: "${w.label}"`,
    `2. The large bold headline: "${w.headline}"`,
    ...(w.sub ? [`3. A smaller line under the headline: "${w.sub}"`] : []),
    ...(w.chips.length ? [`4. Small rounded outline tags in a row: ${w.chips.map((c) => `"${c}"`).join(", ")}`] : []),
    `5. At the bottom edge, small: "${w.footer}"`,
    ``,
    `Style: flat, modern editorial illustration with clean vector shapes. Colours: deep navy blue #003B75 as the ground behind the text, white text, accents in bright blue #0794F9 and sky blue #7CC9FF, a little white space. One clean geometric sans-serif typeface, high contrast and easy to read on a phone. Leave generous margins so no text touches the edges.`,
    `Do not draw any company's logo, any brand mark other than plain text, any real person's face, code screenshots, or watermarks.`,
  ];
  return lines.join("\n");
}
