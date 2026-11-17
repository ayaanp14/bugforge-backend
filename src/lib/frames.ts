/**
 * Profile-picture frames (2026-11-17, the owner's ask: "the user can select
 * which frame he adds to his profile picture; he can earn some frames").
 *
 * Until then the frame was chosen *for* the member, in a fixed order —
 * founding member, then a worn credential, then the Diwali diya, then the
 * roadmap chests — so a founding member could never show the diya, and the
 * only choice anywhere was which credential to wear. Now the account picks
 * one frame (`User.wornFrame`), or leaves it on "Auto", which is that old
 * order unchanged; nothing moves for anyone who never opens the picker.
 *
 * **Earned, never claimed.** Every frame here is earned the way the goodies'
 * points are (lib/goodies.ts): only from evidence the server decided itself.
 * A coding solve (the expected outputs never leave the server), a SQL solve,
 * a daily-contest sitting, a finished study track, a completed company
 * simulation, an invitee's first solve, a proctored credential. Bug hunts
 * (a PASS can be forged), duels and community votes (two accounts of one
 * person can farm them) earn no frame. The rest are given by hand (Honour
 * rows, like the founding members), bought with goodies points, or limited
 * editions earned only inside their window and kept for good.
 *
 * **Derived, like the badges.** Nothing about earning is stored: `frameCards`
 * reads facts that already exist (services/frames.ts gathers them) and the
 * worn id is checked against them when it is put on. Every source here only
 * ever grows — solves, a best streak, a month's sittings, a track finished —
 * so a frame checked once stays earned, and an author payload can carry the
 * worn id alone. The three that can be lost (a credential expires or is
 * revoked, an honour is revoked, a road with no chest) are re-checked by the
 * client against fields every author payload already carries
 * (frontend lib/frames.ts resolveFrame), so a lost one falls back to Auto.
 *
 * What a frame *looks* like lives only in the SPA's mirror
 * (frontend/src/lib/frames.ts): the server never draws one. Keep the ids,
 * names and thresholds in step with it; `frames.test.ts` pins them.
 *
 * Import-free on purpose, like WORN_CREDENTIAL_SELECT (lib/skill-tests.ts):
 * WORN_FRAME_SELECT is spread into selects built at module load.
 */

export type FrameGroup = "standing" | "solving" | "streak" | "learning" | "kata" | "community" | "honour" | "limited" | "goodies";

export interface FrameCard {
  id: string;
  group: FrameGroup;
  name: string;
  /** How it is earned, one sentence. */
  how: string;
  earned: boolean;
  /** For a count: where the account stands. Null for a frame that is not a count. */
  progress: { have: number; need: number } | null;
  /** A goodies frame's price in points. */
  points?: number;
  /** Where to go to earn it. */
  href?: string;
}

/** What every author payload carries for the frame: the id worn, or null for Auto. */
export const WORN_FRAME_SELECT = { wornFrame: true } as const;

/** The longest id the column holds (`User.wornFrame`, VarChar(100)). */
export const FRAME_ID_MAX = 100;

/** Worn by choice: no frame at all, whatever is earned. */
export const NO_FRAME = "none";

// ── The catalogue ─────────────────────────────────────────────────

export const SOLVER_TIERS = [
  { id: "solver-50", name: "Solver I", need: 50 },
  { id: "solver-200", name: "Solver II", need: 200 },
  { id: "solver-500", name: "Solver III", need: 500 },
  { id: "solver-1000", name: "Solver IV", need: 1000 },
] as const;

/**
 * Hard problems solved on one's own: first accepted outside a pair room,
 * with the problem opened here (a ProblemEngagement row — the only proof of
 * what help was on screen, recorded since 2026-10-07) and no hint, editorial
 * or tutor help of either kind before that accept. The same "before the
 * solve" rule the skill profile scores independence by.
 */
export const UNASSISTED_HARD = 25;

export const STREAK_TIERS = [
  { id: "streak-30", name: "30-day streak", need: 30 },
  { id: "streak-100", name: "100-day streak", need: 100 },
  { id: "streak-365", name: "365-day streak", need: 365 },
] as const;

