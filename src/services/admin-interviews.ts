import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { CALENDAR_UTC_OFFSET_MINUTES } from "../lib/clock.js";
import { interviewerFor } from "../lib/interviewers.js";
import { coalesce, stateOf } from "../lib/voice-transcript.js";
import { SAT_ROUND } from "./entitlements.js";
import { providerConfig } from "./interview-ai.js";

/**
 * Mock interviews as the admin panel reads them: who sat which round, written
 * or spoken, on which model and interviewer, how it went and what it cost.
 *
 * Nothing new is stored for this — every column already exists on
 * MockInterviewSession, and the spoken round's interviewer and opening
 * language live in `voiceState` (lib/voice-transcript.ts). The one thing the
 * rows do not record is the *written* round's model: /start stamps `provider`
 * and `realtimeModel` on a voice round only, so a written row reads as the
 * model the API is configured with now, flagged `modelRecorded: false` so the
 * panel can say so rather than pass a guess off as history.
 */

/** Sessions per page of the admin list. */
export const INTERVIEW_PAGE_SIZE = 50;

/** The written round's provider id, as the voice round's `provider` column would spell it. */
const WRITTEN_PROVIDER = "nvidia";

/**
 * SAT_ROUND (services/entitlements.ts) — a closed round, a written round with
 * an answer on disk, or a spoken round whose audio began — evaluated over
 * fields already selected, so the list can mark "opened, never sat" without
 * a second query per row. Keep the two in step.
 */
export function wasSat(s: { status: string; mode: string; startedAt: Date | null; answered: number }): boolean {
  return s.status === "completed" || s.answered > 0 || (s.mode === "voice" && s.startedAt !== null);
}

/**
 * How long the round ran, in seconds. A spoken round writes `durationSec` at
 * /voice/complete; before that (or if it never closed) the audio's own start
 * and end are the best reading. A written round has no clock, so it is the
 * row's life from creation to completion — an upper bound, since it includes
 * however long the tab sat idle.
 */
export function sessionSeconds(s: {
  mode: string;
  durationSec: number | null;
  startedAt: Date | null;
  endedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}): number | null {
  if (s.mode === "voice") {
    if (s.durationSec != null) return s.durationSec;
    if (s.startedAt && s.endedAt) return Math.max(0, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 1000));
    return null;
  }
  if (!s.completedAt) return null;
  return Math.max(0, Math.round((s.completedAt.getTime() - s.createdAt.getTime()) / 1000));
}

/** The model that ran the round, and whether the row says so or it is today's configuration. */
export function modelOf(s: { mode: string; provider: string | null; realtimeModel: string | null }, writtenModel: string) {
  if (s.realtimeModel) return { provider: s.provider, model: s.realtimeModel, modelRecorded: true };
  if (s.mode === "written") return { provider: WRITTEN_PROVIDER, model: writtenModel, modelRecorded: false };
  return { provider: s.provider, model: null, modelRecorded: false };
}

/** The interviewer and opening language a spoken round was run with; both null on a written round or one that predates the choice. */
export function voiceChoice(mode: string, voiceState: unknown) {
  if (mode !== "voice") return { interviewer: null, language: null };
  const state = stateOf(voiceState);
  const who = interviewerFor(state.interviewer);
  return {
    interviewer: who ? { id: who.id, name: who.name, tone: who.tone } : null,
    language: typeof state.language === "string" ? state.language : null,
  };
}

const SESSION_ROW = {
  id: true,
  mode: true,
  status: true,
  onCredit: true,
  provider: true,
  realtimeModel: true,
  questionBudget: true,
  overallScore: true,
  durationSec: true,
  durationLimitSec: true,
  voiceState: true,
  startedAt: true,
  endedAt: true,
  completedAt: true,
  createdAt: true,
  promptTokens: true,
  completionTokens: true,
  costMicros: true,
  savedInterview: { select: { roleId: true, roundId: true, difficulty: true, experienceBand: true, interviewStyle: true } },
  user: { select: { id: true, name: true, username: true, email: true } },
  _count: { select: { questions: true } },
} satisfies Prisma.MockInterviewSessionSelect;

