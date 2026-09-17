import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { createNotificationOnce } from "./notifications.js";
import { invalidateDashboard } from "./dashboard.js";
import { judgeProgram, runProgram, type ProgramCase, type ProgramJudgeResult, type ProgramRunResult } from "../lib/program-judge.js";

/**
 * The study plans: a language's syllabus, and one account's way through it.
 *
 * Two sources, like the roadmap. The track as seeded (StudyTrack /
 * StudyModule / StudyLesson — authored under scripts/study-plans, written by
 * scripts/seed-study-plans.ts) is read once and cached: it changes on a
 * seed, not between requests. The account's part is StudyEnrollment (when
 * it started and at what pace) and one StudyLessonProgress row per lesson
 * touched. Unlike the roadmap, progress here has to be *written* — reading
 * a lesson has no judge to derive it from — so the rows are the truth and
 * the rules below (`lessonComplete`, `mastery`, `pace`, `moduleStatus`) are
 * pure functions over them, pinned by study-plans.test.ts.
 *
 * "Today's lesson" and "two behind" are never stored: the pace is a start
 * date and a day count, and the schedule is arithmetic over those and the
 * lesson count. Nothing has to run at midnight.
 *
 * What is withheld from the client: exercise reference solutions, hidden
 * cases, and quiz answers. Grading happens here.
 */

export type LessonKind = "lesson" | "test";
export type LessonStatus = "todo" | "in-progress" | "done";
export type ModuleStatus = "done" | "current" | "upcoming";

export interface ExerciseCase extends ProgramCase {}
export interface ExerciseDefinition {
  title: string;
  prompt: string;
  starter: string;
  solution: string;
  hints: string[];
  cases: ExerciseCase[];
}
export interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

/** A lesson as seeded — everything, including what is never sent. */
export interface LessonDefinition {
  key: string;
  slug: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  xp: number;
  passMark: number | null;
  body: string;
  exercises: ExerciseDefinition[];
  quiz: QuizQuestion[];
}

export interface ModuleDefinition {
  key: string;
  slug: string;
  title: string;
  blurb: string;
  icon: string;
  overview: string;
  lessons: LessonDefinition[];
}

export interface TrackDefinition {
  key: string;
  title: string;
  blurb: string;
  language: string;
  runtime: string;
  modules: ModuleDefinition[];
}

/** One account's row for one lesson, as the rules see it. */
export interface LessonProgress {
  readAt: Date | null;
  quizCorrect: number | null;
  quizTotal: number | null;
  quizAt: Date | null;
  exercisesPassed: number[];
  completedAt: Date | null;
}

export interface Enrollment {
  startedAt: Date;
  paceDays: number;
  completedAt: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const PACE_OPTIONS = [30, 60, 90] as const;
const DEFAULT_PACE = 60;
/** Paid once when every lesson of a track is complete. */
export const TRACK_BONUS_XP = 100;
/** Quiz needed on a plain lesson to count it as done — attempted is enough; the test has its own mark. */
const LESSON_QUIZ_MIN_PERCENT = 0;

/* ── The seeded track ──────────────────────────────────────────────── */

const trackKeyOf = (key: string) => `study:track:${key}`;
const TRACK_LIST_KEY = "study:tracks";

/** Every published track, without modules — the list page. */
export async function trackList(): Promise<Array<Omit<TrackDefinition, "modules"> & { modules: number; lessons: number; minutes: number }>> {
  const list = await cached(TRACK_LIST_KEY, 5 * 60 * 1000, async () => {
    const rows = await prisma.studyTrack.findMany({
      where: { isPublished: true },
      orderBy: { position: "asc" },
      select: {
        key: true,
        title: true,
        blurb: true,
        language: true,
        runtime: true,
        modules: { select: { lessons: { select: { minutes: true } } } },
      },
    });
    return rows.map((t) => ({
      key: t.key,
      title: t.title,
      blurb: t.blurb,
      language: t.language,
      runtime: t.runtime,
      modules: t.modules.length,
      lessons: t.modules.reduce((n, m) => n + m.lessons.length, 0),
      minutes: t.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.minutes, 0), 0),
    }));
  });
  // An empty list is a missing seed, not a fact worth keeping for five minutes.
  if (list.length === 0) invalidate(TRACK_LIST_KEY);
  return list;
}

/**
 * A whole track, lessons included. Bodies come along (a Java track is
 * ~1 MB of Markdown) because every lesson read, every grade and every
 * standing needs the same rows, and one cached read beats a query per
 * lesson against a database 500 ms away. In-process only, never Redis.
 */