/** Daily problems solved on their own day (DailyContestEntry.solvedAt) within one calendar month. */
export const KATA_MONTH_SOLVES = 20;

/** Invited friends who made their first solve and paid the referrer (Referral.referrerCredits > 0 — a shared mailbox pays nothing). */
export const CONNECTOR_TIERS = [
  { id: "connector-3", name: "Connector", need: 3 },
  { id: "connector-10", name: "Super Connector", need: 10 },
] as const;

/**
 * Frames that stand for an Honour row (lib/honours.ts): the two that existed
 * before the picker, and three given by hand through scripts/grant-honour.ts
 * or the admin Honours tab. The hand-given three are not HONOURS kinds —
 * they carry no celebration, mail, lifetime access or star; only the frame.
 */
export const HONOUR_FRAMES = {
  founding: { kind: "founding_member", name: "Founding Member", how: "Given to the first members who built their practice on CodeKairo." },
  "diwali-2026": { kind: "diwali_2026_diya", name: "Diwali 2026", how: "Lit a diya during Diwali 2026 (5–11 November)." },
  ambassador: { kind: "frame_ambassador", name: "Campus Ambassador", how: "Given to CodeKairo's campus ambassadors.", href: "/ambassadors" },
  champion: { kind: "frame_champion", name: "Battles Champion", how: "Given to the winner of an official CodeKairo Battles tournament." },
  contributor: { kind: "frame_contributor", name: "Contributor", how: "Given for a reported bug, a fix or content that made it onto the site." },
} as const;
export type HonourFrameId = keyof typeof HONOUR_FRAMES;

/** The Honour kinds that exist only to give a frame — what grant-honour and the admin tab may grant besides HONOURS. */
export const FRAME_GRANT_KINDS: readonly string[] = [HONOUR_FRAMES.ambassador.kind, HONOUR_FRAMES.champion.kind, HONOUR_FRAMES.contributor.kind];
export const isFrameGrantKind = (kind: unknown): kind is string => typeof kind === "string" && FRAME_GRANT_KINDS.includes(kind);
/** The admin's words for a frame-only kind. */
export const frameGrantName = (kind: string): string | null => Object.values(HONOUR_FRAMES).find((f) => f.kind === kind)?.name ?? null;

/**
 * Limited editions: earned only inside their window (IST days, inclusive),
 * worn for good after. Shown before and during the window, and afterwards
 * only to those who earned it — a frame nobody can earn any more is not a
 * goal.
 */
export const LIMITED_FRAMES = [
  { id: "newyear-2027", name: "New Year 2027", how: "Solve a coding or SQL problem between 1 and 7 January 2027.", from: "2027-01-01", to: "2027-01-07" },
] as const;
export type LimitedFrame = (typeof LIMITED_FRAMES)[number];

/**
 * Frames bought with goodies points (services/goodies.ts redeems them like
 * any goodie). Looks only — no seal, nothing they claim — so buying one says
 * nothing that was not earned: the points themselves only come from judged work.
 */
export const FRAME_GOODIES = [
  { id: "goodies-orbit", name: "Orbit", blurb: "A dotted blue ring round your profile picture.", points: 300 },
  { id: "goodies-eclipse", name: "Eclipse", blurb: "A heavy ink ring round your profile picture.", points: 600 },
] as const;
export type FrameGoodie = (typeof FRAME_GOODIES)[number];
export const frameGoodieFor = (id: unknown): FrameGoodie | null => FRAME_GOODIES.find((g) => g.id === id) ?? null;

// ── Facts ─────────────────────────────────────────────────────────

export interface FrameFacts {
  /** Coding + SQL problems solved (the badges' solver count). */
  solved: number;
  unassistedHard: number;
  /** The longest solving streak, the current one included. */
  bestStreak: number;
  chests: number;
  /** Skill credentials that stand today. */
  credentials: number;
  /** Honour kinds held. */
  honours: readonly string[];
  /** "YYYY-MM" → daily problems solved on their own day that month. */
  kataMonths: Readonly<Record<string, number>>;
  /** Every published study track, and whether this account finished it. */
  tracks: ReadonlyArray<{ key: string; title: string; finished: boolean }>;
  /** Every topic hub's study plan, in learning order: how much of it is solved. */
  topics: ReadonlyArray<{ slug: string; label: string; solved: number; total: number }>;
  referrals: number;
  /** Every company simulation: rounds done in the furthest run, and whether any run was completed. */
  simulations: ReadonlyArray<{ slug: string; company: string; done: number; total: number; complete: boolean }>;
  /** Limited-edition ids whose window saw a solve. */
  limited: readonly string[];
  /** Goodies frame ids bought. */
  owned: readonly string[];
}