type SessionRowSource = Prisma.MockInterviewSessionGetPayload<{ select: typeof SESSION_ROW }>;

/**
 * Answered questions per session, in one grouped read — the filtered
 * relation count would be a correlated subquery per row.
 */
async function answeredCounts(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.mockInterviewQuestion.groupBy({
    by: ["sessionId"],
    where: { sessionId: { in: ids }, userAnswer: { not: null } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.sessionId, r._count._all]));
}

function shapeRow(s: SessionRowSource, answered: number, writtenModel: string) {
  const { voiceState, savedInterview, _count, promptTokens, completionTokens, provider, realtimeModel, ...rest } = s;
  return {
    ...rest,
    ...modelOf({ mode: s.mode, provider, realtimeModel }, writtenModel),
    ...voiceChoice(s.mode, voiceState),
    setup: savedInterview,
    questions: { total: _count.questions, answered },
    tokens: promptTokens + completionTokens,
    seconds: sessionSeconds(s),
    sat: wasSat({ status: s.status, mode: s.mode, startedAt: s.startedAt, answered }),
  };
}

export type AdminInterviewRow = ReturnType<typeof shapeRow>;

/** Rows shaped for the panel, answered counts filled in. */
async function shapeRows(rows: SessionRowSource[]): Promise<AdminInterviewRow[]> {
  const answered = await answeredCounts(rows.map((r) => r.id));
  const writtenModel = providerConfig().model;
  return rows.map((r) => shapeRow(r, answered.get(r.id) ?? 0, writtenModel));
}

export interface InterviewListArgs {
  days: number;
  mode: "written" | "voice" | null;
  status: string | null;
  /** Matches the candidate's email, username or name. */
  q: string | null;
  page: number;
}

/** One page of sessions, newest first, and the window's total for the pager. */
export async function interviewList(args: InterviewListArgs) {
  const since = new Date(Date.now() - args.days * 86_400_000);
  const where: Prisma.MockInterviewSessionWhereInput = {
    createdAt: { gte: since },
    ...(args.mode ? { mode: args.mode } : {}),
    ...(args.status ? { status: args.status } : {}),
    ...(args.q ? { user: { OR: [{ email: { contains: args.q } }, { username: { contains: args.q } }, { name: { contains: args.q } }] } } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.mockInterviewSession.count({ where }),
    prisma.mockInterviewSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (args.page - 1) * INTERVIEW_PAGE_SIZE,
      take: INTERVIEW_PAGE_SIZE,
      select: SESSION_ROW,
    }),
  ]);
  return { total, page: args.page, pageSize: INTERVIEW_PAGE_SIZE, sessions: await shapeRows(rows) };
}

/** An account's own rounds, newest first, for the user detail. */
export async function interviewsOf(userId: string, take = 25) {
  const [rows, byMode, sat, credits] = await Promise.all([
    prisma.mockInterviewSession.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take, select: SESSION_ROW }),
    prisma.mockInterviewSession.groupBy({
      by: ["mode"],
      where: { userId },
      _count: { _all: true },
      _avg: { overallScore: true },
      _sum: { durationSec: true },
    }),
    prisma.mockInterviewSession.count({ where: { userId, ...SAT_ROUND } }),
    prisma.mockInterviewSession.count({ where: { userId, onCredit: true } }),
  ]);
  const mode = (m: string) => byMode.find((r) => r.mode === m);
  return {
    totals: {
      written: mode("written")?._count._all ?? 0,
      voice: mode("voice")?._count._all ?? 0,
      sat,
      onCredit: credits,
      // Completed rounds only carry a score; _avg skips the nulls.
      averageScoreWritten: roundOrNull(mode("written")?._avg.overallScore),
      averageScoreVoice: roundOrNull(mode("voice")?._avg.overallScore),
      voiceSeconds: mode("voice")?._sum.durationSec ?? 0,
    },
    sessions: await shapeRows(rows),
  };
}