export async function trackDefinition(key: string): Promise<TrackDefinition | null> {
  const track = await cached(trackKeyOf(key), 5 * 60 * 1000, async () => {
    const row = await prisma.studyTrack.findFirst({
      where: { key, isPublished: true },
      select: {
        key: true,
        title: true,
        blurb: true,
        language: true,
        runtime: true,
        modules: {
          orderBy: { position: "asc" },
          select: {
            key: true,
            slug: true,
            title: true,
            blurb: true,
            icon: true,
            overview: true,
            lessons: {
              orderBy: { position: "asc" },
              select: { key: true, slug: true, title: true, kind: true, minutes: true, xp: true, passMark: true, body: true, exercises: true, quiz: true },
            },
          },
        },
      },
    });
    if (!row) return null;
    return {
      key: row.key,
      title: row.title,
      blurb: row.blurb,
      language: row.language,
      runtime: row.runtime,
      modules: row.modules.map((m) => ({
        key: m.key,
        slug: m.slug,
        title: m.title,
        blurb: m.blurb,
        icon: m.icon,
        overview: m.overview,
        lessons: m.lessons.map((l) => ({
          key: l.key,
          slug: l.slug,
          title: l.title,
          kind: (l.kind === "test" ? "test" : "lesson") as LessonKind,
          minutes: l.minutes,
          xp: l.xp,
          passMark: l.passMark,
          body: l.body,
          exercises: (Array.isArray(l.exercises) ? l.exercises : []) as unknown as ExerciseDefinition[],
          quiz: (Array.isArray(l.quiz) ? l.quiz : []) as unknown as QuizQuestion[],
        })),
      })),
    };
  });
  if (!track) invalidate(trackKeyOf(key));
  return track;
}

/** After a seed on this instance (tests, scripts that import the service). */
export function invalidateTrackDefinitions(): void {
  invalidate(TRACK_LIST_KEY);
  // Track keys are not enumerable here; the list is the one shared entry and
  // per-track entries expire on their own.
}

/** At boot: no tracks is a missing seed, and worth a line in the log. */
export async function checkStudyPlansSeeded(): Promise<void> {
  const list = await trackList();
  if (list.length === 0) {
    console.error("study plans: no tracks are seeded — run `npx tsx scripts/seed-study-plans.ts --seed` (see scripts/study-plans).");
  }
}

/* ── Pure rules ────────────────────────────────────────────────────── */

export const EMPTY_PROGRESS: LessonProgress = { readAt: null, quizCorrect: null, quizTotal: null, quizAt: null, exercisesPassed: [], completedAt: null };

export function quizPercent(p: LessonProgress): number | null {
  if (p.quizCorrect === null || !p.quizTotal) return null;
  return Math.round((100 * p.quizCorrect) / p.quizTotal);
}

/**
 * Whether every part of a lesson is done. A lesson: read, quiz taken, every
 * exercise passed. A test: the quiz at or above its pass mark and every
 * exercise passed — reading a checkpoint's short brief is not a step.
 */
export function lessonComplete(def: Pick<LessonDefinition, "kind" | "passMark" | "exercises" | "quiz">, p: LessonProgress): boolean {
  const exercisesDone = def.exercises.every((_, i) => p.exercisesPassed.includes(i));
  if (!exercisesDone) return false;
  const percent = quizPercent(p);
  if (def.kind === "test") {
    return def.quiz.length === 0 || (percent !== null && percent >= (def.passMark ?? 70));
  }
  if (!p.readAt) return false;
  if (def.quiz.length > 0 && (percent === null || percent < LESSON_QUIZ_MIN_PERCENT)) return false;
  return true;
}

export function lessonStatus(def: Pick<LessonDefinition, "kind" | "passMark" | "exercises" | "quiz">, p: LessonProgress): LessonStatus {
  if (p.completedAt || lessonComplete(def, p)) return "done";
  if (p.readAt || p.quizAt || p.exercisesPassed.length > 0) return "in-progress";
  return "todo";
}

/**
 * How well a lesson is known, 0–100: reading 30, the best quiz 40, the
 * exercises 30 — with the weight of any part the lesson lacks handed to
 * the others, so a lesson with no exercise is still worth 100.
 */
export function mastery(def: Pick<LessonDefinition, "kind" | "exercises" | "quiz">, p: LessonProgress): number {
  const parts: Array<{ weight: number; score: number }> = [];
  if (def.kind !== "test") parts.push({ weight: 30, score: p.readAt ? 1 : 0 });
  if (def.quiz.length > 0) parts.push({ weight: 40, score: (quizPercent(p) ?? 0) / 100 });
  if (def.exercises.length > 0) {
    const passed = def.exercises.filter((_, i) => p.exercisesPassed.includes(i)).length;
    parts.push({ weight: 30, score: passed / def.exercises.length });
  }
  const total = parts.reduce((n, x) => n + x.weight, 0);
  if (total === 0) return p.completedAt ? 100 : 0;
  return Math.round((100 * parts.reduce((n, x) => n + x.weight * x.score, 0)) / total);
}

