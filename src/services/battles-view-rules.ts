/**
 * Who may read what of a Battles tournament that is under way or over — the
 * rules that need no database. services/battles-viewer.ts loads the rows
 * and the caller's role; knockout.ts, contest.ts and battles-attempts.ts
 * apply these; battles-view-rules.test.ts pins them.
 *
 * Anyone may follow a public tournament as it happens, signed in or not
 * (user request 2026-10-02): the bracket, every match room, each attempt's
 * verdict as it lands, whether a player is typing. What waits is the code.
 * Every match of a knockout round is played on the same problem, and an
 * ICPC contest's teams all work the same set, so a player's code shown
 * while the tournament runs is a solution handed to the players still
 * working on it — from an incognito window, if it were gated by account.
 * The code is therefore published when the results are final, and not a
 * moment before; until then only the tournament's organizers and
 * CodeKairo's admins read it (staff run the event and judge disputes).
 *
 * Tournaments that started before CODE_PUBLIC_FROM keep their code private:
 * their players entered under a privacy policy that said it was never
 * published (frontend battles/src/content/battles-policies.ts, effective
 * 2 October 2026 since this change).
 */
import { contestState, freezeAt, type ContestWindow } from "./contest-rules.js";
import { isHiddenStatus } from "./battles-rules.js";

/** The first start whose code is published at the end: the day the policy said so. */
export const CODE_PUBLIC_FROM = new Date("2026-10-02T00:00:00+05:30");

/**
 * The caller, to one tournament. A player of the thing being read comes
 * first: an organizer or admin who also plays sees only their own side, as
 * the live relay already rules (match-watch-rules watchAllowed).
 */
export type ViewerRole = "player" | "organizer" | "admin" | "spectator";

export function viewerRole(who: { player: boolean; organizer: boolean; admin: boolean }): ViewerRole {
  if (who.player) return "player";
  if (who.organizer) return "organizer";
  if (who.admin) return "admin";
  return "spectator";
}

export const isStaff = (role: ViewerRole) => role === "organizer" || role === "admin";

/** What these rules read of a tournament row. */
export interface ViewedTournament extends ContestWindow {
  format: string;
  status: string;
  finishedAt: Date | null;
  resultsRevealedAt: Date | null;
  orgVerified: boolean;
}

/**
 * Whether the tournament may be read at all: staff always (an admin reviews
 * drafts and edits), everyone else once it is public — published or
 * cancelled, of a verified organizer.
 */
export const mayRead = (t: Pick<ViewedTournament, "status" | "orgVerified">, role: ViewerRole) => isStaff(role) || (!isHiddenStatus(t.status) && t.orgVerified);

/**
 * Whether the results are final: a knockout once its champion is decided,
 * an ICPC contest once its clock has run out and any freeze is lifted —
 * a frozen board's attempts are exactly what the freeze hides.
 */
export function resultsFinal(t: ViewedTournament, now: Date): boolean {
  if (t.status !== "published") return false;
  if (t.format === "knockout") return t.finishedAt !== null;
  if (contestState(t, now) !== "ended") return false;
  return freezeAt(t) === null || t.resultsRevealedAt !== null;
}

/** Whether every attempt's code is public: the results are final, and the tournament started under the policy that publishes it. */
export const codeIsPublic = (t: ViewedTournament, now: Date) => resultsFinal(t, now) && t.startsAt >= CODE_PUBLIC_FROM;

/** Whether this caller may open one attempt's code: staff, its author, or anyone once the code is public. */
export const mayReadCode = (role: ViewerRole, own: boolean, codePublic: boolean) => isStaff(role) || own || codePublic;

/**
 * Why the code of an attempt the caller cannot open is not shown — one
 * sentence for the room and the scoreboard, so both say the same.
 */
export function codeHiddenReason(t: ViewedTournament, now: Date): string {
  if (t.status === "cancelled") return "This tournament was cancelled, so its code is not published.";
  if (t.startsAt < CODE_PUBLIC_FROM) return "Code from this tournament is not published: it ran before Battles published code.";
  if (t.format === "icpc" && contestState(t, now) === "ended") return "The code is published when the organizer reveals the final standings.";
  return "The code is published when the tournament ends.";
}

/**
 * A knockout attempt belongs to the match its player was playing when it
 * was submitted: the judge counts it only between the match's start and
 * its clock (knockout.ts recordKnockoutSubmission), and a player plays one
 * match at a time, so the window alone tells two rounds on the same
 * problem apart.
 */
export function inMatchWindow(at: Date, m: { startedAt: Date | null; endsAt: Date | null }): boolean {
  if (!m.startedAt || at < m.startedAt) return false;
  return !m.endsAt || at < m.endsAt;
}