const roundOrNull = (n: number | null | undefined) => (n == null ? null : Math.round(n));

interface Tally {
  key: string | null;
  count: number;
}

/** A raw COUNT/SUM/AVG: BIGINT for a count, DECIMAL (Prisma.Decimal) for a SUM or AVG — Number() reads both. */
const num = (v: unknown) => Number(v ?? 0);

/** Days in the product calendar (IST), as the analytics tab buckets them. */
const DAY = Prisma.sql`DATE(DATE_ADD(createdAt, INTERVAL ${Prisma.raw(String(CALENDAR_UTC_OFFSET_MINUTES))} MINUTE))`;

/**
 * The window at a glance: how many rounds, by whom, on what. Every figure is
 * a grouped read over the window, so it is a handful of queries whatever the
 * size of the table.
 */
export async function interviewSummary(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const where = { createdAt: { gte: since } };
  const [byMode, byStatus, candidates, satRows, onCredit, scores, byModel, byInterviewer, byLanguage, byRole, byRound, topCandidates, perDay] = await Promise.all([
    prisma.mockInterviewSession.groupBy({
      by: ["mode"],
      where,
      _count: { _all: true },
      _sum: { durationSec: true, promptTokens: true, completionTokens: true, costMicros: true },
    }),
    prisma.mockInterviewSession.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT userId) AS n FROM MockInterviewSession WHERE createdAt >= ${since}`,
    prisma.mockInterviewSession.groupBy({ by: ["mode"], where: { ...where, ...SAT_ROUND }, _count: { _all: true } }),
    prisma.mockInterviewSession.count({ where: { ...where, onCredit: true } }),
    prisma.mockInterviewSession.groupBy({ by: ["mode"], where: { ...where, status: "completed" }, _avg: { overallScore: true }, _count: { _all: true } }),
    prisma.mockInterviewSession.groupBy({ by: ["mode", "provider", "realtimeModel"], where, _count: { _all: true } }),
    // Interviewer and language are keys inside voiceState (a JSON column), so
    // these two are SQL. JSON_UNQUOTE turns a stored JSON null into the
    // string 'null', which NULLIF folds into the SQL NULL of a round whose
    // state has no key at all — both are "no choice made".
    prisma.$queryRaw<Array<{ k: string | null; n: bigint }>>`
      SELECT NULLIF(JSON_UNQUOTE(JSON_EXTRACT(voiceState, '$.interviewer')), 'null') AS k, COUNT(*) AS n
      FROM MockInterviewSession WHERE createdAt >= ${since} AND mode = 'voice' GROUP BY k ORDER BY n DESC`,
    prisma.$queryRaw<Array<{ k: string | null; n: bigint }>>`
      SELECT NULLIF(JSON_UNQUOTE(JSON_EXTRACT(voiceState, '$.language')), 'null') AS k, COUNT(*) AS n
      FROM MockInterviewSession WHERE createdAt >= ${since} AND mode = 'voice' GROUP BY k ORDER BY n DESC`,
    prisma.$queryRaw<Array<{ k: string; n: bigint }>>`
      SELECT s.roleId AS k, COUNT(*) AS n FROM MockInterviewSession m JOIN SavedInterview s ON s.id = m.savedInterviewId
      WHERE m.createdAt >= ${since} GROUP BY s.roleId ORDER BY n DESC LIMIT 10`,
    prisma.$queryRaw<Array<{ k: string; n: bigint }>>`
      SELECT s.roundId AS k, COUNT(*) AS n FROM MockInterviewSession m JOIN SavedInterview s ON s.id = m.savedInterviewId
      WHERE m.createdAt >= ${since} GROUP BY s.roundId ORDER BY n DESC LIMIT 10`,
    prisma.$queryRaw<Array<{ userId: string; n: bigint; voice: unknown; completed: unknown; avgScore: unknown; last: Date }>>`
      SELECT userId, COUNT(*) AS n, SUM(mode = 'voice') AS voice, SUM(status = 'completed') AS completed,
             AVG(overallScore) AS avgScore, MAX(createdAt) AS last
      FROM MockInterviewSession WHERE createdAt >= ${since} GROUP BY userId ORDER BY n DESC, last DESC LIMIT 15`,
    prisma.$queryRaw<Array<{ day: Date | string; mode: string; n: bigint }>>(
      Prisma.sql`SELECT ${DAY} AS day, mode, COUNT(*) AS n FROM MockInterviewSession WHERE createdAt >= ${since} GROUP BY day, mode ORDER BY day`,
    ),
  ]);

  const users = topCandidates.length
    ? await prisma.user.findMany({
        where: { id: { in: topCandidates.map((c) => c.userId) } },
        select: { id: true, name: true, username: true, email: true },
      })
    : [];
  const userOf = new Map(users.map((u) => [u.id, u]));

  const modeRow = (m: string) => byMode.find((r) => r.mode === m);
  const sum = <K extends "durationSec" | "promptTokens" | "completionTokens" | "costMicros">(k: K) =>
    byMode.reduce((n, r) => n + (r._sum[k] ?? 0), 0);
  const writtenModel = providerConfig().model;

  return {
    days,
    totals: {
      sessions: byMode.reduce((n, r) => n + r._count._all, 0),
      written: modeRow("written")?._count._all ?? 0,
      voice: modeRow("voice")?._count._all ?? 0,
      sat: satRows.reduce((n, r) => n + r._count._all, 0),
      satVoice: satRows.find((r) => r.mode === "voice")?._count._all ?? 0,
      candidates: num(candidates[0]?.n),
      completed: byStatus.find((r) => r.status === "completed")?._count._all ?? 0,
      onCredit,
      voiceSeconds: modeRow("voice")?._sum.durationSec ?? 0,
      tokens: sum("promptTokens") + sum("completionTokens"),
      costMicros: sum("costMicros"),
      averageScoreWritten: roundOrNull(scores.find((r) => r.mode === "written")?._avg.overallScore),
      averageScoreVoice: roundOrNull(scores.find((r) => r.mode === "voice")?._avg.overallScore),
    },
    byStatus: byStatus.map((r) => ({ key: r.status, count: r._count._all })).sort((a, b) => b.count - a.count),
    byModel: byModel
      .map((r) => ({ mode: r.mode, ...modelOf({ mode: r.mode, provider: r.provider, realtimeModel: r.realtimeModel }, writtenModel), count: r._count._all }))
      .sort((a, b) => b.count - a.count),
    byInterviewer: byInterviewer.map((r): Tally & { name: string } => ({
      key: r.k,
      // A null key is a round from before the choice, which ran on the deployment's default voice.
      name: interviewerFor(r.k)?.name ?? (r.k ? r.k : "Default voice"),
      count: num(r.n),
    })),
    byLanguage: byLanguage.map((r): Tally => ({ key: r.k, count: num(r.n) })),
    byRole: byRole.map((r) => ({ key: r.k, count: num(r.n) })),
    byRound: byRound.map((r) => ({ key: r.k, count: num(r.n) })),
    topCandidates: topCandidates.map((c) => ({
      user: userOf.get(c.userId) ?? { id: c.userId, name: null, username: null, email: null },
      sessions: num(c.n),
      voice: num(c.voice),
      completed: num(c.completed),
      averageScore: c.avgScore == null ? null : Math.round(Number(c.avgScore)),
      last: c.last,
    })),
    perDay: foldPerDay(perDay),
  };
}

/** `(day, mode, n)` rows into one row per day with both modes, days without a round left out. */
export function foldPerDay(rows: Array<{ day: Date | string; mode: string; n: bigint | number }>) {
  const days = new Map<string, { day: string; written: number; voice: number }>();
  for (const r of rows) {
    const day = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
    const row = days.get(day) ?? { day, written: 0, voice: 0 };
    if (r.mode === "voice") row.voice += Number(r.n);
    else row.written += Number(r.n);
    days.set(day, row);
  }
  return [...days.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/** The transcript is shown as text, not as rows. */
const TRANSCRIPT_TYPE = "transcript";
/**
 * Counted but not listed: the client logs one of these at every turn, so a
 * ten-minute round had 56 of them burying the four incidents (a drop, its
 * restore, two interruptions) the timeline is there to show.
 */
const TURN_MARKERS = new Set([TRANSCRIPT_TYPE, "interviewer_stopped_speaking", "candidate_stopped_speaking"]);
/** A long round is a thousand fragments; the timeline is for incidents, capped so a pathological one cannot flood the page. */
const TIMELINE_CAP = 200;

/**
 * One round in full: its setup, the report, every question with the answer
 * and the marks, and — for a spoken round — the conversation as it was said
 * plus the incidents (drops, interruptions) the client logged.
 */
export async function interviewDetail(id: string) {
  const session = await prisma.mockInterviewSession.findUnique({
    where: { id },
    select: {
      ...SESSION_ROW,
      summary: true,
      strengths: true,
      weaknesses: true,
      nextSteps: true,
      topicBreakdown: true,
      cachedTokens: true,
      reasoningTokens: true,
      savedInterview: {
        select: { roleId: true, roundId: true, difficulty: true, experienceBand: true, interviewStyle: true, stackFocusIds: true, focusAreaIds: true },
      },
      questions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          orderIndex: true,
          questionText: true,
          topic: true,
          difficulty: true,
          focusArea: true,
          userAnswer: true,
          evaluationScore: true,
          verdict: true,
          feedback: true,
          missed: true,
          followUps: true,
          starterCode: true,
          status: true,
        },
      },
    },
  });
  if (!session) return null;

  const events =
    session.mode === "voice"
      ? await prisma.interviewEvent.findMany({
          where: { sessionId: id },
          orderBy: { sequence: "asc" },
          select: { sequence: true, speaker: true, type: true, text: true, questionNumber: true, metadata: true, createdAt: true },
        })
      : [];

  const { questions, summary, strengths, weaknesses, nextSteps, topicBreakdown, cachedTokens, reasoningTokens, savedInterview, ...row } = session;
  const answered = questions.filter((q) => q.userAnswer != null).length;
  const state = session.mode === "voice" ? stateOf(session.voiceState) : null;

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = (counts[e.type] ?? 0) + 1;

  return {
    ...shapeRow({ ...row, savedInterview }, answered, providerConfig().model),
    setup: {
      ...savedInterview,
      stackFocusIds: stringList(savedInterview.stackFocusIds),
      focusAreaIds: stringList(savedInterview.focusAreaIds),
    },
    report: {
      summary,
      strengths: stringList(strengths),
      weaknesses: stringList(weaknesses),
      nextSteps: stringList(nextSteps),
      topicBreakdown: Array.isArray(topicBreakdown) ? (topicBreakdown as Array<{ topic: string; asked: number; average: number }>) : [],
    },
    usage: {
      promptTokens: session.promptTokens,
      cachedTokens,
      completionTokens: session.completionTokens,
      reasoningTokens,
      costMicros: session.costMicros,
    },
    voice: state
      ? {
          questionsCompleted: state.questionsCompleted,
          followUpsAsked: state.followUpsAsked,
          interruptions: state.interruptions,
          topicsCovered: state.topicsCovered,
        }
      : null,
    questions: questions.map((q) => ({ ...q, missed: stringList(q.missed), followUps: stringList(q.followUps) })),
    transcript: coalesce(events.filter((e) => e.type === TRANSCRIPT_TYPE)),
    events: {
      counts,
      timeline: events
        .filter((e) => !TURN_MARKERS.has(e.type))
        .slice(0, TIMELINE_CAP)
        .map((e) => ({ sequence: e.sequence, speaker: e.speaker, type: e.type, text: e.text, questionNumber: e.questionNumber, metadata: e.metadata, createdAt: e.createdAt })),
    },
  };
}

/** A Json list column read back as strings, whatever an old row holds. */
export function stringList(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
}
