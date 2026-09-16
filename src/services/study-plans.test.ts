import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PROGRESS, lessonComplete, lessonStatus, mastery, moduleStatuses, pace, quizPercent, streakDays, type LessonProgress } from "./study-plans.js";
import { normalizeOutput } from "../lib/program-judge.js";

/**
 * The study plans' pure rules: when a lesson counts as done (and pays its
 * XP), how mastery is scored, what the pace says, which module is current,
 * and what "the same output" means to the program judge. Pinned here
 * without a database or an engine.
 *
 * Run with: npm test
 */

const exercise = { title: "x", prompt: "", starter: "", solution: "", hints: [], cases: [{ stdin: "", expected: "1" }] };
const question = { prompt: "q", options: ["a", "b"], answer: 0, explanation: "" };

const lesson = { kind: "lesson" as const, passMark: null, exercises: [exercise], quiz: [question, question] };
const readOnly = { kind: "lesson" as const, passMark: null, exercises: [], quiz: [] };
const test = { kind: "test" as const, passMark: 70, exercises: [exercise, exercise], quiz: Array(10).fill(question) };

const at = new Date("2026-09-10T10:00:00Z");
const p = (over: Partial<LessonProgress>): LessonProgress => ({ ...EMPTY_PROGRESS, ...over });

describe("lessonComplete", () => {
  it("needs the text read, the quiz taken and every exercise passed", () => {
    assert.equal(lessonComplete(lesson, p({})), false);
    assert.equal(lessonComplete(lesson, p({ readAt: at })), false);
    assert.equal(lessonComplete(lesson, p({ readAt: at, quizCorrect: 0, quizTotal: 2, quizAt: at })), false);
    assert.equal(lessonComplete(lesson, p({ readAt: at, quizCorrect: 0, quizTotal: 2, quizAt: at, exercisesPassed: [0] })), true);
  });
  it("a lesson with nothing but text is done when read", () => {
    assert.equal(lessonComplete(readOnly, p({})), false);
    assert.equal(lessonComplete(readOnly, p({ readAt: at })), true);
  });
  it("a test needs the pass mark and both exercises, and does not need reading", () => {
    assert.equal(lessonComplete(test, p({ quizCorrect: 6, quizTotal: 10, quizAt: at, exercisesPassed: [0, 1] })), false);
    assert.equal(lessonComplete(test, p({ quizCorrect: 7, quizTotal: 10, quizAt: at, exercisesPassed: [0] })), false);
    assert.equal(lessonComplete(test, p({ quizCorrect: 7, quizTotal: 10, quizAt: at, exercisesPassed: [0, 1] })), true);
  });
});

describe("lessonStatus", () => {
  it("is todo, then in-progress at the first touch, then done", () => {
    assert.equal(lessonStatus(lesson, p({})), "todo");
    assert.equal(lessonStatus(lesson, p({ quizCorrect: 1, quizTotal: 2, quizAt: at })), "in-progress");
    assert.equal(lessonStatus(lesson, p({ readAt: at, quizCorrect: 1, quizTotal: 2, quizAt: at, exercisesPassed: [0] })), "done");
  });
  it("trusts a stored completedAt even if the definition later grew", () => {
    assert.equal(lessonStatus({ ...lesson, exercises: [exercise, exercise] }, p({ completedAt: at })), "done");
  });
});

describe("mastery", () => {
  it("weights reading 30, quiz 40, exercises 30", () => {
    assert.equal(mastery(lesson, p({})), 0);
    assert.equal(mastery(lesson, p({ readAt: at })), 30);
    assert.equal(mastery(lesson, p({ readAt: at, quizCorrect: 1, quizTotal: 2 })), 50);
    assert.equal(mastery(lesson, p({ readAt: at, quizCorrect: 2, quizTotal: 2, exercisesPassed: [0] })), 100);
  });
  it("hands a missing part's weight to the others", () => {
    assert.equal(mastery(readOnly, p({ readAt: at })), 100);
    assert.equal(mastery({ ...lesson, exercises: [] }, p({ readAt: at })), 43);
  });
  it("a test has no reading part", () => {
    assert.equal(mastery(test, p({ quizCorrect: 10, quizTotal: 10, exercisesPassed: [0] })), Math.round((100 * (40 + 15)) / 70));
  });
  it("quizPercent rounds and is null before a quiz", () => {
    assert.equal(quizPercent(p({})), null);
    assert.equal(quizPercent(p({ quizCorrect: 2, quizTotal: 3 })), 67);
  });
});