export interface PaceStanding {
  startedAt: Date;
  paceDays: number;
  completedAt: Date | null;
  /** 1 on the day of enrolment. */
  dayNumber: number;
  /** Lessons that should be done by the end of today at this pace. */
  expectedDone: number;
  behind: number;
  ahead: number;
  /** Lessons a day the pace asks for, to one decimal. */
  perDay: number;
  /** When the track finishes at the current rate; null before any lesson is done. */
  projectedFinish: Date | null;
  /** When the pace says it should finish. */
  targetFinish: Date;
}

/** The schedule, from the enrolment and the count of lessons done. */
export function pace(enrollment: Enrollment, totalLessons: number, done: number, now: Date = new Date()): PaceStanding {
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - enrollment.startedAt.getTime()) / DAY_MS));
  const dayNumber = elapsedDays + 1;
  const expectedDone = Math.min(totalLessons, Math.ceil((totalLessons * dayNumber) / enrollment.paceDays));
  const perDay = Math.round((10 * totalLessons) / enrollment.paceDays) / 10;
  const rate = dayNumber > 0 ? done / dayNumber : 0;
  const remaining = totalLessons - done;
  const projectedFinish = done > 0 && remaining > 0 ? new Date(now.getTime() + Math.ceil(remaining / rate) * DAY_MS) : remaining === 0 ? enrollment.completedAt ?? now : null;
  return {
    startedAt: enrollment.startedAt,
    paceDays: enrollment.paceDays,
    completedAt: enrollment.completedAt,
    dayNumber,
    expectedDone,
    behind: Math.max(0, expectedDone - done),
    ahead: Math.max(0, done - expectedDone),
    perDay,
    projectedFinish,
    targetFinish: new Date(enrollment.startedAt.getTime() + enrollment.paceDays * DAY_MS),
  };
}

/**
 * The modules' standing: the first module with any lesson not done is
 * "current", everything before it "done", everything after "upcoming".
 * Nothing is locked — the order is advice, and every lesson stays
 * reachable — but the map needs to know where the reader is.
 */
export function moduleStatuses(modules: Array<{ lessons: Array<{ done: boolean }> }>): ModuleStatus[] {
  let currentFound = false;
  return modules.map((m) => {
    const done = m.lessons.length > 0 && m.lessons.every((l) => l.done);
    if (done) return "done";
    if (!currentFound) {
      currentFound = true;
      return "current";
    }
    return "upcoming";
  });
}

/** Consecutive days (UTC) ending today or yesterday on which something was done. */
export function streakDays(activityDates: Iterable<Date>, now: Date = new Date()): number {
  const days = new Set<number>();
  for (const d of activityDates) days.add(Math.floor(d.getTime() / DAY_MS));
  const today = Math.floor(now.getTime() / DAY_MS);
  let cursor = days.has(today) ? today : days.has(today - 1) ? today - 1 : null;
  if (cursor === null) return 0;
  let n = 0;
  while (days.has(cursor)) {
    n += 1;
    cursor -= 1;
  }
  return n;
}

/* ── Per-account reads ─────────────────────────────────────────────── */

function toProgress(row: { readAt: Date | null; quizCorrect: number | null; quizTotal: number | null; quizAt: Date | null; exercisesPassed: unknown; completedAt: Date | null }): LessonProgress {
  return {
    readAt: row.readAt,
    quizCorrect: row.quizCorrect,
    quizTotal: row.quizTotal,
    quizAt: row.quizAt,
    exercisesPassed: Array.isArray(row.exercisesPassed) ? (row.exercisesPassed as number[]).filter((n) => Number.isInteger(n)) : [],
    completedAt: row.completedAt,
  };
}

async function progressMap(userId: string, lessonKeys: string[]): Promise<Map<string, LessonProgress>> {
  if (lessonKeys.length === 0) return new Map();
  const rows = await prisma.studyLessonProgress.findMany({
    where: { userId, lessonKey: { in: lessonKeys } },
    select: { lessonKey: true, readAt: true, quizCorrect: true, quizTotal: true, quizAt: true, exercisesPassed: true, completedAt: true, updatedAt: true },
  });
  return new Map(rows.map((r) => [r.lessonKey, toProgress(r)]));
}

async function enrollmentFor(userId: string, trackKey: string): Promise<Enrollment | null> {
  const row = await prisma.studyEnrollment.findUnique({
    where: { userId_trackKey: { userId, trackKey } },
    select: { startedAt: true, paceDays: true, completedAt: true },
  });
  return row;
}

export interface LessonSummary {
  slug: string;
  title: string;
  kind: LessonKind;
  minutes: number;
  xp: number;
  status: LessonStatus;
  mastery: number;
  quiz: { correct: number; total: number; percent: number } | null;
  exercises: { passed: number; total: number };
  completedAt: Date | null;
}

