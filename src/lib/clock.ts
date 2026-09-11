/**
 * The calendar the product keeps.
 *
 * "Today", "yesterday" and "this week" appear in several places — the daily
 * bug-hunt allowance, the weekly interview allowance, the solving streak, the
 * activity heatmap — and each used to draw its day boundary from whatever
 * clock was nearest: the API's local time (UTC on Railway) or the database
 * session. For someone in India that boundary fell at 05:30 in the morning,
 * so a solve at 1 am extended yesterday's streak and a hunt used at 6 am was
 * not back until the next morning.
 *
 * One zone, fixed rather than read per user, so the same instant is the
 * same day for everyone and the SQL windows stay one range. IST, because the
 * product is sold in rupees to Indian colleges; `QUOTA_UTC_OFFSET_MINUTES`
 * moves it if that ever changes. (The daily contest is the one deliberate
 * exception: a contest day is a UTC day, so the board reads the same in any
 * zone.)
 */

export const CALENDAR_UTC_OFFSET_MINUTES = Number(process.env["QUOTA_UTC_OFFSET_MINUTES"] ?? 330);
const OFFSET_MS = CALENDAR_UTC_OFFSET_MINUTES * 60_000;

/** The instant's calendar fields in the product zone, as a UTC-shifted Date. */
export function zoned(now: Date): Date {
  return new Date(now.getTime() + OFFSET_MS);
}

/** Back from zone-local fields to the real instant. */
export function unzoned(local: Date): Date {
  return new Date(local.getTime() - OFFSET_MS);
}

/** 00:00 of the instant's day in the product zone, as a real instant. */
export function dayStart(now = new Date()): Date {
  const start = zoned(now);
  start.setUTCHours(0, 0, 0, 0);
  return unzoned(start);
}

/** Monday 00:00 of the instant's week in the product zone, as a real instant. */
export function weekStart(now = new Date()): Date {
  const start = zoned(now);
  // getUTCDay() is 0 for Sunday, which belongs to the week that began six days ago.
  const offset = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - offset);
  start.setUTCHours(0, 0, 0, 0);
  return unzoned(start);
}

/** The instant's day as YYYY-MM-DD in the product zone. */
export function dayKey(now = new Date()): string {
  return zoned(now).toISOString().slice(0, 10);
}

/** Whole calendar days from `earlier` to `later` in the product zone (0 = same day). */
export function daysBetween(earlier: Date, later: Date): number {
  const a = dayStart(earlier).getTime();
  const b = dayStart(later).getTime();
  return Math.round((b - a) / 86_400_000);
}
