import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HEATMAP_DAYS, heatmapWindow, mergeHistory, nextStreak, solveXp, sqlHistoryRow, sqlSolveTally, tallyHeatmap } from "./activity.js";
import { dayKey } from "./clock.js";
import { SQL_PROBLEMS } from "./sql-problems/index.js";

/**
 * What counts as activity: the solving streak, the heatmap's days, the merged
 * history and the SQL share of the counts (lib/activity.ts). Coding and SQL
 * problems count alike since 2026-10-05; these pin that a day both arenas
 * touch is one day, and that nothing a SQL row carries can leak its query.
 *
 * Run with: npx tsx --test src/lib/activity.test.ts
 */

// The product calendar is IST (lib/clock.ts); 18:30 UTC is midnight there.
const at = (iso: string) => new Date(iso);
const stats = (lastActive: string, currentStreak: number, longestStreak = currentStreak) => ({
  lastActive: at(lastActive),
  currentStreak,
  longestStreak,
});

describe("nextStreak", () => {
  it("starts at one for an account with no stats row", () => {
    assert.deepEqual(nextStreak(null, at("2026-10-05T06:00:00Z")), { currentStreak: 1, longestStreak: 1 });
  });

  it("extends a streak last counted yesterday and raises the longest with it", () => {
    assert.deepEqual(nextStreak(stats("2026-10-04T06:00:00Z", 4), at("2026-10-05T06:00:00Z")), { currentStreak: 5, longestStreak: 5 });
    assert.deepEqual(nextStreak(stats("2026-10-04T06:00:00Z", 4, 9), at("2026-10-05T06:00:00Z")), { currentStreak: 5, longestStreak: 9 });
  });

  it("does not count a day twice: a second solve today keeps the streak", () => {
    // A coding solve at 10:00 IST, then a SQL solve at 20:00 IST the same day.
    const afterCoding = stats("2026-10-05T04:30:00Z", 5);
    assert.deepEqual(nextStreak(afterCoding, at("2026-10-05T14:30:00Z")), { currentStreak: 5, longestStreak: 5 });
  });

  it("restarts at one after a missed day, keeping the longest", () => {
    assert.deepEqual(nextStreak(stats("2026-10-03T06:00:00Z", 12, 12), at("2026-10-05T06:00:00Z")), { currentStreak: 1, longestStreak: 12 });
  });

  it("draws the day on IST, not UTC", () => {
    // 23:30 IST on the 4th, then 00:30 IST on the 5th: one UTC day, two IST days.
    assert.equal(nextStreak(stats("2026-10-04T18:00:00Z", 3), at("2026-10-04T19:00:00Z")).currentStreak, 4);
    // 00:30 IST and 22:30 IST on the 5th: two UTC days, one IST day.
    assert.equal(nextStreak(stats("2026-10-04T19:00:00Z", 3), at("2026-10-05T17:00:00Z")).currentStreak, 3);
  });

  it("never leaves a solve's day at zero", () => {
    // Stamped today by something that counts no day (a bug fix) while at 0:
    // a new account whose first act was a fix, or a lapsed streak.
    assert.deepEqual(nextStreak(stats("2026-10-05T03:00:00Z", 0, 6), at("2026-10-05T09:00:00Z")), { currentStreak: 1, longestStreak: 6 });
  });

  it("is safe to compute from a stale read: concurrent solves land on the same values", () => {
    const now = at("2026-10-05T09:00:00Z");
    const before = stats("2026-10-04T09:00:00Z", 7, 7);
    // Two solves (say one coding, one SQL) both read `before`…
    const first = nextStreak(before, now);
    const second = nextStreak(before, now);
    assert.deepEqual(first, second);
    // …and one that reads the row after the other wrote it agrees too.
    const written = { lastActive: now, ...first };
    assert.deepEqual(nextStreak(written, at("2026-10-05T10:00:00Z")), first);
    assert.equal(first.currentStreak, 8, "the day is counted once, not twice");
  });
});

describe("tallyHeatmap", () => {
  const now = at("2026-10-05T09:00:00Z"); // 14:30 IST on the 5th
  const { from } = heatmapWindow(now);
  const today = dayKey(now);

  it("covers 365 IST days ending today", () => {
    const { dates } = tallyHeatmap([], from);
    assert.equal(dates.length, HEATMAP_DAYS);
    assert.equal(dates.at(-1), "2026-10-05");
    assert.equal(dates[0], "2025-10-06");
    assert.equal(today, "2026-10-05");
  });

  it("lights a day that only a SQL solve touched", () => {
    const t = tallyHeatmap([{ d: "2026-10-01", n: 2n }], from);
    assert.equal(t.dailyCounts["2026-10-01"], 2);
    assert.equal(t.activeDays, 1);
    assert.equal(t.totalSubmissions, 2);
  });

  it("sums a day both arenas name and counts it as one active day", () => {
    // The statement unions one GROUP BY per table, so a day can arrive twice.
    const t = tallyHeatmap(
      [
        { d: "2026-10-05", n: 1n },
        { d: "2026-10-05", n: 3 },
      ],
      from,
    );
    assert.equal(t.dailyCounts["2026-10-05"], 4);
    assert.equal(t.activeDays, 1);
    assert.equal(t.currentStreak, 1);
    assert.equal(t.maxStreak, 1);
  });

  it("runs a streak across arenas", () => {
    const t = tallyHeatmap(
      [
        { d: "2026-10-03", n: 1 }, // coding
        { d: "2026-10-04", n: 1 }, // SQL
        { d: "2026-10-05", n: 2 }, // coding
        { d: "2026-10-05", n: 1 }, // SQL
        { d: "2026-09-20", n: 1 },
      ],
      from,
    );
    assert.equal(t.currentStreak, 3);
    assert.equal(t.maxStreak, 3);
    assert.equal(t.activeDays, 4);
    assert.equal(t.totalSubmissions, 6);
  });

  it("reads the current run as zero until today is solved", () => {
    const t = tallyHeatmap([{ d: "2026-10-03", n: 1 }, { d: "2026-10-04", n: 1 }], from);
    assert.equal(t.currentStreak, 0);
    assert.equal(t.maxStreak, 2);
  });
});

