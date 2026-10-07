/**
 * An account's own data, on its owner's say-so: a copy of everything held
 * about it (GET /api/me/export) and its deletion (DELETE /api/me) — the
 * access and erasure rights India's DPDP Act gives a member, which until
 * 2026-10-06 were a mail to support (the privacy policy's "Your rights").
 *
 * The copy is an allow-list per table, never a spread of the row: several
 * tables hold things that must not leave the server even to their owner —
 * a placement or skill sitting's paper and per-question marks (the bank's
 * key; lib/skill-tests says why it never leaves), a sitting's integrity
 * flags (they would teach the proctor's rules), a payment's raw gateway
 * body, provider tokens, the interview's token counts and cost. What the
 * member made — code, queries, answers, posts, resumes, transcripts — is
 * all there.
 *
 * Deletion is the User row: every table that names a user cascades from it
 * (prisma/schema.prisma) except the four columns below that carry an id
 * with no relation, which are cleared here in the same transaction.
 */
import { prisma } from "../lib/prisma.js";
import { invalidatePrefix } from "../lib/cache.js";
import { forgetSessions } from "../lib/session-revocation.js";
import { disconnectUser } from "../lib/realtime.js";
import { invalidateDashboard } from "./dashboard.js";
import { forgetPublicUser } from "./public-profile.js";
import { forgetExperiences } from "./interview-experiences.js";

/** Rows per table in a copy, newest first. Generous: only a bot reaches it. */
const EXPORT_ROW_CAP = 20_000;
/** Analytics events are the one table that grows by the page view. */
const EXPORT_EVENT_CAP = 5_000;

const newest = { take: EXPORT_ROW_CAP } as const;

