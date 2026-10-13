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
    // A tag too long for a chip is left off rather than cut: the image model draws a cut tag's "…" as
    // written (the first live poster, 2026-10-13: "Programming…"), and the topic is in the label anyway.
    chips: chips.filter((c) => c.length <= 18).slice(0, 3),
    footer: "codekairo.com",
  };
}

/**
 * The instructions sent with the poster's base (lib/social/slide-card.ts
 * `renderPosterBase`) to the image model's edit endpoint. The base already
 * carries the design and the words, so the model is told to keep all of it
 * and only illustrate the empty lower half — in the slides' own flat style,
 * because left to a written description it drew glossy 3D (the first live
 * poster, 2026-10-13: "looks cheap", the owner).
 */
export function posterPrompt(item: Item, copy: SocialCopy): string {
  const w = posterWords(item, copy);
  const scene = copy.imageScene || `a simple visual metaphor for "${item.title}"`;
  return [
    `This image is a finished CodeKairo social media post. Edit it by adding one illustration — change nothing else.`,
    ``,
    `KEEP EXACTLY AS THEY ARE: the deep navy background (#003B75), the CodeKairo logo and wordmark at the top left, every word and its font, size, weight, colour and position ("${w.label}", "${w.headline}"${w.sub ? `, "${w.sub}"` : ""}${w.chips.length ? `, the tags ${w.chips.map((c) => `"${c}"`).join(", ")}` : ""}, and "${w.footer}" at the bottom), the thin line above the footer, and all the margins. Do not add, remove, move, restyle or re-letter any text.`,
    ``,
    `ADD, in the empty lower half only (between the last line of text and the thin line above the footer, inside the left and right margins): a flat illustration of ${scene}`,
    ``,
    `Illustration style — match the post's existing design: flat 2D vector art built from simple geometric shapes with crisp edges and rounded corners, like a modern product explainer or a tech company's blog header. Colours only from the post's palette: sky blue #7CC9FF, bright blue #3AA9FF, azure #0794F9, pale blue #B9E3FF and white, on the same navy background. Generous empty space around it; centred; it may sit slightly lower than the middle of the empty area.`,
    `Never: 3D, glossy or glass effects, glows, lens flares, gradients, shadows, photorealism, clip-art, people's faces, hands, logos, or any letters, words or numbers inside the illustration.`,
  ].join("\n");
}