export interface ModuleSummary {
  slug: string;
  title: string;
  blurb: string;
  icon: string;
  number: number;
  status: ModuleStatus;
  mastery: number;
  minutes: number;
  lessonsDone: number;
  lessonsTotal: number;
  lessons: LessonSummary[];
  /** Where the module's PDF is served from; the file is rendered by frontend/scripts/render-study-pdfs.mts. */
  pdf: string;
}

export interface TrackPayload {
  track: { key: string; title: string; blurb: string; language: string; runtime: string };
  enrollment: PaceStanding | null;
  modules: ModuleSummary[];
  summary: {
    lessons: number;
    done: number;
    percent: number;
    minutesTotal: number;
    minutesLeft: number;
    xpEarned: number;
    xpTotal: number;
    streak: number;
    /** The first lesson not done, in order; null once the track is finished. */
    next: { slug: string; title: string; module: string; moduleSlug: string } | null;
  };
}

export const pdfPathFor = (trackKey: string, moduleSlug: string) => `/pdf/study-plans/${trackKey}/${moduleSlug}.pdf`;

/** The track page: every module and lesson with the reader's standing. Signed-out readers get the syllabus alone. */
export async function trackFor(trackKey: string, userId: string | null): Promise<TrackPayload | null> {
  const track = await trackDefinition(trackKey);
  if (!track) return null;
  const lessonKeys = track.modules.flatMap((m) => m.lessons.map((l) => l.key));

  const [progress, enrollment, activity] = userId
    ? await Promise.all([
        progressMap(userId, lessonKeys),
        enrollmentFor(userId, trackKey),
        prisma.studyLessonProgress.findMany({ where: { userId }, select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 400 }),
      ])
    : [new Map<string, LessonProgress>(), null, [] as Array<{ updatedAt: Date }>];

  const modules = track.modules.map((m, index): ModuleSummary => {
    const lessons = m.lessons.map((l): LessonSummary => {
      const p = progress.get(l.key) ?? EMPTY_PROGRESS;
      const percent = quizPercent(p);
      const status = lessonStatus(l, p);
      return {
        slug: l.slug,
        title: l.title,
        kind: l.kind,
        minutes: l.minutes,
        xp: l.xp,
        status,
        mastery: mastery(l, p),
        quiz: percent === null ? null : { correct: p.quizCorrect ?? 0, total: p.quizTotal ?? 0, percent },
        exercises: { passed: l.exercises.filter((_, i) => p.exercisesPassed.includes(i)).length, total: l.exercises.length },
        completedAt: p.completedAt,
      };
    });
    const lessonsDone = lessons.filter((l) => l.status === "done").length;
    return {
      slug: m.slug,
      title: m.title,
      blurb: m.blurb,
      icon: m.icon,
      number: index + 1,
      status: "upcoming",
      mastery: lessons.length ? Math.round(lessons.reduce((n, l) => n + l.mastery, 0) / lessons.length) : 0,
      minutes: m.lessons.reduce((n, l) => n + l.minutes, 0),
      lessonsDone,
      lessonsTotal: lessons.length,
      lessons,
      pdf: pdfPathFor(track.key, m.slug),
    };
  });
  moduleStatuses(modules.map((m) => ({ lessons: m.lessons.map((l) => ({ done: l.status === "done" })) }))).forEach((status, i) => {
    modules[i]!.status = status;
  });

  const all = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m.title, moduleSlug: m.slug })));
  const done = all.filter((l) => l.status === "done");
  const next = all.find((l) => l.status !== "done") ?? null;
  const xpTotal = all.reduce((n, l) => n + l.xp, 0) + TRACK_BONUS_XP;
  const xpEarned = done.reduce((n, l) => n + l.xp, 0) + (enrollment?.completedAt ? TRACK_BONUS_XP : 0);

  return {
    track: { key: track.key, title: track.title, blurb: track.blurb, language: track.language, runtime: track.runtime },
    enrollment: enrollment ? pace(enrollment, all.length, done.length) : null,
    modules,
    summary: {
      lessons: all.length,
      done: done.length,
      percent: all.length ? Math.round((100 * done.length) / all.length) : 0,
      minutesTotal: all.reduce((n, l) => n + l.minutes, 0),
      minutesLeft: all.filter((l) => l.status !== "done").reduce((n, l) => n + l.minutes, 0),
      xpEarned,
      xpTotal,
      streak: streakDays(activity.map((a) => a.updatedAt)),
      next: next ? { slug: next.slug, title: next.title, module: next.module, moduleSlug: next.moduleSlug } : null,
    },
  };
}