// ── Time, in India ────────────────────────────────────────────────

const IST_MS = 5.5 * 3_600_000;
/** "2026-11-17", the IST calendar day (lib/clock's calendar). */
export const istDay = (at: Date): string => new Date(at.getTime() + IST_MS).toISOString().slice(0, 10);
export const istMonth = (at: Date): string => istDay(at).slice(0, 7);
/** The instant an IST day starts. */
export const istDayStart = (day: string): Date => new Date(new Date(`${day}T00:00:00Z`).getTime() - IST_MS);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-11" → "Nov 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

// ── The rules ─────────────────────────────────────────────────────

const count = (have: number, need: number) => ({ have: Math.min(have, need), need });

/** How many of a family's locked frames the picker shows as goals beside the earned ones. */
const GOALS_SHOWN = 2;

/**
 * Of a family with one frame per topic / company, the ones to show: every
 * earned one, then the closest goals in progress, then — when there are
 * none — the family's first, so the family is never absent from the picker.
 */
function pick<T>(items: readonly T[], earned: (t: T) => boolean, progress: (t: T) => number): T[] {
  const won = items.filter(earned);
  const going = items
    .filter((t) => !earned(t) && progress(t) > 0)
    .sort((a, b) => progress(b) - progress(a))
    .slice(0, GOALS_SHOWN);
  const shown = [...won, ...going];
  if (shown.length === won.length && items.length > 0) {
    const first = items.find((t) => !earned(t));
    if (first) shown.push(first);
  }
  return shown;
}

/**
 * Every frame the picker shows the account, in display order, each with
 * whether it is earned and — for a count — how far along it is. Every earned
 * frame is in the list, so it is also what a wear request is checked against.
 */
