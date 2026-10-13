/**
 * A social slide as a PNG — the satori tree for each `Slide` kind, in each
 * platform's size (calendar.ts FORMAT_SIZE), rendered on the card worker
 * thread like every server-drawn picture (lib/og-card.ts says why).
 *
 * The site's look (frontend DESIGN_SYSTEM.md, as lib/content-card.ts draws
 * it): white ground, ink type, the blue scale for meaning, Gilroy, no
 * gradient or glow. The cover and the closing slide sit on the brand's deep
 * blue — the surface the site uses for its own call-to-action bands — so a
 * carousel opens and closes on the brand and the middle reads as a page.
 *
 * satori does not fit text to a box, so sizes are chosen by length (the
 * `size` tables, ~0.5 em a Gilroy character) and every block is clamped as
 * the backstop: a long statement loses its tail, never the layout.
 */

import { HAIRLINE, INK, MIST, SECONDARY, TEAL, TEAL_DEEP, el, renderCard, text, type Child, type Node } from "../og-card.js";
import { FORMAT_SIZE, type Format } from "./calendar.js";
import type { Slide } from "./slides.js";
import type { PosterWords } from "./poster.js";

const WHITE = "#FFFFFF";
const BLUE_300 = "#7CC9FF";
const BLUE_200 = "#B9E3FF";

interface Frame {
  width: number;
  height: number;
  /** 1 for the 1080-wide formats; landscape type is a little smaller for its shorter page. */
  scale: number;
  pad: number;
}

const frameOf = (format: Format): Frame => {
  const { width, height } = FORMAT_SIZE[format];
  return { width, height, scale: format === "landscape" ? 0.86 : format === "square" ? 0.92 : 1, pad: format === "landscape" ? 72 : 84 };
};

/** A size for `s` from a table of [max length, px] steps, scaled to the frame. */
function size(s: string, steps: Array<[number, number]>, f: Frame): number {
  const px = steps.find(([max]) => s.length <= max)?.[1] ?? steps[steps.length - 1][1];
  return Math.round(px * f.scale);
}

function header(mark: string, dark: boolean, page: string, f: Frame): Node {
  const logo: Node = { type: "img", props: { src: mark, width: 66, height: 44, style: { width: 66, height: 44 } } };
  return el(
    { alignItems: "center", justifyContent: "space-between", width: "100%" },
    el(
      { alignItems: "center", gap: 14 },
      dark ? el({ alignItems: "center", justifyContent: "center", width: 84, height: 60, borderRadius: 14, backgroundColor: WHITE }, logo) : logo,
      el({ fontSize: Math.round(36 * f.scale), fontWeight: 700, letterSpacing: "-0.015em", color: dark ? WHITE : INK }, "CodeKairo"),
    ),
    page ? el({ fontSize: Math.round(28 * f.scale), fontWeight: 600, color: dark ? BLUE_200 : SECONDARY }, page) : null,
  );
}

function footer(dark: boolean, hint: string, f: Frame): Node {
  return el(
    { alignItems: "center", justifyContent: "space-between", width: "100%", borderTop: `2px solid ${dark ? "rgba(255,255,255,0.18)" : HAIRLINE}`, paddingTop: 24 },
    el({ fontSize: Math.round(28 * f.scale), fontWeight: 600, color: dark ? BLUE_200 : SECONDARY }, "codekairo.com"),
    hint ? el({ fontSize: Math.round(28 * f.scale), fontWeight: 700, color: dark ? WHITE : TEAL }, hint) : null,
  );
}

const eyebrow = (s: string, f: Frame, dark = false) =>
  text({ fontSize: Math.round(28 * f.scale), fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: dark ? BLUE_300 : TEAL, lineClamp: 1, maxWidth: "100%" }, s);