/** Everything held about one account, as one JSON document. Null when the account is gone. */
export async function buildAccountExport(userId: string): Promise<Record<string, unknown> | null> {
  const where = { userId };
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, emailVerified: true, provider: true, username: true,
      avatar_url: true, instituteName: true, gender: true, location: true, birthday: true,
      website: true, github: true, linkedin: true, twitter: true, readme: true,
      xp: true, questionsXp: true, bugsXp: true, rating: true,
      remindStreak: true, remindDailyKata: true, weeklyDigest: true, remindReviews: true, profileHidden: true, preferredLanguage: true,
      goal: true, level: true, goalDetails: true, onboardedAt: true, dailyMinutes: true,
      // The placement target readiness reads (services/readiness.ts).
      targetCompany: true, targetTest: true, targetDate: true,
      createdAt: true, updatedAt: true,
      stats: { select: { problemsSolved: true, bugsFixed: true, pairSessions: true, currentStreak: true, longestStreak: true, lastActive: true } },
      accounts: { select: { provider: true, providerAccountId: true } },
      githubConnection: { select: { githubId: true, login: true, linkedAt: true } },
    },
  });
  if (!profile) return null;

  // Independent reads; the pool queues what it cannot run at once.
  const [
    submissions, drafts, timers, engagement, bugSubmissions, sqlSubmissions,
    interviews, savedInterviews, aptitude, placement, skills, credentials,
    contests, duels, rooms, posts, comments, likes, commentLikes, saved, votes, reports,
    following, followers, affinities, feedback, assistant, roadmap,
    enrollments, lessons, exercises, resumes, subscriptions, orders,
    notifications, shareCards, orgs, entries, tournamentSubmissions, campus, events, pushDevices, missionDays, analyses, tutorTurns, simulationRuns,
  ] = await Promise.all([
    prisma.submission.findMany({
      where, ...newest, orderBy: { submittedAt: "desc" },
      select: { id: true, problem: { select: { slug: true, title: true } }, language: true, code: true, verdict: true, runtimeMs: true, memoryKb: true, passedCases: true, totalCases: true, submittedAt: true },
    }),
    prisma.codeDraft.findMany({ where, ...newest, select: { problem: { select: { slug: true } }, language: true, code: true, updatedAt: true } }),
    prisma.problemTimer.findMany({ where, ...newest, select: { problem: { select: { slug: true } }, elapsedSeconds: true, updatedAt: true } }),
    // When each problem, its hints and its editorial were first opened (the skill profile's evidence of help).
    prisma.problemEngagement.findMany({
      where, ...newest,
      select: { problem: { select: { slug: true } }, openedAt: true, hintsAt: true, editorialAt: true, tutorRung: true, tutorHintAt: true, tutorSolutionAt: true },
    }),
    prisma.bugSubmission.findMany({
      where, ...newest, orderBy: { submittedAt: "desc" },
      select: { challenge: { select: { slug: true, title: true } }, editedFiles: true, verdict: true, passedTests: true, totalTests: true, timeTakenSecs: true, submittedAt: true },
    }),
    prisma.sqlSubmission.findMany({
      where, ...newest, orderBy: { submittedAt: "desc" },
      select: { slug: true, query: true, verdict: true, passedCases: true, totalCases: true, runtimeMs: true, submittedAt: true },
    }),
    prisma.mockInterviewSession.findMany({
      where, ...newest, orderBy: { createdAt: "desc" },
      select: {
        id: true, mode: true, status: true, language: true, startedAt: true, endedAt: true, completedAt: true, durationSec: true,
        overallScore: true, summary: true, strengths: true, weaknesses: true, nextSteps: true, topicBreakdown: true, createdAt: true,
        savedInterview: { select: { roleId: true, roundId: true, difficulty: true, experienceBand: true, interviewStyle: true } },
        questions: {
          orderBy: { orderIndex: "asc" },
          select: { questionText: true, topic: true, difficulty: true, userAnswer: true, evaluationScore: true, feedback: true, verdict: true, missed: true, followUps: true },
        },
        // The voice round's transcript and log; `metadata` is the platform's own bookkeeping.
        events: { orderBy: { sequence: "asc" }, select: { speaker: true, type: true, text: true, createdAt: true } },
      },
    }),
    prisma.savedInterview.findMany({ where, ...newest, select: { roleId: true, roundId: true, difficulty: true, experienceBand: true, interviewStyle: true, stackFocusIds: true, focusAreaIds: true, company: true, createdAt: true } }),
    prisma.aptitudeAttempt.findMany({
      where, ...newest, orderBy: { createdAt: "desc" },
      select: { question: { select: { slug: true } }, selected: true, correct: true, timeSec: true, usedHints: true, createdAt: true },
    }),
    // A sitting's score and its code — never its paper, its per-question marks or its signals.
    prisma.mockAttempt.findMany({
      where, ...newest, orderBy: { startedAt: "desc" },
      select: {
        test: { select: { slug: true, name: true } }, status: true, startedAt: true, submittedAt: true,
        score: true, maxScore: true, correctCount: true, wrongCount: true, skippedCount: true, sectionScores: true,
        codeAnswers: { select: { problem: { select: { slug: true } }, language: true, code: true, verdict: true, passedCases: true, totalCases: true } },
      },
    }),
    prisma.skillAttempt.findMany({
      where, ...newest, orderBy: { startedAt: "desc" },
      select: {
        test: { select: { slug: true, title: true } }, status: true, startedAt: true, submittedAt: true,
        score: true, maxScore: true, percent: true, band: true, sectionScores: true, topicScores: true,
        codeAnswers: { select: { language: true, code: true, verdict: true, passedCases: true, totalCases: true } },
      },
    }),
    prisma.skillCredential.findMany({ where, select: { code: true, skill: true, level: true, band: true, percent: true, issuedAt: true, expiresAt: true, revokedAt: true } }),
    prisma.dailyContestEntry.findMany({ where, ...newest, orderBy: { date: "desc" }, select: { date: true, startedAt: true, solvedAt: true, timeTakenSec: true, wrongAttempts: true, penaltySec: true, points: true, rewardXp: true } }),
    prisma.duelParticipant.findMany({ where, ...newest, orderBy: { joinedAt: "desc" }, select: { duelId: true, team: true, passed: true, total: true, verdict: true, finishedAt: true, xpAwarded: true, joinedAt: true } }),
    prisma.roomParticipant.findMany({ where, ...newest, orderBy: { joinedAt: "desc" }, select: { roomId: true, role: true, joinedAt: true } }),
    prisma.post.findMany({ where, ...newest, orderBy: { createdAt: "desc" }, select: { id: true, type: true, visibility: true, content: true, meta: true, createdAt: true, editedAt: true } }),
    prisma.postComment.findMany({ where, ...newest, orderBy: { createdAt: "desc" }, select: { postId: true, parentId: true, content: true, createdAt: true } }),
    prisma.postLike.findMany({ where, ...newest, select: { postId: true, createdAt: true } }),
    prisma.postCommentLike.findMany({ where, ...newest, select: { commentId: true, createdAt: true } }),
    prisma.savedPost.findMany({ where, ...newest, select: { postId: true, createdAt: true } }),
    prisma.pollVote.findMany({ where, ...newest, select: { postId: true, option: true, createdAt: true } }),
    prisma.postReport.findMany({ where, ...newest, select: { postId: true, reason: true, createdAt: true } }),
    prisma.follow.findMany({ where: { followerId: userId }, ...newest, select: { following: { select: { username: true } }, createdAt: true } }),
    prisma.follow.findMany({ where: { followingId: userId }, ...newest, select: { follower: { select: { username: true } }, createdAt: true } }),
    // The feed's per-topic interest scores, learned from what the account read and liked.
    prisma.tagAffinity.findMany({ where, ...newest, select: { tag: true, score: true, updatedAt: true } }),
    prisma.feedback.findMany({ where, ...newest, select: { kind: true, rating: true, comment: true, tags: true, path: true, createdAt: true } }),
    prisma.assistantMessage.findMany({ where, ...newest, orderBy: { createdAt: "asc" }, select: { role: true, content: true, cleared: true, createdAt: true } }),
    prisma.roadmapReward.findMany({ where, select: { tierKey: true, xp: true, interviewCredits: true, earnedAt: true } }),
    prisma.studyEnrollment.findMany({ where, select: { trackKey: true, startedAt: true, paceDays: true, completedAt: true } }),
    prisma.studyLessonProgress.findMany({ where, ...newest, select: { lessonKey: true, readAt: true, quizCorrect: true, quizTotal: true, quizAt: true, exercisesPassed: true, completedAt: true } }),
    prisma.studyExerciseSubmission.findMany({ where, ...newest, orderBy: { submittedAt: "desc" }, select: { lessonKey: true, exercise: true, language: true, code: true, verdict: true, passed: true, total: true, submittedAt: true } }),
    prisma.resume.findMany({
      where, ...newest,
      select: {
        title: true, originalFilename: true, rawText: true, content: true, targetRole: true, company: true, jobDescription: true, latestScore: true, createdAt: true, updatedAt: true,
        versions: { select: { name: true, content: true, targetRole: true, company: true, jobDescription: true, score: true, createdAt: true } },
        analyses: { select: { status: true, targetRole: true, company: true, jobDescription: true, result: true, score: true, aiStatus: true, createdAt: true } },
        suggestions: { select: { kind: true, mode: true, path: true, original: true, suggested: true, rationale: true, status: true, createdAt: true } },
      },
    }),
    prisma.subscription.findMany({ where, select: { planId: true, period: true, status: true, startedAt: true, currentPeriodEnd: true } }),
    prisma.paymentOrder.findMany({ where, select: { id: true, planId: true, period: true, amount: true, currency: true, status: true, provider: true, createdAt: true } }),
    prisma.notification.findMany({ where, ...newest, orderBy: { createdAt: "desc" }, select: { type: true, title: true, body: true, href: true, isRead: true, createdAt: true } }),
    prisma.shareCard.findMany({ where, ...newest, select: { id: true, kind: true, title: true, difficulty: true, slug: true, xp: true, createdAt: true } }),
    prisma.battleOrgMember.findMany({ where, select: { role: true, createdAt: true, org: { select: { slug: true, name: true } } } }),
    prisma.tournamentEntry.findMany({ where, select: { status: true, createdAt: true, checkedInAt: true, tournament: { select: { slug: true, title: true } } } }),
    prisma.tournamentSubmission.findMany({ where, ...newest, select: { verdict: true, submittedAt: true, tournament: { select: { slug: true } }, problem: { select: { slug: true } } } }),
    prisma.campusAmbassador.findMany({ where, select: { name: true, email: true, phone: true, college: true, city: true, graduationYear: true, linkedin: true, instagram: true, reach: true, why: true, status: true, createdAt: true } }),
    prisma.appEvent.findMany({ where, take: EXPORT_EVENT_CAP, orderBy: { createdAt: "desc" }, select: { name: true, path: true, props: true, platform: true, createdAt: true } }),
    // The browsers push is on for — when, not the push service's address or keys.
    prisma.pushSubscription.findMany({ where, select: { createdAt: true, lastPushAt: true } }),
    // Each day's mission: what was set, the minutes chosen, what was ticked or skipped by hand.
    prisma.missionDay.findMany({ where, ...newest, orderBy: { day: "desc" }, select: { day: true, minutes: true, items: true, marks: true, createdAt: true } }),
    // "Why it failed": each failed submission's explanation — the judge's and the model's — and what it suggested.
    prisma.submissionAnalysis.findMany({
      where, ...newest, orderBy: { createdAt: "desc" },
      select: { submissionId: true, problemId: true, status: true, category: true, deterministic: true, ai: true, recommendation: true, createdAt: true },
    }),
    // The tutor: what was asked and answered on each problem, at which rung.
    prisma.tutorTurn.findMany({
      where, ...newest, orderBy: { createdAt: "desc" },
      select: { problem: { select: { slug: true } }, role: true, rung: true, content: true, createdAt: true },
    }),
    // Company simulations: which rounds were opened and when; the rounds' results are the sittings and interviews above.
    prisma.simulationRun.findMany({ where, ...newest, orderBy: { createdAt: "desc" }, select: { slug: true, hrMode: true, rounds: true, endedAt: true, createdAt: true } }),
  ]);

  return {
    about:
      "Everything CodeKairo holds about this account, as of exportedAt. Lists are newest first and capped at " +
      `${EXPORT_ROW_CAP} rows a table (${EXPORT_EVENT_CAP} for activity). Test papers, answer keys and integrity ` +
      "checks are not included; your answers, code and scores are.",
    exportedAt: new Date().toISOString(),
    profile,
    coding: { submissions, drafts, timers, engagement, failureAnalyses: analyses, tutor: tutorTurns },
    bugHunts: { submissions: bugSubmissions },
    sql: { submissions: sqlSubmissions },
    interviews: { sessions: interviews, saved: savedInterviews, simulations: simulationRuns },
    aptitude: { attempts: aptitude },
    placementTests: { attempts: placement },
    skillTests: { attempts: skills, credentials },
    dailyContest: { entries: contests },
    duels,
    pairRooms: rooms,
    community: {
      posts, comments, likes, commentLikes, saved, pollVotes: votes, reports,
      following: following.map((f) => ({ username: f.following.username, since: f.createdAt })),
      followers: followers.map((f) => ({ username: f.follower.username, since: f.createdAt })),
      interests: affinities,
    },
    feedback,
    assistant,
    roadmap: { chests: roadmap },
    missions: missionDays,
    studyPlans: { enrollments, lessons, exercises },
    resumes,
    billing: { subscriptions, orders },
    notifications,
    pushNotifications: { devices: pushDevices },
    shareCards,
    battles: { organizations: orgs, entries, submissions: tournamentSubmissions },
    campusAmbassador: campus,
    activity: events,
  };
}