/** The list page: every track with, when signed in, how far along the reader is. */
export async function tracksFor(userId: string | null) {
  const list = await trackList();
  if (!userId || list.length === 0) return list.map((t) => ({ ...t, enrolled: false, percent: 0, done: 0 }));
  const enrollments = await prisma.studyEnrollment.findMany({ where: { userId }, select: { trackKey: true } });
  const enrolled = new Set(enrollments.map((e) => e.trackKey));
  return Promise.all(
    list.map(async (t) => {
      if (!enrolled.has(t.key)) return { ...t, enrolled: false, percent: 0, done: 0 };
      const payload = await trackFor(t.key, userId);
      return { ...t, enrolled: true, percent: payload?.summary.percent ?? 0, done: payload?.summary.done ?? 0 };
    }),
  );
}

function locate(track: TrackDefinition, lessonSlug: string) {
  for (const [mi, module] of track.modules.entries()) {
    const li = module.lessons.findIndex((l) => l.slug === lessonSlug);
    if (li !== -1) return { module, moduleIndex: mi, lesson: module.lessons[li]!, lessonIndex: li };
  }
  return null;
}

export interface LessonPayload {
  track: { key: string; title: string; language: string; runtime: string };
  module: { slug: string; title: string; number: number; lessons: number };
  lesson: {
    slug: string;
    title: string;
    kind: LessonKind;
    number: number;
    minutes: number;
    xp: number;
    passMark: number | null;
    body: string;
    exercises: Array<{ title: string; prompt: string; starter: string; hints: string[]; cases: Array<{ stdin: string; expected: string }>; hiddenCases: number }>;
    quiz: Array<{ prompt: string; options: string[] }>;
  };
  progress: (LessonProgress & { status: LessonStatus; mastery: number }) | null;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string; module: string } | null;
}

/** One lesson, with the solutions, hidden cases and quiz answers withheld. */
export async function lessonFor(trackKey: string, lessonSlug: string, userId: string | null): Promise<LessonPayload | null> {
  const track = await trackDefinition(trackKey);
  if (!track) return null;
  const found = locate(track, lessonSlug);
  if (!found) return null;
  const { module, moduleIndex, lesson, lessonIndex } = found;

  const p = userId ? (await progressMap(userId, [lesson.key])).get(lesson.key) ?? EMPTY_PROGRESS : null;

  const flat = track.modules.flatMap((m) => m.lessons.map((l) => ({ slug: l.slug, title: l.title, module: m.title })));
  const at = flat.findIndex((l) => l.slug === lesson.slug);
  const prev = flat[at - 1] ?? null;
  const next = flat[at + 1] ?? null;

  return {
    track: { key: track.key, title: track.title, language: track.language, runtime: track.runtime },
    module: { slug: module.slug, title: module.title, number: moduleIndex + 1, lessons: module.lessons.length },
    lesson: {
      slug: lesson.slug,
      title: lesson.title,
      kind: lesson.kind,
      number: lessonIndex + 1,
      minutes: lesson.minutes,
      xp: lesson.xp,
      passMark: lesson.passMark,
      body: lesson.body,
      exercises: lesson.exercises.map((e) => ({
        title: e.title,
        prompt: e.prompt,
        starter: e.starter,
        hints: e.hints,
        cases: e.cases.filter((c) => !c.hidden).map((c) => ({ stdin: c.stdin, expected: c.expected })),
        hiddenCases: e.cases.filter((c) => c.hidden).length,
      })),
      quiz: lesson.quiz.map((q) => ({ prompt: q.prompt, options: q.options })),
    },
    progress: p ? { ...p, status: lessonStatus(lesson, p), mastery: mastery(lesson, p) } : null,
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title, module: next.module } : null,
  };
}

/** A whole module with every lesson's text, exercises and the answer key — the print page behind the PDFs. */
export async function modulePrintFor(trackKey: string, moduleSlug: string) {
  const track = await trackDefinition(trackKey);
  const module = track?.modules.find((m) => m.slug === moduleSlug);
  if (!track || !module) return null;
  return {
    // `language` picks the grammar the reference solutions are fenced with.
    track: { key: track.key, title: track.title, language: track.language, runtime: track.runtime },
    module: { slug: module.slug, title: module.title, blurb: module.blurb, overview: module.overview, number: track.modules.indexOf(module) + 1, of: track.modules.length },
    lessons: module.lessons.map((l, i) => ({
      number: i + 1,
      slug: l.slug,
      title: l.title,
      kind: l.kind,
      minutes: l.minutes,
      body: l.body,
      exercises: l.exercises.map((e) => ({
        title: e.title,
        prompt: e.prompt,
        starter: e.starter,
        solution: e.solution,
        cases: e.cases.filter((c) => !c.hidden).map((c) => ({ stdin: c.stdin, expected: c.expected })),
      })),
      quiz: l.quiz,
    })),
  };
}