export function frameCards(facts: FrameFacts, now: Date = new Date()): FrameCard[] {
  const cards: FrameCard[] = [];
  const held = new Set(facts.honours);
  const honourCard = (id: HonourFrameId, group: FrameGroup, showLocked: boolean) => {
    const def = HONOUR_FRAMES[id];
    const earned = held.has(def.kind);
    if (!earned && !showLocked) return;
    cards.push({ id, group, name: def.name, how: def.how, earned, progress: null, ...("href" in def ? { href: def.href } : {}) });
  };

  // What the account already wore before the picker existed.
  cards.push({ id: "road", group: "standing", name: "Roadmap", how: "Open a roadmap chest — the ring darkens with every chest.", earned: facts.chests > 0, progress: count(facts.chests, 1), href: "/roadmap" });
  cards.push({ id: "credential", group: "standing", name: "Skill credential", how: "Pass a skill test; the credential you wear names its skill.", earned: facts.credentials > 0, progress: null, href: "/skill-tests" });
  honourCard("founding", "standing", false);
  honourCard("diwali-2026", "standing", false);

  for (const t of SOLVER_TIERS) cards.push({ id: t.id, group: "solving", name: t.name, how: `Solve ${t.need.toLocaleString("en-IN")} coding or SQL problems.`, earned: facts.solved >= t.need, progress: count(facts.solved, t.need), href: "/challenges" });
  cards.push({
    id: "unassisted",
    group: "solving",
    name: "Unassisted",
    how: `Solve ${UNASSISTED_HARD} Hard problems on your own — no hints, editorial or tutor help before the accept, and not in a pair room.`,
    earned: facts.unassistedHard >= UNASSISTED_HARD,
    progress: count(facts.unassistedHard, UNASSISTED_HARD),
    href: "/challenges?difficulty=HARD",
  });

  for (const t of STREAK_TIERS) cards.push({ id: t.id, group: "streak", name: t.name, how: `Solve a problem on ${t.need} days in a row.`, earned: facts.bestStreak >= t.need, progress: count(facts.bestStreak, t.need) });

  for (const t of facts.tracks)
    cards.push({ id: `track-${t.key}`, group: "learning", name: `${t.title} graduate`, how: `Finish the ${t.title} study plan.`, earned: t.finished, progress: null, href: `/study-plans/${t.key}` });
  const topicDone = (t: FrameFacts["topics"][number]) => t.total > 0 && t.solved >= t.total;
  for (const t of pick(facts.topics, topicDone, (x) => (x.total ? x.solved / x.total : 0)))
    cards.push({ id: `topic-${t.slug}`, group: "learning", name: `${t.label} finisher`, how: `Solve every problem in the ${t.label} study plan.`, earned: topicDone(t), progress: count(t.solved, t.total), href: `/challenges/${t.slug}` });

  // The kata: every month earned, newest first, then this month as the goal.
  const thisMonth = istMonth(now);
  const months = Object.keys(facts.kataMonths)
    .filter((m) => /^\d{4}-\d{2}$/.test(m) && (facts.kataMonths[m] ?? 0) >= KATA_MONTH_SOLVES)
    .sort()
    .reverse();
  if (!months.includes(thisMonth)) months.unshift(thisMonth);
  for (const m of months) {
    const solved = facts.kataMonths[m] ?? 0;
    cards.push({ id: `kata-${m}`, group: "kata", name: `Kata · ${monthLabel(m)}`, how: `Solve ${KATA_MONTH_SOLVES} daily problems on their own day in ${monthLabel(m)}.`, earned: solved >= KATA_MONTH_SOLVES, progress: count(solved, KATA_MONTH_SOLVES), href: "/contests" });
  }

  for (const t of CONNECTOR_TIERS)
    cards.push({ id: t.id, group: "community", name: t.name, how: `Invite ${t.need} friends who each solve their first problem.`, earned: facts.referrals >= t.need, progress: count(facts.referrals, t.need), href: "/invite" });
  for (const s of pick(facts.simulations, (x) => x.complete, (x) => (x.total ? x.done / x.total : 0)))
    cards.push({ id: `process-${s.slug}`, group: "community", name: `${s.company} full process`, how: `Complete every round of the ${s.company} company simulation.`, earned: s.complete, progress: count(s.complete ? s.total : s.done, s.total), href: `/simulations/${s.slug}` });

  honourCard("ambassador", "honour", true);
  honourCard("champion", "honour", true);
  honourCard("contributor", "honour", true);

  const today = istDay(now);
  for (const l of LIMITED_FRAMES) {
    const earned = facts.limited.includes(l.id);
    if (!earned && today > l.to) continue;
    cards.push({ id: l.id, group: "limited", name: l.name, how: l.how, earned, progress: null });
  }

  for (const g of FRAME_GOODIES) cards.push({ id: g.id, group: "goodies", name: g.name, how: g.blurb, earned: facts.owned.includes(g.id), progress: null, points: g.points, href: "/goodies" });

  return cards;
}

/** The ids this account may wear — every earned card, and "none". */
export function wearableFrames(facts: FrameFacts, now: Date = new Date()): Set<string> {
  const ids = new Set(frameCards(facts, now).filter((c) => c.earned).map((c) => c.id));
  ids.add(NO_FRAME);
  return ids;
}

/**
 * A wear request's frame: null for Auto (absent, null, "" or "auto"), the
 * id otherwise — or undefined when it cannot be an id at all (the route's 400).
 */
export function parseFrameId(raw: unknown): string | null | undefined {
  if (raw === undefined || raw === null || raw === "" || raw === "auto") return null;
  if (typeof raw !== "string" || raw.length > FRAME_ID_MAX || !/^[a-z0-9][a-z0-9-]*$/.test(raw)) return undefined;
  return raw;
}

/** Whether a limited edition's window is open on this day, and the instants it spans. */
export function limitedWindow(l: LimitedFrame, now: Date = new Date()): { open: boolean; started: boolean; start: Date; end: Date } {
  const start = istDayStart(l.from);
  const end = new Date(istDayStart(l.to).getTime() + 86_400_000);
  return { open: now >= start && now < end, started: now >= start, start, end };
}
