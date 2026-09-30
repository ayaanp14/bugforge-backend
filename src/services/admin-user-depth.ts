import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { CALENDAR_UTC_OFFSET_MINUTES } from "../lib/clock.js";

/**
 * Everything else one account has done, for the admin user detail — the parts
 * the first cut of that page left out: duels and pair rooms, aptitude and
 * placement tests, the daily contest, study plans, resumes, the assistant,
 * the community, road chests and Battles, plus how and when they use the site
 * (AppEvent: first and last seen, visits, pages, the last few things done).
 *
 * All of it is counted from rows that already exist; nothing here is stored.
 * Every query is keyed on the account (each table has a userId index), so the
 * whole read is ~25 small queries in one Promise.all — a loopback hop each on
 * the one box (CLAUDE.md, Caching) — for a page two people open.
 */

const DAY_MS = 86_400_000;
/** The window the activity block reads: long enough to see a habit, short enough to stay an index range. */
export const ACTIVITY_DAYS = 30;
/** The recent-events list: enough to see a session's shape. */
const RECENT_EVENTS = 50;

const DAY = Prisma.sql`DATE(DATE_ADD(createdAt, INTERVAL ${Prisma.raw(String(CALENDAR_UTC_OFFSET_MINUTES))} MINUTE))`;

/** A raw COUNT/SUM: BIGINT or DECIMAL depending on the aggregate — Number() reads both. */
const num = (v: unknown) => Number(v ?? 0);