/* ── Writes ────────────────────────────────────────────────────────── */

export class StudyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function requireLesson(trackKey: string, lessonSlug: string) {
  const track = await trackDefinition(trackKey);
  if (!track) throw new StudyError(404, "No such study plan");
  const found = locate(track, lessonSlug);
  if (!found) throw new StudyError(404, "No such lesson");
  return { track, ...found };
}

/** Enrol, or change the pace. Restarting is not a thing: the start date stays. */
export async function enroll(userId: string, trackKey: string, paceDays: number): Promise<PaceStanding> {
  if (!PACE_OPTIONS.includes(paceDays as (typeof PACE_OPTIONS)[number])) throw new StudyError(400, `Pace must be one of ${PACE_OPTIONS.join(", ")} days`);
  const track = await trackDefinition(trackKey);
  if (!track) throw new StudyError(404, "No such study plan");
  const row = await prisma.studyEnrollment.upsert({
    where: { userId_trackKey: { userId, trackKey } },
    create: { userId, trackKey, paceDays },
    update: { paceDays },
    select: { startedAt: true, paceDays: true, completedAt: true },
  });
  invalidateDashboard(userId);
  const lessons = track.modules.flatMap((m) => m.lessons.map((l) => l.key));
  const done = await prisma.studyLessonProgress.count({ where: { userId, lessonKey: { in: lessons }, completedAt: { not: null } } });
  return pace(row, lessons.length, done);
}

/**
 * (user, track) pairs this process has seen an enrolment row for, and when.
 *
 * Every lesson write — a read, a quiz, an exercise — began with the upsert
 * below, a round trip to a database ~500 ms away that in every case but the
 * very first confirmed a row that was already there. The app never deletes
 * an enrolment (only an account's cascade does), so once seen it is safe to
 * remember for a while. Bounded the cheap way: a full clear at the cap.
 */
const enrolledSeen = new Map<string, number>();
const ENROLLED_MEMO_MS = 10 * 60_000;
const ENROLLED_MEMO_MAX = 20_000;

/** A write without an enrolment enrols at the default pace: a lesson opened from a link still counts. */
async function ensureEnrolled(userId: string, trackKey: string): Promise<void> {
  const key = `${userId}:${trackKey}`;
  const seenAt = enrolledSeen.get(key);
  const now = Date.now();
  if (seenAt !== undefined && now - seenAt < ENROLLED_MEMO_MS) return;
  await prisma.studyEnrollment.upsert({
    where: { userId_trackKey: { userId, trackKey } },
    create: { userId, trackKey, paceDays: DEFAULT_PACE },
    update: {},
    select: { id: true },
  });
  if (enrolledSeen.size >= ENROLLED_MEMO_MAX) enrolledSeen.clear();
  enrolledSeen.set(key, now);
}

/**
 * After any part of a lesson is written: if the lesson is now complete and
 * was not marked, mark it and pay its XP. The conditional update is the
 * one-shot — two tabs finishing the last exercise together both get here,
 * one update matches, the other pays nothing. Then the module and the
 * track are checked the same way.
 */
async function settleLesson(userId: string, track: TrackDefinition, module: ModuleDefinition, lesson: LessonDefinition): Promise<{ completed: boolean; xp: number; moduleDone: boolean; trackDone: boolean }> {
  const row = await prisma.studyLessonProgress.findUnique({
    where: { userId_lessonKey: { userId, lessonKey: lesson.key } },
    select: { readAt: true, quizCorrect: true, quizTotal: true, quizAt: true, exercisesPassed: true, completedAt: true },
  });
  if (!row || row.completedAt || !lessonComplete(lesson, toProgress(row))) return { completed: false, xp: 0, moduleDone: false, trackDone: false };

  const claimed = await prisma.studyLessonProgress.updateMany({
    where: { userId, lessonKey: lesson.key, completedAt: null },
    data: { completedAt: new Date() },
  });
  if (claimed.count !== 1) return { completed: false, xp: 0, moduleDone: false, trackDone: false };

  // `xp` and `rating` together, the way a first solve and a roadmap chest
  // pay: the profile total and the rank ladder. Not the per-source buckets.
  await prisma.user.update({ where: { id: userId }, data: { xp: { increment: lesson.xp }, rating: { increment: lesson.xp } } });
  invalidateDashboard(userId);

  // Module done? Every lesson of it has a completedAt.
  const moduleKeys = module.lessons.map((l) => l.key);
  const moduleDoneCount = await prisma.studyLessonProgress.count({ where: { userId, lessonKey: { in: moduleKeys }, completedAt: { not: null } } });
  const moduleDone = moduleDoneCount === moduleKeys.length;
  let trackDone = false;
  if (moduleDone) {
    const index = track.modules.indexOf(module);
    const nextModule = track.modules[index + 1] ?? null;
    await createNotificationOnce(userId, {
      type: `study_module_done:${module.key}`,
      title: `Module cleared: ${module.title} ✅`,
      body: nextModule
        ? `Every lesson and the checkpoint of ${module.title} are done. Next on your ${track.title} plan: ${nextModule.title}.`
        : `Every lesson and the checkpoint of ${module.title} are done — that was the last module of the ${track.title} plan.`,
      href: `/study-plans/${track.key}`,
    });

    const allKeys = track.modules.flatMap((m) => m.lessons.map((l) => l.key));
    const allDone = await prisma.studyLessonProgress.count({ where: { userId, lessonKey: { in: allKeys }, completedAt: { not: null } } });
    if (allDone === allKeys.length) {
      const finished = await prisma.studyEnrollment.updateMany({
        where: { userId, trackKey: track.key, completedAt: null },
        data: { completedAt: new Date() },
      });
      if (finished.count === 1) {
        trackDone = true;
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: TRACK_BONUS_XP }, rating: { increment: TRACK_BONUS_XP } } });
        invalidateDashboard(userId);
        await createNotificationOnce(userId, {
          type: `study_track_done:${track.key}`,
          title: `${track.title} study plan complete 🏆 +${TRACK_BONUS_XP} XP`,
          body: `Every module of the ${track.title} plan is cleared. Your certificate is on the plan page.`,
          href: `/study-plans/${track.key}`,
        });
      }
    }
  }
  return { completed: true, xp: lesson.xp, moduleDone, trackDone };
}

