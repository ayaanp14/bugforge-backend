import { createHash } from "node:crypto";
import { HAIRLINE, INK, MIST, SECONDARY, TEAL, TEAL_DEEP, el, renderCard, text, type Child, type Node } from "./og-card.js";

/**
 * A tournament's link-preview picture (og:image), 1200×630 PNG — what
 * WhatsApp, LinkedIn, X and Telegram show under a shared
 * battles.codekairo.com/t/<slug> link. Until 2026-09-29 every tournament
 * shared the site's one card (frontend public/og/battles.png, "Host a coding
 * tournament…"), so a player inviting friends sent a picture that named
 * neither the tournament nor who runs it.
 *
 * Drawn here, not at the edge: the Battles Worker is on Cloudflare's free
 * plan, whose 10 ms of CPU a request cannot lay out and rasterise a card.
 * satori lays the tree out and turns the text into paths (so resvg needs no
 * fonts of its own), resvg rasterises — both pure JS/WASM, so the arm64 image
 * needs no native build. A render is ~70 ms (~300 ms for the first, which
 * loads the WASM and fonts); services/battles-seo keeps each version an hour
 * and Cloudflare keeps the versioned URL a year.
 *
 * The look is the site's own card (frontend scripts/make-battles-og-image.mjs):
 * white ground, ink type, one teal, Gilroy —
 * no gradient, glow or grid (frontend DESIGN_SYSTEM.md). No person's name
 * ever goes on it, as nowhere in battles-seo.
 *
 * content/og holds what it draws with: the Gilroy weights decompressed to TTF from the site's own woff2 (satori reads TTF/OTF/WOFF,
 * not WOFF2), and the light brand mark as PNG. The Dockerfile copies
 * content/ beside dist/, hence the path.
 */

export interface TournamentCard {
  slug: string;
  title: string;
  org: string;
  verified: boolean;
  format: "knockout" | "icpc";
  teamSize: number;
  capacity: number | null;
  startsAt: Date;
  registrationClosesAt: Date;
  durationMinutes: number;
  problems: number;
  phase: "registration" | "registration_closed" | "live" | "finished" | "cancelled";
}

/** Bumped with any change to the layout, so the new look is a new URL too (the platforms keep the old picture per URL). */
const CARD_DESIGN = 2;

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/**
 * A short hash of everything the card draws — the `?v=` on its URL, so a
 * change of title, time or phase is a new address and no cache (the edge's,
 * WhatsApp's, LinkedIn's) keeps showing the old picture.
 */
export function cardVersion(card: TournamentCard): string {
  const drawn = [CARD_DESIGN, card.slug, card.title, card.org, card.verified, card.format, card.teamSize, card.capacity, card.startsAt.toISOString(), card.registrationClosesAt.toISOString(), card.durationMinutes, card.problems, card.phase];
  return createHash("sha1").update(JSON.stringify(drawn)).digest("hex").slice(0, 10);
}

/* ── Words ─────────────────────────────────────────────────────── */

const DAY = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short" });
const CLOCK = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const parts = (f: Intl.DateTimeFormat, d: Date) => Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
/** "Fri 2 Oct" — ICU's en-IN puts a comma after the weekday. */
function day(d: Date): string {
  const p = parts(DAY, d);
  return `${p["weekday"]} ${p["day"]} ${p["month"]}`;
}
/** "20:00 IST" — the product's calendar is Indian time (services/battles-seo istTime). */
const clock = (d: Date) => `${CLOCK.format(d)} IST`;