describe("pace", () => {
  const enrollment = { startedAt: new Date("2026-09-01T00:00:00Z"), paceDays: 30, completedAt: null };
  it("expects lessons in proportion to the days elapsed", () => {
    const day1 = pace(enrollment, 120, 0, new Date("2026-09-01T12:00:00Z"));
    assert.equal(day1.dayNumber, 1);
    assert.equal(day1.expectedDone, 4);
    assert.equal(day1.behind, 4);
    assert.equal(day1.perDay, 4);
    const day10 = pace(enrollment, 120, 45, new Date("2026-09-10T12:00:00Z"));
    assert.equal(day10.expectedDone, 40);
    assert.equal(day10.behind, 0);
    assert.equal(day10.ahead, 5);
  });
  it("never expects more than the track holds, and projects a finish from the rate so far", () => {
    const late = pace(enrollment, 120, 60, new Date("2026-12-01T00:00:00Z"));
    assert.equal(late.expectedDone, 120);
    assert.equal(late.behind, 60);
    assert.ok(late.projectedFinish && late.projectedFinish.getTime() > new Date("2026-12-01T00:00:00Z").getTime());
    assert.equal(pace(enrollment, 120, 0, new Date("2026-09-05T00:00:00Z")).projectedFinish, null);
  });
  it("targetFinish is the start plus the pace", () => {
    assert.equal(pace(enrollment, 10, 0).targetFinish.toISOString(), "2026-10-01T00:00:00.000Z");
  });
});

describe("moduleStatuses", () => {
  it("marks the first unfinished module current and the rest upcoming", () => {
    const done = { lessons: [{ done: true }, { done: true }] };
    const half = { lessons: [{ done: true }, { done: false }] };
    const none = { lessons: [{ done: false }] };
    assert.deepEqual(moduleStatuses([done, half, none]), ["done", "current", "upcoming"]);
    assert.deepEqual(moduleStatuses([none, none]), ["current", "upcoming"]);
    assert.deepEqual(moduleStatuses([done, done]), ["done", "done"]);
  });
  it("a finished module after an unfinished one is still done", () => {
    const done = { lessons: [{ done: true }] };
    const none = { lessons: [{ done: false }] };
    assert.deepEqual(moduleStatuses([none, done, none]), ["current", "done", "upcoming"]);
  });
});

describe("streakDays", () => {
  const now = new Date("2026-09-10T15:00:00Z");
  const day = (d: string) => new Date(`2026-09-${d}T09:00:00Z`);
  it("counts back from today or yesterday", () => {
    assert.equal(streakDays([day("10"), day("09"), day("08")], now), 3);
    assert.equal(streakDays([day("09"), day("08")], now), 2);
    assert.equal(streakDays([day("08"), day("07")], now), 0);
    assert.equal(streakDays([], now), 0);
  });
  it("a gap ends it", () => {
    assert.equal(streakDays([day("10"), day("08"), day("07")], now), 1);
  });
});

describe("normalizeOutput", () => {
  it("ignores trailing spaces, trailing blank lines and CRLF", () => {
    assert.equal(normalizeOutput("a \r\nb\r\n\r\n"), "a\nb");
    assert.equal(normalizeOutput("a\nb"), normalizeOutput("a\nb\n"));
    assert.notEqual(normalizeOutput("a\nb"), normalizeOutput("a\n\nb"));
    assert.notEqual(normalizeOutput(" a"), normalizeOutput("a"));
  });
});