const heading = (s: string, f: Frame, px = 60) =>
  text({ marginTop: 14, fontSize: Math.round(px * f.scale), fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.025em", color: INK, lineClamp: 2, maxWidth: "100%" }, s);

function numbered(items: string[], f: Frame, px: number, numbers = true): Node {
  return el(
    { flexDirection: "column", gap: Math.round(26 * f.scale), marginTop: 36, width: "100%" },
    ...items.map((s, i) =>
      el(
        { alignItems: "flex-start", gap: 22, width: "100%" },
        numbers
          ? el(
              { alignItems: "center", justifyContent: "center", flexShrink: 0, width: Math.round(52 * f.scale), height: Math.round(52 * f.scale), borderRadius: 26, backgroundColor: TEAL, color: WHITE, fontSize: Math.round(28 * f.scale), fontWeight: 700 },
              String(i + 1),
            )
          : // A bullet centred on the first line: half the line height (1.38) less half the dot.
            el({ flexShrink: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: TEAL, marginTop: Math.round(px * 0.69 - 7), marginLeft: 8, marginRight: 8 }),
        text({ flex: 1, fontSize: px, fontWeight: 500, lineHeight: 1.38, color: INK, lineClamp: 4 }, s),
      ),
    ),
  );
}

/** The slide's own content, between the header and the footer. */
function body(s: Slide, f: Frame): Child {
  const column = (...kids: Array<Child | null>) => el({ flexDirection: "column", flex: 1, justifyContent: "center", width: "100%" }, ...kids);
  switch (s.kind) {
    case "cover":
      return column(
        eyebrow(s.eyebrow, f, true),
        text({ marginTop: 22, fontSize: size(s.title, [[18, 104], [32, 92], [48, 80], [80, 68]], f), fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.035em", color: WHITE, lineClamp: 4, maxWidth: "100%" }, s.title),
        s.sub ? text({ marginTop: 28, fontSize: Math.round(38 * f.scale), fontWeight: 500, lineHeight: 1.3, color: BLUE_200, lineClamp: 3, maxWidth: "100%" }, s.sub) : null,
        s.chips.length
          ? el(
              { gap: 14, marginTop: 40, flexWrap: "wrap" },
              ...s.chips.map((c) => el({ alignItems: "center", height: Math.round(56 * f.scale), paddingLeft: 26, paddingRight: 26, borderRadius: 28, border: `2px solid ${BLUE_300}`, color: WHITE, fontSize: Math.round(28 * f.scale), fontWeight: 600 }, c)),
            )
          : null,
      );
    case "text": {
      // A motivation slide has only a body: set it large, as the whole slide.
      if (!s.title && !s.eyebrow) return column(text({ fontSize: size(s.body, [[80, 72], [140, 62], [220, 54]], f), fontWeight: 700, lineHeight: 1.18, letterSpacing: "-0.025em", color: INK, lineClamp: 7 }, s.body));
      return column(
        eyebrow(s.eyebrow, f),
        heading(s.title, f),
        text({ marginTop: 32, fontSize: size(s.body, [[140, 48], [260, 42], [360, 38], [460, 34]], f), fontWeight: 500, lineHeight: 1.45, color: INK, lineClamp: f.height < 1000 ? 7 : 11 }, s.body),
      );
    }
    case "code": {
      const longest = Math.max(...s.code.split("\n").map((l) => l.length), 1);
      const px = Math.max(22, Math.min(36, Math.floor((f.width - 2 * f.pad - 80) / (longest * 0.56))));
      return column(
        eyebrow(s.eyebrow, f),
        heading(s.title, f),
        el(
          { marginTop: 32, width: "100%", padding: 36, borderRadius: 18, backgroundColor: MIST, border: `2px solid ${HAIRLINE}` },
          text({ fontSize: px, fontWeight: 500, lineHeight: 1.5, color: INK, whiteSpace: "pre-wrap" }, s.code),
        ),
      );
    }
    case "list":
      return column(eyebrow(s.eyebrow, f), heading(s.title, f), numbered(s.items, f, size(s.items.join(""), [[240, 40], [420, 36], [700, 32]], f), s.numbered !== false));
    case "options":
      return column(
        eyebrow(s.eyebrow, f),
        text({ marginTop: 18, fontSize: size(s.title, [[90, 52], [170, 44], [300, 38]], f), fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.015em", color: INK, lineClamp: 6 }, s.title),
        el(
          { flexDirection: "column", gap: 16, marginTop: 36, width: "100%" },
          ...s.options.map((o) =>
            el(
              { alignItems: "center", width: "100%", minHeight: Math.round(84 * f.scale), paddingLeft: 30, paddingRight: 30, borderRadius: 16, border: `2px solid ${HAIRLINE}`, backgroundColor: WHITE },
              text({ fontSize: Math.round(38 * f.scale), fontWeight: 600, color: INK, lineClamp: 2 }, o),
            ),
          ),
        ),
      );
    case "answer":
      return column(
        eyebrow(s.eyebrow, f),
        el(
          { marginTop: 18, alignSelf: "flex-start", alignItems: "center", paddingLeft: 34, paddingRight: 34, height: Math.round(96 * f.scale), borderRadius: 20, backgroundColor: TEAL, color: WHITE, fontSize: Math.round(52 * f.scale), fontWeight: 700 },
          s.answer,
        ),
        s.steps.length ? heading(s.title, f, 44) : null,
        s.steps.length ? numbered(s.steps, f, size(s.steps.join(""), [[240, 38], [420, 34], [700, 30]], f)) : null,
      );
    case "cta":
      return column(
        eyebrow(s.eyebrow, f, true),
        text({ marginTop: 22, fontSize: size(s.title, [[40, 84], [70, 72], [120, 60]], f), fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.03em", color: WHITE, lineClamp: 4, maxWidth: "100%" }, s.title),
        text({ marginTop: 26, fontSize: Math.round(38 * f.scale), fontWeight: 500, lineHeight: 1.3, color: BLUE_200, lineClamp: 2 }, s.sub),
        el(
          { marginTop: 44, alignSelf: "flex-start", alignItems: "center", paddingLeft: 32, paddingRight: 32, height: Math.round(80 * f.scale), borderRadius: 40, backgroundColor: WHITE, color: TEAL_DEEP, fontSize: Math.round(32 * f.scale), fontWeight: 700, maxWidth: "100%", overflow: "hidden" },
          s.url,
        ),
      );
  }
}

function tree(s: Slide, index: number, total: number, format: Format, mark: string): Node {
  const f = frameOf(format);
  const dark = s.kind === "cover" || s.kind === "cta";
  const hint = s.kind === "cover" && total > 1 && format !== "landscape" ? "Swipe  →" : "";
  return el(
    { width: f.width, height: f.height, flexDirection: "column", backgroundColor: dark ? TEAL_DEEP : WHITE, padding: f.pad, fontFamily: "Gilroy", color: INK },
    header(mark, dark, total > 1 ? `${index + 1} / ${total}` : "", f),
    body(s, f),
    footer(dark, hint, f),
  );
}

/** One slide as PNG bytes. */
export function renderSlide(slide: Slide, index: number, total: number, format: Format): Promise<Buffer> {
  const { width, height } = FORMAT_SIZE[format];
  return renderCard((mark) => tree(slide, index, total, format, mark), width, height);
}

/* ── The poster's base ───────────────────────────────────────────────── */

/** The poster's side in px: the image model's square size, so its edit keeps the layout one to one. */
export const POSTER_SIZE = 1024;

/**
 * The day's poster before the image model touches it: the cover slide's
 * design (deep blue, the logo, eyebrow, bold Gilroy headline, tags, the
 * footer) with the words in the top half and the lower half left empty.
 * It goes to the image model as the picture to edit (services/social.ts
 * `drawPoster`), which keeps the design and fills the empty half with an
 * illustration — the owner's ask: a poster that looks like the slides, not
 * one the model styled from a written description (the first live poster,
 * 2026-10-13, came back glossy and 3D). It is also the poster as it stands
 * when the image model fails.
 */
export function renderPosterBase(words: PosterWords): Promise<Buffer> {
  const f: Frame = { width: POSTER_SIZE, height: POSTER_SIZE, scale: 0.92, pad: 72 };
  const headPx = size(words.headline, [[22, 76], [36, 66], [60, 56]], f);
  return renderCard(
    (mark) =>
      el(
        { width: POSTER_SIZE, height: POSTER_SIZE, flexDirection: "column", backgroundColor: TEAL_DEEP, padding: f.pad, fontFamily: "Gilroy", color: WHITE },
        header(mark, true, "", f),
        el(
          { flexDirection: "column", marginTop: 44, width: "100%" },
          eyebrow(words.label, f, true),
          text({ marginTop: 18, fontSize: headPx, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.03em", color: WHITE, lineClamp: 3, maxWidth: "100%" }, words.headline),
          words.sub ? text({ marginTop: 20, fontSize: Math.round(32 * f.scale), fontWeight: 500, lineHeight: 1.3, color: BLUE_200, lineClamp: 2, maxWidth: "100%" }, words.sub) : null,
          words.chips.length
            ? el(
                { gap: 12, marginTop: 28, flexWrap: "wrap" },
                ...words.chips.map((c) => el({ alignItems: "center", height: 48, paddingLeft: 22, paddingRight: 22, borderRadius: 24, border: `2px solid ${BLUE_300}`, color: WHITE, fontSize: 24, fontWeight: 600 }, c)),
              )
            : null,
        ),
        // The empty half the image model fills.
        el({ flex: 1, width: "100%" }),
        footer(true, "", f),
      ),
    POSTER_SIZE,
    POSTER_SIZE,
  );
}