export async function userDepth(userId: string) {
  const since = new Date(Date.now() - ACTIVITY_DAYS * DAY_MS);

  const [
    accounts,
    duelRecord,
    duelsJoined,
    roomsJoined,
    roomsCreated,
    aptitude,
    placementCount,
    placement,
    contest,
    contestSolved,
    enrollments,
    resumeCount,
    resumes,
    assistantAsked,
    assistantLast,
    comments,
    followers,
    following,
    likesGiven,
    chests,
    battleEntries,
    seen,
    visits,
    daily,
    platforms,
    topPages,
    topEvents,
    recent,
  ] = await Promise.all([
    // Which sign-in methods are linked (not the tokens — the backfill scrubbed those).
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
    prisma.$queryRaw<Array<{ played: unknown; won: unknown; lost: unknown }>>`
      SELECT COUNT(*) AS played, SUM(d.winnerTeam = p.team) AS won,
             SUM(d.winnerTeam IS NOT NULL AND d.winnerTeam <> p.team) AS lost
      FROM DuelParticipant p JOIN Duel d ON d.id = p.duelId
      WHERE p.userId = ${userId} AND d.status = 'finished'`,
    prisma.duelParticipant.count({ where: { userId } }),
    prisma.roomParticipant.count({ where: { userId } }),
    prisma.pairRoom.count({ where: { createdBy: userId } }),
    prisma.aptitudeAttempt.groupBy({ by: ["correct"], where: { userId }, _count: { _all: true } }),
    prisma.mockAttempt.count({ where: { userId } }),
    prisma.mockAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        startedAt: true,
        submittedAt: true,
        score: true,
        maxScore: true,
        correctCount: true,
        wrongCount: true,
        skippedCount: true,
        test: { select: { slug: true, name: true, company: true } },
      },
    }),
    prisma.dailyContestEntry.aggregate({ where: { userId }, _count: { _all: true }, _sum: { points: true }, _max: { date: true } }),
    prisma.dailyContestEntry.count({ where: { userId, solvedAt: { not: null } } }),
    prisma.studyEnrollment.findMany({ where: { userId }, orderBy: { startedAt: "desc" }, select: { trackKey: true, startedAt: true, paceDays: true, completedAt: true } }),
    prisma.resume.count({ where: { userId } }),
    prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, targetRole: true, company: true, latestScore: true, updatedAt: true, _count: { select: { analyses: true, versions: true } } },
    }),
    prisma.assistantMessage.count({ where: { userId, role: "user" } }),
    prisma.assistantMessage.findFirst({ where: { userId, role: "user" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    prisma.postComment.count({ where: { userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.postLike.count({ where: { userId } }),
    prisma.roadmapReward.findMany({ where: { userId }, orderBy: { earnedAt: "asc" }, select: { tierKey: true, xp: true, interviewCredits: true, earnedAt: true } }),
    prisma.tournamentEntry.count({ where: { userId } }),
    prisma.appEvent.aggregate({ where: { userId }, _min: { createdAt: true }, _max: { createdAt: true }, _count: { _all: true } }),
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT sessionId) AS n FROM AppEvent WHERE userId = ${userId} AND createdAt >= ${since}`,
    prisma.$queryRaw<Array<{ day: Date | string; n: bigint }>>(
      Prisma.sql`SELECT ${DAY} AS day, COUNT(*) AS n FROM AppEvent WHERE userId = ${userId} AND createdAt >= ${since} GROUP BY day ORDER BY day`,
    ),
    prisma.appEvent.groupBy({ by: ["platform"], where: { userId, createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.appEvent.groupBy({
      by: ["path"],
      where: { userId, createdAt: { gte: since }, name: "page_view" },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.appEvent.groupBy({
      by: ["name"],
      where: { userId, createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 12,
    }),
    prisma.appEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_EVENTS,
      select: { id: true, name: true, path: true, platform: true, props: true, createdAt: true },
    }),
  ]);

  const study = await studyProgress(userId, enrollments.map((e) => e.trackKey));
  const correct = aptitude.find((r) => r.correct)?._count._all ?? 0;
  const attempted = aptitude.reduce((n, r) => n + r._count._all, 0);
  const duel = duelRecord[0];

  return {
    signIn: { linked: [...new Set(accounts.map((a) => a.provider))] },
    duels: { joined: duelsJoined, finished: num(duel?.played), won: num(duel?.won), lost: num(duel?.lost) },
    pairRooms: { joined: roomsJoined, created: roomsCreated },
    aptitude: { attempted, correct, accuracy: attempted ? Math.round((correct / attempted) * 100) : null },
    placement: { attempts: placementCount, recent: placement },
    contest: { entries: contest._count._all, solved: contestSolved, points: contest._sum.points ?? 0, lastDate: contest._max.date },
    study: enrollments.map((e) => ({ ...e, ...(study.get(e.trackKey) ?? { title: e.trackKey, lessons: 0, completed: 0 }) })),
    resumes: { count: resumeCount, recent: resumes },
    assistant: { asked: assistantAsked, lastAt: assistantLast?.createdAt ?? null },
    community: { comments, followers, following, likesGiven },
    roadmap: chests,
    battles: { entries: battleEntries },
    activity: {
      days: ACTIVITY_DAYS,
      firstSeen: seen._min.createdAt,
      lastSeen: seen._max.createdAt,
      eventsTotal: seen._count._all,
      visits: num(visits[0]?.n),
      daily: daily.map((d) => ({ day: d.day instanceof Date ? d.day.toISOString().slice(0, 10) : String(d.day).slice(0, 10), count: num(d.n) })),
      platforms: platforms.map((p) => ({ platform: p.platform, count: p._count._all })).sort((a, b) => b.count - a.count),
      topPages: topPages.map((p) => ({ path: p.path, count: p._count._all })),
      topEvents: topEvents.map((e) => ({ name: e.name, count: e._count._all })),
      recent,
    },
  };
}

/**
 * Lessons completed out of the lessons each enrolled track has — one grouped
 * read over the seeded tree, joined to the account's progress rows.
 */
async function studyProgress(userId: string, trackKeys: string[]) {
  if (trackKeys.length === 0) return new Map<string, { title: string; lessons: number; completed: number }>();
  // `key` is reserved in MySQL, but a word after a table qualifier is always
  // read as an identifier, so `t.key` needs no quoting.
  const rows = await prisma.$queryRaw<Array<{ trackKey: string; title: string; lessons: bigint; completed: unknown }>>`
    SELECT t.key AS trackKey, t.title AS title, COUNT(l.id) AS lessons, SUM(p.completedAt IS NOT NULL) AS completed
    FROM StudyTrack t
    JOIN StudyModule m ON m.trackId = t.id
    JOIN StudyLesson l ON l.moduleId = m.id
    LEFT JOIN StudyLessonProgress p ON p.lessonKey = l.key AND p.userId = ${userId}
    WHERE t.key IN (${Prisma.join(trackKeys)})
    GROUP BY t.key, t.title`;
  return new Map(rows.map((r) => [r.trackKey, { title: r.title, lessons: num(r.lessons), completed: num(r.completed) }]));
}