function minutes(n: number): string {
  const h = Math.floor(n / 60);
  const m = n % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

const STATUS: Record<TournamentCard["phase"], { label: string; accent: boolean }> = {
  registration: { label: "Registration open", accent: true },
  registration_closed: { label: "Registration closed", accent: false },
  live: { label: "Live now", accent: true },
  finished: { label: "Finished", accent: false },
  cancelled: { label: "Cancelled", accent: false },
};

/** The four figures along the bottom — a big value and one word, by format. */
function facts(c: TournamentCard): { value: string; unit: string }[] {
  const icpc = c.format === "icpc";
  return [
    { value: day(c.startsAt), unit: clock(c.startsAt) },
    { value: minutes(c.durationMinutes), unit: icpc ? "contest" : "a match" },
    { value: c.problems ? String(c.problems) : "TBA", unit: c.problems === 1 ? "problem" : "problems" },
    c.capacity ? { value: String(c.capacity), unit: icpc ? "team places" : "places" } : { value: "Open", unit: "no cap" },
  ];
}

/**
 * The title's size by its length: one line at display size for a short
 * name, down to three lines for the 140 characters a title may have
 * (battles-rules titleMax). Gilroy Bold averages ~0.53 em a character over
 * the 1,056 px measure.
 */
function titleSize(title: string): { size: number; lines: number } {
  const n = title.length;
  if (n <= 18) return { size: 112, lines: 1 };
  if (n <= 24) return { size: 96, lines: 1 };
  if (n <= 40) return { size: 76, lines: 2 };
  if (n <= 62) return { size: 64, lines: 2 };
  return { size: 52, lines: 3 };
}

/* ── The tree ──────────────────────────────────────────────────── */

// The palette and the element helpers are lib/og-card's, shared with the
// content pages' cards (the colours make-battles-og-image.mjs draws with).

function svg(width: number, height: number, children: Node[]): Node {
  return { type: "svg", props: { width, height, viewBox: "0 0 24 24", fill: "none", children } };
}
const path = (d: string, extra: Record<string, unknown> = {}): Node => ({ type: "path", props: { d, stroke: "currentColor", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round", ...extra } });

/** The check the page's "Verified organizer" line wears (NavIcons CheckGlyph), in a teal disc. */
const verifiedMark = (size: number) =>
  el({ alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: size / 2, backgroundColor: TEAL, color: "#FFFFFF", flexShrink: 0 }, svg(size * 0.62, size * 0.62, [path("M5 12.5 10 17.5 19 7")]));

/**
 * The card. Sized for the thumbnail, not the file: LinkedIn's preview is
 * drawn from a copy ~300 px wide and WhatsApp's is ~400, so a quarter of
 * every size here is what a reader sees. The first cut (2026-09-29) had
 * 16–20 px labels, notes and the page's address, and on LinkedIn they were
 * a grey smear that made the whole card look broken; nothing here is under
 * 36 px or lighter than semibold, and the hairlines became solid shapes.
 */
function tree(c: TournamentCard, mark: string): Node {
  const status = STATUS[c.phase];
  const { size, lines } = titleSize(c.title);
  const format = c.format === "icpc" ? `ICPC-style contest · teams of ${c.teamSize}` : "1v1 coding knockout";

  const header = el(
    { alignItems: "center", justifyContent: "space-between", width: "100%" },
    el(
      { alignItems: "center", gap: 18 },
      { type: "img", props: { src: mark, width: 88, height: 58, style: { width: 88, height: 58 } } },
      el({ fontSize: 44, fontWeight: 700, letterSpacing: "-0.015em", color: INK }, "CodeKairo", el({ color: TEAL, marginLeft: 11 }, "Battles")),
    ),
    el(
      { alignItems: "center", gap: 14, height: 68, paddingLeft: 26, paddingRight: 30, borderRadius: 34, backgroundColor: status.accent ? TEAL_DEEP : MIST, color: status.accent ? "#FFFFFF" : SECONDARY, fontSize: 32, fontWeight: 700 },
      el({ width: 16, height: 16, borderRadius: 8, backgroundColor: status.accent ? "#23A5FD" : "#9A9A9A" }),
      status.label,
    ),
  );

  const who = el(
    { alignItems: "center", marginTop: 20, fontSize: 40, fontWeight: 600, color: SECONDARY, maxWidth: "100%" },
    el({ flexShrink: 0, marginRight: 12 }, "by"),
    text({ color: INK, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1 }, c.org),
    c.verified && el({ marginLeft: 14, flexShrink: 0 }, verifiedMark(40)),
  );

  const band = el(
    { width: "100%", borderTop: `3px solid ${HAIRLINE}`, paddingTop: 30 },
    ...facts(c).map((f, i) =>
      el(
        { flexDirection: "column", flex: i === 0 ? 1.35 : 1, minWidth: 0 },
        text({ fontSize: 50, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.05, color: INK, whiteSpace: "nowrap" }, f.value),
        text({ marginTop: 6, fontSize: 36, fontWeight: 600, lineHeight: 1.1, color: SECONDARY, whiteSpace: "nowrap" }, f.unit),
      ),
    ),
  );

  return el(
    { width: CARD_WIDTH, height: CARD_HEIGHT, flexDirection: "column", backgroundColor: "#FFFFFF", padding: "48px 72px 50px", fontFamily: "Gilroy", color: INK },
    header,
    el(
      { flexDirection: "column", flex: 1, justifyContent: "center", width: "100%" },
      text({ fontSize: 34, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TEAL_DEEP }, format),
      text({ marginTop: 10, fontSize: size, fontWeight: 700, lineHeight: 1.04, letterSpacing: "-0.03em", color: INK, lineClamp: lines, maxWidth: "100%" }, c.title),
      who,
    ),
    band,
  );
}

/* ── Rendering ─────────────────────────────────────────────────── */

/** The card as PNG bytes (the fonts, mark and WASM are lib/og-card's). */
export function renderTournamentCard(card: TournamentCard): Promise<Buffer> {
  return renderCard((mark) => tree(card, mark), CARD_WIDTH, CARD_HEIGHT);
}
