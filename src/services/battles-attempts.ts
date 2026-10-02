/**
 * The code of one tournament attempt — a knockout match's or an ICPC
 * team's — for the read-only viewers in the match room and on the
 * scoreboard. The lists that name the attempts (knockout.ts matchRoom,
 * contest.ts teamAttempts) never carry code: a room polls every few
 * seconds and an attempt can be 64 KB, so the code is fetched once, when
 * a reader opens it, and an attempt's code never changes after.
 *
 * Who may read it is battles-view-rules mayReadCode: its author, the
 * tournament's organizers and CodeKairo's admins any time; everyone else
 * — signed in or not — once the tournament is over.
 */
import { prisma } from "../lib/prisma.js";
import { BattlesError } from "./battles-error.js";
import { codeHiddenReason, codeIsPublic, mayRead, mayReadCode } from "./battles-view-rules.js";
import { VIEWED_TOURNAMENT_SELECT, roleOf, viewedTournament, type BattlesViewer } from "./battles-viewer.js";

export async function attemptCode(viewer: BattlesViewer, attemptId: string) {
  if (!attemptId || attemptId.length > 64) throw new BattlesError(404, "No such attempt.");
  const a = await prisma.tournamentSubmission.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      userId: true,
      verdict: true,
      submittedAt: true,
      tournament: { select: VIEWED_TOURNAMENT_SELECT },
      submission: { select: { code: true, language: true, passedCases: true, totalCases: true, runtimeMs: true, memoryKb: true } },
    },
  });
  if (!a) throw new BattlesError(404, "No such attempt.");
  const own = viewer?.userId === a.userId;
  const role = await roleOf(viewer, a.tournament.orgId, false);
  const t = viewedTournament(a.tournament);
  if (!own && !mayRead(t, role)) throw new BattlesError(404, "No such attempt.");
  const now = new Date();
  if (!mayReadCode(role, own, codeIsPublic(t, now))) throw new BattlesError(403, codeHiddenReason(t, now));
  return {
    id: a.id,
    verdict: a.verdict,
    at: a.submittedAt,
    code: a.submission.code,
    language: a.submission.language,
    passed: a.submission.passedCases,
    total: a.submission.totalCases,
    runtimeMs: a.submission.runtimeMs,
    memoryKb: a.submission.memoryKb,
  };
}
