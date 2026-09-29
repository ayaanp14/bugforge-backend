import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";

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
 * white ground, ink type, one teal, hairlines, Gilroy and JetBrains Mono —
 * no gradient, glow or grid (frontend DESIGN_SYSTEM.md). No person's name
 * ever goes on it, as nowhere in battles-seo.
 *
 * content/og holds what it draws with: the Gilroy weights and JetBrains Mono
 * decompressed to TTF from the site's own woff2 (satori reads TTF/OTF/WOFF,
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

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/**
 * A short hash of everything the card draws — the `?v=` on its URL, so a
 * change of title, time or phase is a new address and no cache (the edge's,
 * WhatsApp's, LinkedIn's) keeps showing the old picture.
 */
export function cardVersion(card: TournamentCard): string {
  const drawn = [card.slug, card.title, card.org, card.verified, card.format, card.teamSize, card.capacity, card.startsAt.toISOString(), card.registrationClosesAt.toISOString(), card.durationMinutes, card.problems, card.phase];
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

/** What the four fact columns say, by format. */
function facts(c: TournamentCard): { label: string; value: string; note: string }[] {
  const icpc = c.format === "icpc";
  return [
    { label: c.phase === "finished" ? "Held" : c.phase === "live" ? "Started" : "Starts", value: day(c.startsAt), note: clock(c.startsAt) },
    icpc ? { label: "Contest", value: minutes(c.durationMinutes), note: "one clock, every team" } : { label: "Each match", value: minutes(c.durationMinutes), note: "first accepted wins" },
    { label: "Problems", value: c.problems ? String(c.problems) : "—", note: c.problems ? "revealed at the start" : "not set yet" },
    icpc
      ? { label: "Teams", value: c.capacity ? `${c.capacity} places` : "Open", note: `up to ${c.teamSize} a team` }
      : {
          label: "Players",
          value: c.capacity ? `${c.capacity} places` : "Open",
          note: c.phase === "registration" ? `closes ${day(c.registrationClosesAt)}` : "seeded by rating",
        },
  ];
}

/**
 * The title's size by its length: one line at display size for a short
 * name, down to three lines for the 140 characters a title may have
 * (battles-rules titleMax). Gilroy Bold averages ~0.53 em a character.
 */
function titleSize(title: string): { size: number; lines: number } {
  const n = title.length;
  if (n <= 22) return { size: 84, lines: 1 };
  if (n <= 46) return { size: 68, lines: 2 };
  if (n <= 72) return { size: 56, lines: 2 };
  return { size: 46, lines: 3 };
}

/* ── The tree ──────────────────────────────────────────────────── */

// palette.ts, light mode — the colours make-battles-og-image.mjs draws with.
const INK = "#111111";
const SECONDARY = "#5F5F5F";
const DISABLED = "#9A9A9A";
const HAIRLINE = "#E5E5E5";
const TEAL = "#018790";
const TEAL_DEEP = "#005461";
const MONO = "JetBrains Mono";

type Style = Record<string, string | number>;
interface Node {
  type: string;
  props: { style?: Style; children?: Child | Child[]; [k: string]: unknown };
}
type Child = Node | string;

/** A box; satori lays out every element with more than one child as flex, so each is one. */
function el(style: Style, ...children: Array<Child | null | false>): Node {
  const kids = children.filter((c): c is Child => c !== null && c !== false);
  return { type: "div", props: { style: { display: "flex", ...style }, children: kids.length === 1 ? kids[0] : kids } };
}
/** A run of text that may wrap or clamp: a block, since satori clamps only blocks. */
const text = (style: Style, value: string): Node => ({ type: "div", props: { style: { display: "block", ...style }, children: value } });

function svg(width: number, height: number, children: Node[]): Node {
  return { type: "svg", props: { width, height, viewBox: "0 0 24 24", fill: "none", children } };
}
const path = (d: string, extra: Record<string, unknown> = {}): Node => ({ type: "path", props: { d, stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round", ...extra } });

/** The check the page's "Verified organizer" line wears (NavIcons CheckGlyph). */
const check = (size: number, color: string) => el({ color, width: size, height: size }, svg(size, size, [path("M5 12.5 10 17.5 19 7")]));
/** A chevron after the call to action. */
const chevron = (size: number, color: string) => el({ color, width: size, height: size }, svg(size, size, [path("M9 5.5 15.5 12 9 18.5")]));

function tree(c: TournamentCard, mark: string): Node {
  const status = STATUS[c.phase];
  const { size, lines } = titleSize(c.title);
  const eyebrow = c.format === "icpc" ? `ICPC-style contest · teams of up to ${c.teamSize}` : "1v1 coding knockout";
  const call = c.phase === "registration" ? (c.format === "icpc" ? "Ask the organizer to enter your team" : "Register free") : c.phase === "live" ? `Follow the ${c.format === "icpc" ? "scoreboard" : "bracket"}` : c.phase === "finished" ? "See the results" : null;

  const header = el(
    { alignItems: "center", justifyContent: "space-between", width: "100%" },
    el(
      { alignItems: "center", gap: 16 },
      { type: "img", props: { src: mark, width: 73, height: 48, style: { width: 73, height: 48 } } },
      el({ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em", color: INK }, "CodeKairo", el({ color: TEAL, marginLeft: 9 }, "Battles")),
    ),
    el(
      { alignItems: "center", gap: 12, height: 48, paddingLeft: 20, paddingRight: 22, borderRadius: 24, border: `1.5px solid ${status.accent ? TEAL : HAIRLINE}`, color: status.accent ? TEAL_DEEP : SECONDARY, fontSize: 22, fontWeight: 600 },
      el({ width: 12, height: 12, borderRadius: 6, backgroundColor: status.accent ? TEAL : DISABLED }),
      status.label,
    ),
  );

  const who = el(
    { alignItems: "center", marginTop: 18, fontSize: 30, fontWeight: 500, color: SECONDARY, maxWidth: "100%" },
    el({ flexShrink: 0, marginRight: 10 }, "by"),
    text({ color: INK, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 1 }, c.org),
    c.verified && el({ alignItems: "center", flexShrink: 0, marginLeft: 18, gap: 6, fontSize: 22, color: TEAL_DEEP }, check(24, TEAL), "Verified organizer"),
  );

  const band = el(
    { width: "100%", borderTop: `1.5px solid ${HAIRLINE}`, borderBottom: `1.5px solid ${HAIRLINE}` },
    ...facts(c).map((f, i) =>
      el(
        { flexDirection: "column", flex: 1, minWidth: 0, paddingTop: 22, paddingBottom: 22, paddingLeft: i ? 28 : 0, borderLeft: i ? `1.5px solid ${HAIRLINE}` : "none" },
        text({ fontFamily: MONO, fontSize: 16, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: DISABLED }, f.label),
        text({ marginTop: 10, fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", color: INK, whiteSpace: "nowrap" }, f.value),
        text({ marginTop: 6, fontSize: 20, fontWeight: 500, color: SECONDARY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }, f.note),
      ),
    ),
  );

  const footer = el(
    { alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 22 },
    text({ fontFamily: MONO, fontSize: 20, color: SECONDARY }, `battles.codekairo.com/t/${c.slug}`.slice(0, 64)),
    call && el({ alignItems: "center", gap: 4, fontSize: 24, fontWeight: 600, color: TEAL_DEEP }, call, chevron(24, TEAL)),
  );

  return el(
    { width: CARD_WIDTH, height: CARD_HEIGHT, flexDirection: "column", backgroundColor: "#FFFFFF", padding: "52px 72px 44px", fontFamily: "Gilroy", color: INK },
    header,
    el(
      { flexDirection: "column", flex: 1, justifyContent: "center", width: "100%" },
      text({ fontFamily: MONO, fontSize: 21, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEAL_DEEP }, eyebrow),
      text({ marginTop: 14, fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: "-0.025em", color: INK, lineClamp: lines, maxWidth: "100%" }, c.title),
      who,
    ),
    band,
    footer,
  );
}

/* ── Rendering ─────────────────────────────────────────────────── */

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
    const [g500, g600, g700, m400, m600, mark] = await Promise.all(
      ["Gilroy-500.ttf", "Gilroy-600.ttf", "Gilroy-700.ttf", "JetBrainsMono-400.ttf", "JetBrainsMono-600.ttf", "mark-light-144.png"].map(read),
    );
    return {
      fonts: [
        { name: "Gilroy", data: g500, weight: 500 },
        { name: "Gilroy", data: g600, weight: 600 },
        { name: "Gilroy", data: g700, weight: 700 },
        { name: MONO, data: m400, weight: 400 },
        { name: MONO, data: m600, weight: 600 },
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

/** The card as PNG bytes. */
export async function renderTournamentCard(card: TournamentCard): Promise<Buffer> {
  const { fonts, mark } = await assets();
  const svgText = await satori(tree(card, mark) as unknown as Parameters<typeof satori>[0], { width: CARD_WIDTH, height: CARD_HEIGHT, fonts });
  const resvg = new Resvg(svgText, { fitTo: { mode: "original" }, font: { loadSystemFonts: false } });
  const image = resvg.render();
  try {
    return Buffer.from(image.asPng());
  } finally {
    image.free();
    resvg.free();
  }
}