export interface WriteOutcome {
  progress: LessonProgress & { status: LessonStatus; mastery: number };
  completed: boolean;
  xp: number;
  moduleDone: boolean;
  trackDone: boolean;
}

async function outcome(userId: string, track: TrackDefinition, module: ModuleDefinition, lesson: LessonDefinition): Promise<WriteOutcome> {
  const settled = await settleLesson(userId, track, module, lesson);
  const p = (await progressMap(userId, [lesson.key])).get(lesson.key) ?? EMPTY_PROGRESS;
  return { progress: { ...p, status: lessonStatus(lesson, p), mastery: mastery(lesson, p) }, ...settled };
}

/** The reader reached the end of the text. */
export async function markRead(userId: string, trackKey: string, lessonSlug: string): Promise<WriteOutcome> {
  const { track, module, lesson } = await requireLesson(trackKey, lessonSlug);
  await ensureEnrolled(userId, trackKey);
  await prisma.studyLessonProgress.upsert({
    where: { userId_lessonKey: { userId, lessonKey: lesson.key } },
    create: { userId, lessonKey: lesson.key, readAt: new Date() },
    // A re-read keeps the first date: "read on" is when it was first read.
    update: {},
    select: { id: true },
  });
  await prisma.studyLessonProgress.updateMany({ where: { userId, lessonKey: lesson.key, readAt: null }, data: { readAt: new Date() } });
  return outcome(userId, track, module, lesson);
}

export interface QuizResult extends WriteOutcome {
  correct: number;
  total: number;
  percent: number;
  passed: boolean;
  questions: Array<{ selected: number | null; answer: number; correct: boolean; explanation: string }>;
}

/** Grade a quiz; keep the best score. `answers[i]` is the chosen option index, or null. */
export async function gradeQuiz(userId: string, trackKey: string, lessonSlug: string, answers: Array<number | null>): Promise<QuizResult> {
  const { track, module, lesson } = await requireLesson(trackKey, lessonSlug);
  if (lesson.quiz.length === 0) throw new StudyError(400, "This lesson has no quiz");
  if (!Array.isArray(answers) || answers.length !== lesson.quiz.length) throw new StudyError(400, `Expected ${lesson.quiz.length} answers`);

  const questions = lesson.quiz.map((q, i) => {
    const raw = answers[i];
    const selected = Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) < q.options.length ? (raw as number) : null;
    return { selected, answer: q.answer, correct: selected === q.answer, explanation: q.explanation };
  });
  const correct = questions.filter((q) => q.correct).length;
  const total = lesson.quiz.length;
  const percent = Math.round((100 * correct) / total);
  const passed = lesson.kind === "test" ? percent >= (lesson.passMark ?? 70) : true;

  await ensureEnrolled(userId, trackKey);
  const existing = await prisma.studyLessonProgress.findUnique({ where: { userId_lessonKey: { userId, lessonKey: lesson.key } }, select: { quizCorrect: true, quizTotal: true } });
  const best = existing?.quizCorrect !== null && existing?.quizCorrect !== undefined && existing.quizTotal === total && existing.quizCorrect > correct;
  await prisma.studyLessonProgress.upsert({
    where: { userId_lessonKey: { userId, lessonKey: lesson.key } },
    create: { userId, lessonKey: lesson.key, quizCorrect: correct, quizTotal: total, quizAt: new Date() },
    update: best ? { quizAt: new Date() } : { quizCorrect: correct, quizTotal: total, quizAt: new Date() },
    select: { id: true },
  });
  const settled = await outcome(userId, track, module, lesson);
  return { ...settled, correct, total, percent, passed, questions };
}

