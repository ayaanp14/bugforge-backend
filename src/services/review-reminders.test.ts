import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewDueContent, reviewDuePeriod } from "./review-reminders.js";
import { reviewIndexOf } from "./skill-profile.js";
import { buildSkillProfile } from "../lib/skill-profile.js";
import { dayStartMs, type Attempt, type ItemHistory } from "../lib/skill-score.js";

/**
 * The review reminder's pure parts: when it runs, what it says, and what the
 * review index holds for a profile. The job's queries run against a real
 * database in backend/scratch/review-reminder-smoke.mts.
 *
 * Run with: npm test
 */

const IST = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 7, h, m) - 330 * 60_000);

test("it runs 16:00–18:00 IST, once a product day", () => {
  assert.equal(reviewDuePeriod(IST(15, 59)), null);
  assert.equal(reviewDuePeriod(IST(16, 0)), "2026-10-07");
  assert.equal(reviewDuePeriod(IST(17, 59)), "2026-10-07");
  assert.equal(reviewDuePeriod(IST(18, 0)), null);
});

const k = (label: string, key = `dsa:${label.toLowerCase()}`) => ({ key, label });

test("it names the due skills, most overdue first, and sends each to where the first can be practised", () => {
  const one = reviewDueContent([k("Two Pointers", "dsa:two-pointers")]);
  assert.equal(one.title, "Two Pointers is due for review");
  assert.match(one.body, /^One problem you have not seen keeps it. Today's mission/);
  assert.equal(one.href, "/");
  assert.equal(reviewDueContent([k("Two Pointers"), k("Hashing")]).title, "Two Pointers and Hashing are due for review");
  assert.match(reviewDueContent([k("Two Pointers"), k("Hashing")]).body, /^Start with Two Pointers: one problem/);
  assert.equal(reviewDueContent([k("A"), k("B"), k("C")]).title, "A, B and C are due for review");
  assert.equal(reviewDueContent([k("A"), k("B"), k("C"), k("D"), k("E")]).title, "A, B and 3 more are due for review");
  // The mission lines up coding reviews only; an aptitude section is practised from its skill.
  const apt = reviewDueContent([k("Quantitative Aptitude", "apt:quantitative"), k("Arrays")]);
  assert.equal(apt.href, "/skills?skill=apt%3Aquantitative");
  assert.match(apt.body, /^Start with Quantitative Aptitude: one question you have not seen keeps it. Your skill profile shows where to practise it.$/);
});

test("the index holds each started skill's next review, soonest first, and nothing for an account with no solve", () => {
  const at = (day: number) => dayStartMs(20_000 + day) + 10 * 3_600_000;
  const ok = (t: number): Attempt => ({ at: t, outcome: "accepted", passRatio: 1 });
  let n = 0;
  const item = (skill: string, attempts: Attempt[]): ItemHistory => ({ source: "problem", id: `p${++n}`, title: "x", href: "/x", difficulty: "easy", skills: [skill], attempts });
  const catalogue = new Map(["dsa:arrays", "dsa:hash-table", "dsa:strings"].map((k) => [k, { source: "problem" as const, count: 20, points: 40 }]));

  const profile = buildSkillProfile({
    items: [item("dsa:arrays", [ok(at(-10))]), item("dsa:hash-table", [ok(at(-1))])],
    assessments: [],
    catalogue,
    problems: [],
    asOf: at(0),
  });
  const index = reviewIndexOf(profile);
  assert.deepEqual(index.map((s) => s.key), ["dsa:arrays", "dsa:hash-table"], "arrays was due first; strings was never started");
  assert.ok(new Date(index[0]!.dueAt).getTime() < at(0), "arrays is overdue");
  assert.ok(new Date(index[1]!.dueAt).getTime() > at(0), "hashing is not due yet");

  const empty = buildSkillProfile({ items: [], assessments: [], catalogue, problems: [], asOf: at(0) });
  assert.deepEqual(reviewIndexOf(empty), []);
});
