import { dayKey } from "./clock.js";

/**
 * Diwali 2026, "Light seven diyas" (the owner's ask, 2026-11-04): 4 to 10
 * November, one diya for each day, lit by an accepted coding or SQL submission
 * on that day in the product's calendar. A missed day stays dark; there is no
 * catching up.
 *
 * Which days are lit is derived from the submissions and never stored. What
 * is stored is what the lights earned, as two `Honour` rows, because a frame
 * must reach every author payload and those already carry the kinds
 * (HONOUR_SELECT), and because the badge outlives the campaign:
 *
 *   1 diya  → the frame, worn until FESTIVAL_LAST_DAY (the client's lib/festival.ts checks the date)
 *   3 diyas → the Diwali card, drawn in the browser, so nothing to store
 *   7 diyas → the badge `festival-7` for good (lib/badges.ts)
 *
 * Neither kind is in lib/honours.ts HONOURS on purpose: an honour there plays
 * a celebration, wears the star and appears in the admin's grant list. Bug
 * hunts do not light a diya because a hunt's PASS can be forged.
 *
 * Everything is keyed on the date, so the campaign switches itself off and
 * nothing needs a deploy to end it. Mirrored by the SPA's lib/festival.ts.
 */

export const FESTIVAL_DAYS = ["2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10"] as const;
/** Diyas the badge takes: every day's. */
export const FESTIVAL_GOAL = FESTIVAL_DAYS.length;
/** The day after the last diya: the home still shows the result, and the frame is still worn. */
export const FESTIVAL_LAST_DAY = "2026-11-11";

export const FESTIVAL_FRAME_KIND = "diwali_2026_diya";
export const FESTIVAL_BADGE_KIND = "diwali_2026";

/** The window of submissions that can light a diya, as instants (IST midnights). */
export const FESTIVAL_WINDOW = {
  from: new Date("2026-11-04T00:00:00+05:30"),
  until: new Date("2026-11-11T00:00:00+05:30"),
};

export interface FestivalSlice {
  /** The days lit, in calendar order. */
  lit: string[];
}

/** Whether the home shows the strip at all: the seven days and the day after. */
export function festivalShowing(now: Date): boolean {
  const today = dayKey(now);
  return today >= FESTIVAL_DAYS[0] && today <= FESTIVAL_LAST_DAY;
}

/** Whether a solve at this instant can light a diya. */
export function festivalLighting(now: Date): boolean {
  return (FESTIVAL_DAYS as readonly string[]).includes(dayKey(now));
}

/** The festival days these accepted submissions fall on: each once, in order. */
export function litDays(instants: readonly Date[]): string[] {
  const days = new Set(instants.map((at) => dayKey(at)));
  return FESTIVAL_DAYS.filter((day) => days.has(day));
}

/** The Honour kinds this many lit days has earned. */
export function festivalKinds(lit: number): string[] {
  if (lit >= FESTIVAL_GOAL) return [FESTIVAL_FRAME_KIND, FESTIVAL_BADGE_KIND];
  return lit >= 1 ? [FESTIVAL_FRAME_KIND] : [];
}

/**
 * The announcement's window: the first day, 08:00–21:00 in the product zone. Wide
 * because the campaign started the day it shipped, on the owner's word, and a
 * job whose window has passed is skipped rather than caught up (lib/scheduler).
 */
export function festivalAnnouncePeriod(now: Date, hour: number): string | null {
  return dayKey(now) === FESTIVAL_DAYS[0] && hour >= 8 && hour < 21 ? "diwali-2026" : null;
}

export const FESTIVAL_ANNOUNCEMENT = {
  type: "diwali_2026_start",
  title: "Happy Diwali! Light seven diyas",
  body: "Solve any problem to light a diya, one a day until 10 November. Light all seven for a limited-edition badge.",
  href: "/",
};