/** The Run button: the learner's program on the learner's input. Nothing is recorded. */
export async function runExercise(trackKey: string, lessonSlug: string, exerciseIndex: number, code: string, stdin: string): Promise<ProgramRunResult> {
  const { track, lesson } = await requireLesson(trackKey, lessonSlug);
  if (!lesson.exercises[exerciseIndex]) throw new StudyError(404, "No such exercise");
  return runProgram(code, track.language, stdin);
}

export interface SubmitResult extends WriteOutcome {
  result: ProgramJudgeResult;
  exerciseIndex: number;
}

/** The Submit button: judged against every case, recorded, and on a pass the exercise is ticked. */
export async function submitExercise(userId: string, trackKey: string, lessonSlug: string, exerciseIndex: number, code: string): Promise<SubmitResult> {
  const { track, module, lesson } = await requireLesson(trackKey, lessonSlug);
  const exercise = lesson.exercises[exerciseIndex];
  if (!exercise) throw new StudyError(404, "No such exercise");

  const result = await judgeProgram(code, track.language, exercise.cases);
  if (result.verdict === "ENGINE_ERROR") throw new StudyError(503, `The ${track.title} runner is not answering right now. Give it a moment and submit again.`);

  await ensureEnrolled(userId, trackKey);
  await prisma.studyExerciseSubmission.create({
    data: { userId, lessonKey: lesson.key, exercise: exerciseIndex, code, language: track.language, verdict: result.verdict, passed: result.passed, total: result.total },
    select: { id: true },
  });
  if (result.verdict === "ACCEPTED") {
    const row = await prisma.studyLessonProgress.upsert({
      where: { userId_lessonKey: { userId, lessonKey: lesson.key } },
      create: { userId, lessonKey: lesson.key, exercisesPassed: [exerciseIndex] },
      update: {},
      select: { exercisesPassed: true },
    });
    const passed = Array.isArray(row.exercisesPassed) ? (row.exercisesPassed as number[]) : [];
    if (!passed.includes(exerciseIndex)) {
      await prisma.studyLessonProgress.update({
        where: { userId_lessonKey: { userId, lessonKey: lesson.key } },
        data: { exercisesPassed: [...passed, exerciseIndex].sort((a, b) => a - b) },
        select: { id: true },
      });
    }
  }
  const settled = await outcome(userId, track, module, lesson);
  return { ...settled, result, exerciseIndex };
}

/** The learner's last submission for an exercise, to reopen the editor where they left it. */
export async function lastSubmission(userId: string, trackKey: string, lessonSlug: string, exerciseIndex: number): Promise<{ code: string; verdict: string; submittedAt: Date } | null> {
  const { lesson } = await requireLesson(trackKey, lessonSlug);
  return prisma.studyExerciseSubmission.findFirst({
    where: { userId, lessonKey: lesson.key, exercise: exerciseIndex },
    orderBy: { submittedAt: "desc" },
    select: { code: true, verdict: true, submittedAt: true },
  });
}

/* ── For the dashboard and the reminders ───────────────────────────── */

export interface StudyBand {
  track: string;
  title: string;
  percent: number;
  done: number;
  lessons: number;
  behind: number;
  streak: number;
  next: { slug: string; title: string; module: string } | null;
  completedAt: Date | null;
}

/** The "continue learning" band: the reader's most recently touched plan, or null. */
export async function studyBandFor(userId: string): Promise<StudyBand | null> {
  const enrollments = await prisma.studyEnrollment.findMany({ where: { userId }, select: { trackKey: true, completedAt: true, startedAt: true } });
  if (enrollments.length === 0) return null;
  // An unfinished plan first; then the most recently started.
  const pick = [...enrollments].sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt)) || b.startedAt.getTime() - a.startedAt.getTime())[0]!;
  const payload = await trackFor(pick.trackKey, userId);
  if (!payload) return null;
  return {
    track: payload.track.key,
    title: payload.track.title,
    percent: payload.summary.percent,
    done: payload.summary.done,
    lessons: payload.summary.lessons,
    behind: payload.enrollment?.behind ?? 0,
    streak: payload.summary.streak,
    next: payload.summary.next ? { slug: payload.summary.next.slug, title: payload.summary.next.title, module: payload.summary.next.module } : null,
    completedAt: pick.completedAt,
  };
}
