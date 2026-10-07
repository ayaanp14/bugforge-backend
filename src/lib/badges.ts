/**
 * The achievement badges, as the server needs them (2026-10-07).
 *
 * The badges are derived on the client (frontend lib/badges.ts — the profile's
 * wall, the share sheet): every one is a threshold on a counter /api/me
 * already carries, so there is no table and nothing to award. The server
 * needs the same table for one reason only: a badge can now be *shared* — to
 * the community feed and as a /share/<id> picture — and a shared win is a
 * claim the server checks against the account's own numbers before putting
 * it in front of anyone (services/achievements.ts). Keep the two tables in
 * step: same ids, same thresholds, same counters; `badges.test.ts` pins the
 * list so a change here is a deliberate one.
 */

export type BadgeTrack = "solver" | "hunter" | "streak" | "road";

export interface Badge {
  /** `<track>-<threshold>`, the id the client sends. */
  id: string;
  track: BadgeTrack;
  tier: 1 | 2 | 3 | 4;
  name: string;
  threshold: number;
}

export interface BadgeCounters {
  problemsSolved: number;
  sqlSolved: number;
  bugsFixed: number;
  longestStreak: number;
  chestsOpened: number;
}

const b = (track: BadgeTrack, tier: Badge["tier"], threshold: number, name: string): Badge => ({ id: `${track}-${threshold}`, track, tier, name, threshold });

export const BADGES: readonly Badge[] = [
  b("solver", 1, 1, "First Solve"),
  b("solver", 1, 10, "Warmed Up"),
  b("solver", 2, 25, "Problem Solver"),
  b("solver", 2, 50, "Algorithm Adept"),
  b("solver", 3, 100, "Centurion"),
  b("solver", 3, 250, "Code Machine"),
  b("solver", 4, 500, "Legend"),

  b("hunter", 1, 1, "Bug Spotter"),
  b("hunter", 2, 10, "Exterminator"),
  b("hunter", 3, 25, "Debugger"),
  b("hunter", 4, 50, "Bug Slayer"),

  b("streak", 1, 3, "On a Roll"),
  b("streak", 2, 7, "Week Warrior"),
  b("streak", 3, 30, "Monthly Grind"),
  b("streak", 4, 100, "Unstoppable"),

  b("road", 1, 1, "Road Opener"),
  b("road", 2, 2, "Core Climber"),
  b("road", 3, 3, "Advanced Ascent"),
  b("road", 4, 4, "Road Walker"),
];

export function badgeById(id: unknown): Badge | null {
  return typeof id === "string" ? (BADGES.find((x) => x.id === id) ?? null) : null;
}

/** The counter a track reads — the solver track counts SQL problems too, as the client's does. */
export function counterFor(track: BadgeTrack, c: BadgeCounters): number {
  if (track === "solver") return c.problemsSolved + c.sqlSolved;
  if (track === "hunter") return c.bugsFixed;
  if (track === "streak") return c.longestStreak;
  return c.chestsOpened;
}

/**
 * The counters off a /api/me payload (services/me.ts getMePayload) — the very
 * numbers the client's wall was drawn from, so a badge the page shows as
 * earned is one the server agrees with. The longest streak includes the
 * current one; the larger is taken in case one was refreshed and not the other.
 */
export function countersOfMe(me: {
  stats?: { problemsSolved?: number; sqlSolved?: number; bugsFixed?: number; longestStreak?: number; currentStreak?: number } | null;
  roadmapRewards?: readonly unknown[] | null;
}): BadgeCounters {
  const s = me.stats;
  return {
    problemsSolved: s?.problemsSolved ?? 0,
    sqlSolved: s?.sqlSolved ?? 0,
    bugsFixed: s?.bugsFixed ?? 0,
    longestStreak: Math.max(s?.longestStreak ?? 0, s?.currentStreak ?? 0),
    chestsOpened: me.roadmapRewards?.length ?? 0,
  };
}

/** What the badge stands for, as a noun phrase for a sentence: "a 7-day streak", "25 problems solved". */
export function badgeFeat(badge: Badge): string {
  const n = badge.threshold;
  if (badge.track === "solver") return n === 1 ? "a first problem solved" : `${n} problems solved`;
  if (badge.track === "hunter") return n === 1 ? "a first bug fixed" : `${n} bugs fixed`;
  if (badge.track === "streak") return `a ${n}-day streak`;
  if (n === 1) return "a first roadmap chest opened";
  return n === BADGES.filter((x) => x.track === "road").length ? "every roadmap chest opened" : `${n} roadmap chests opened`;
}

export function hasBadge(badge: Badge, c: BadgeCounters): boolean {
  return counterFor(badge.track, c) >= badge.threshold;
}