/**
 * The phrase that confirms a deletion: the account's username, or its email
 * when it has none — something the person has to type, not click past.
 */
export function deletionPhrase(user: { username: string | null; email: string | null }): string {
  return (user.username ?? user.email ?? "").trim().toLowerCase();
}

/**
 * Deletes the account and everything that hangs off it, then makes sure
 * nothing still answers for it: its tokens (revocation), its sockets, and
 * every cache that can hold its name — the profile, the leaderboard, the
 * feeds, the experiences lists, the people-to-follow rails.
 */
export async function deleteAccount(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return false;

  await prisma.$transaction([
    // Ids without a relation, so nothing cascades to them.
    prisma.appEvent.deleteMany({ where: { userId } }),
    prisma.errorReport.updateMany({ where: { userId }, data: { userId: null } }),
    // An ambassador application names the person; one sent signed out is matched by address.
    prisma.campusAmbassador.deleteMany({ where: user.email ? { OR: [{ userId }, { email: user.email }] } : { userId } }),
    // Everything else cascades from the row (schema.prisma). Pair rooms,
    // duels, Battles organizations and tournaments the account created keep
    // its id in `createdBy`/`createdById` — an opaque cuid that now points
    // at nothing, so the rooms other people used and the events they
    // entered stay whole.
    prisma.user.delete({ where: { id: userId } }),
  ]);

  forgetSessions(userId);
  void disconnectUser(userId);
  invalidateDashboard(userId);
  forgetPublicUser(userId);
  // Shared caches that may carry the account's name, avatar or posts.
  // Deletion is rare enough that dropping whole families costs nothing.
  for (const prefix of ["leaderboard:", "feed:", "community:", "suggestions:v1:", "social:v1:", "follows:v1:"]) invalidatePrefix(prefix);
  forgetExperiences();
  return true;
}