describe("history rows", () => {
  const easy = SQL_PROBLEMS.find((p) => p.difficulty === "EASY")!;

  it("shapes a SQL submission to link to /sql/<slug>, never as a coding problem", () => {
    const row = sqlHistoryRow({ id: "q1", slug: easy.slug, verdict: "ACCEPTED", runtimeMs: 12.6, submittedAt: at("2026-10-05T09:00:00Z") });
    assert.equal(row.type, "sql");
    assert.equal(row.sqlSlug, easy.slug);
    assert.equal(row.problemSlug, undefined, "the mobile app opens any problemSlug in its coding workbench");
    assert.equal(row.title, easy.title);
    assert.equal(row.difficulty, "EASY");
    assert.equal(row.language, "MySQL");
    assert.equal(row.runtime, "13ms");
    assert.equal(row.memory, "N/A");
  });

  it("never carries the query, even when the row it is given does", () => {
    const leaky = { id: "q1", slug: easy.slug, verdict: "WRONG_ANSWER", runtimeMs: 0, submittedAt: at("2026-10-05T09:00:00Z"), query: "SELECT secret_column FROM t" };
    const row = sqlHistoryRow(leaky);
    assert.ok(!JSON.stringify(row).includes("secret_column"));
    assert.equal(row.runtime, "N/A");
  });

  it("keeps a row for a problem the module no longer ships", () => {
    const row = sqlHistoryRow({ id: "q2", slug: "retired-problem", verdict: "ACCEPTED", runtimeMs: 3, submittedAt: at("2026-10-05T09:00:00Z") });
    assert.equal(row.title, "retired-problem");
    assert.equal(row.sqlSlug, "retired-problem");
  });

  it("merges the arenas newest first and pages the result", () => {
    const row = (id: string, iso: string) => ({ id, submittedAt: at(iso) });
    const problems = [row("p2", "2026-10-05T10:00:00Z"), row("p1", "2026-10-03T10:00:00Z")];
    const bugs = [row("b1", "2026-10-04T10:00:00Z")];
    const sql = [row("s2", "2026-10-05T11:00:00Z"), row("s1", "2026-10-02T10:00:00Z")];
    assert.deepEqual(mergeHistory([problems, bugs, sql], 0, 10).map((r) => r.id), ["s2", "p2", "b1", "p1", "s1"]);
    assert.deepEqual(mergeHistory([problems, bugs, sql], 1, 2).map((r) => r.id), ["p2", "b1"]);
  });

  it("keeps the arenas' order for rows at the same instant", () => {
    const same = "2026-10-05T10:00:00Z";
    assert.deepEqual(
      mergeHistory([[{ id: "p", submittedAt: same }], [{ id: "b", submittedAt: same }], [{ id: "s", submittedAt: same }]], 0, 3).map((r) => r.id),
      ["p", "b", "s"],
    );
  });
});

describe("SQL solves", () => {
  const now = at("2026-10-05T09:00:00Z");
  const easy = SQL_PROBLEMS.find((p) => p.difficulty === "EASY")!;
  const medium = SQL_PROBLEMS.find((p) => p.difficulty === "MEDIUM")!;
  const hard = SQL_PROBLEMS.find((p) => p.difficulty === "HARD")!;

  it("counts the problems solved, the week's share and its XP", () => {
    const t = sqlSolveTally(
      [
        { slug: easy.slug, submittedAt: at("2026-09-01T09:00:00Z") },
        { slug: medium.slug, submittedAt: at("2026-10-02T09:00:00Z") },
        { slug: hard.slug, submittedAt: at("2026-10-05T08:00:00Z") },
      ],
      now,
    );
    assert.deepEqual(t, { solved: 3, solvedThisWeek: 2, solvedToday: 1, xpThisWeek: 20 + 30 });
  });

  it("counts only problems the module still ships", () => {
    const t = sqlSolveTally([{ slug: "retired-problem", submittedAt: now }, { slug: easy.slug, submittedAt: now }], now);
    assert.deepEqual(t, { solved: 1, solvedThisWeek: 1, solvedToday: 1, xpThisWeek: 10 });
  });

  it("pays the coding table, whichever way the difficulty is spelled", () => {
    assert.equal(solveXp("EASY"), 10);
    assert.equal(solveXp("medium"), 20);
    assert.equal(solveXp("Hard"), 30);
    assert.equal(solveXp(""), 10);
  });
});
