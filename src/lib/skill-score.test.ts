import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ASSIST_FACTOR,
  CEILING,
  PAIRED_FACTOR,
  REVIEW_LADDER_DAYS,
  SOURCE_RULES,
  dayOf,
  dayStartMs,
  mistakeOf,
  outcomeOf,
  reviewSchedule,
  scoreSkill,
  summarizeItem,
  type AssessmentRecord,
  type Attempt,
  type Difficulty,
  type ItemHistory,
  type SkillCatalogue,
} from "./skill-score.js";

/**
 * The scoring rules on hand-written histories: what a solve is worth, what
 * caps a skill, how reviews climb and lapse, and that activity alone cannot
 * buy mastery. services/skill-profile.ts builds these records from the
 * tables; nothing here needs a database.
 *
 * Run with: npm test
 */

const BASE_DAY = 20_000; // an arbitrary platform day
/** Noon-ish on platform day `n` (relative to BASE_DAY), plus `mins` minutes. */
const at = (n: number, mins = 0) => dayStartMs(BASE_DAY + n) + 10 * 3_600_000 + mins * 60_000;
const NOW = at(0, 600);

const ok = (t: number, extra: Partial<Attempt> = {}): Attempt => ({ at: t, outcome: "accepted", passRatio: 1, ...extra });
const wa = (t: number, passRatio = 0.2): Attempt => ({ at: t, outcome: "wrong", passRatio });
const tle = (t: number): Attempt => ({ at: t, outcome: "timeout", passRatio: 0.5 });

let n = 0;
const item = (difficulty: Difficulty, attempts: Attempt[], extra: Partial<ItemHistory> = {}): ItemHistory => ({
  source: "problem",
  id: `p${++n}`,
  title: `Problem ${n}`,
  href: `/problems/p${n}`,
  difficulty,
  skills: ["dsa:arrays"],
  attempts,
  ...extra,
});

const CAT: SkillCatalogue = { source: "problem", count: 100, points: 200 };

function score(items: ItemHistory[], asOf = NOW, assessments: AssessmentRecord[] = []) {
  const sums = items.map((i) => summarizeItem(i, asOf)).filter((s) => s != null);
  return scoreSkill("dsa:arrays", "problem", sums, assessments, CAT, asOf);
}

test("verdicts from every judge land in one vocabulary, and failures are classed by what the judge saw", () => {
  assert.equal(outcomeOf("ACCEPTED"), "accepted");
  assert.equal(outcomeOf("FAILED"), "wrong");
  assert.equal(outcomeOf("INVALID_QUERY"), "compile");
  assert.equal(outcomeOf("ERROR"), "runtime");
  assert.equal(mistakeOf({ outcome: "wrong", passRatio: 0.9 }), "EDGE_CASE");
  assert.equal(mistakeOf({ outcome: "wrong", passRatio: 0.3 }), "CONCEPTUAL");
  assert.equal(mistakeOf({ outcome: "timeout" }), "COMPLEXITY");
  assert.equal(mistakeOf({ outcome: "runtime" }), "IMPLEMENTATION");
  assert.equal(mistakeOf({ outcome: "compile" }), "SYNTAX");
  assert.equal(mistakeOf({ outcome: "accepted" }), null);
});

test("no evidence is no score: unstarted, zero, no confidence", () => {
  const s = score([]);
  assert.equal(s.mastery, 0);
  assert.equal(s.status, "unstarted");
  assert.equal(s.confidence, 0);
  assert.equal(summarizeItem(item("easy", [ok(at(1))]), NOW), null, "an attempt after asOf does not exist yet");
});

test("a solve's credit: first-try independent is 1; hints, the editorial, a pair room and retries each cost", () => {
  const clean = summarizeItem(item("medium", [ok(at(-1))]), NOW)!;
  assert.equal(clean.quality, 1);
  assert.equal(clean.firstTry, true);

  const hinted = summarizeItem(item("medium", [ok(at(-1, 30))], { hintsAt: at(-1, 5) }), NOW)!;
  assert.equal(hinted.assist, "hints");
  assert.equal(hinted.quality, ASSIST_FACTOR.hints);

  const read = summarizeItem(item("medium", [ok(at(-1, 30))], { solutionAt: at(-1, 5), hintsAt: at(-1, 1) }), NOW)!;
  assert.equal(read.assist, "solution", "the editorial outranks the hints");

  // Help opened after the accept is study, not leaning.
  const after = summarizeItem(item("medium", [ok(at(-1, 30))], { solutionAt: at(-1, 40) }), NOW)!;
  assert.equal(after.assist, "none");

  const paired = summarizeItem(item("medium", [ok(at(-1), { paired: true })]), NOW)!;
  assert.equal(paired.quality, PAIRED_FACTOR);

  const fifth = summarizeItem(item("medium", [wa(at(-1, 1)), wa(at(-1, 2)), wa(at(-1, 3)), wa(at(-1, 4)), ok(at(-1, 5))]), NOW)!;
  assert.equal(fifth.attemptsToSolve, 5);
  assert.equal(fifth.quality, SOURCE_RULES.problem.retry[4]);
});

test("re-solving the same problem earns nothing more than solving it once", () => {
  const once = score([item("medium", [ok(at(-1))])]);
  const often = score([item("medium", Array.from({ length: 40 }, (_, i) => ok(at(-1, i))))]);
  assert.equal(often.mastery, once.mastery);
  assert.equal(often.counts.solved, 1);
});

test("easy work alone cannot pass the Easy ceiling, however much of it there is", () => {
  const easies = Array.from({ length: 60 }, (_, i) => item("easy", [ok(at(-1, i))]));
  const s = score(easies);
  assert.ok(s.mastery <= CEILING.easy * 100, `${s.mastery} > ${CEILING.easy * 100}`);
  assert.equal(s.ceiling!.value, Math.round(CEILING.easy * 100));
  assert.ok(s.indicators.some((i) => i.code === "easy_only"));
  // …and sixty of them are worth little more than ten: the Easy cap.
  const ten = score(easies.slice(0, 10));
  assert.ok(s.mastery - ten.mastery <= 1, `sixty easies ${s.mastery} vs ten ${ten.mastery}`);
});

test("a Medium lifts the ceiling to 85 and only a Hard opens it fully", () => {
  const mediums = Array.from({ length: 12 }, () => item("medium", [ok(at(-1))]));
  const m = score(mediums);
  assert.equal(m.ceiling!.value, Math.round(CEILING.medium * 100));
  assert.ok(m.mastery <= CEILING.medium * 100);
  const withHard = score([...mediums, ...Array.from({ length: 4 }, () => item("hard", [ok(at(-1))]))]);
  assert.equal(withHard.ceiling!.value, 100);
  assert.ok(withHard.mastery > m.mastery);
  assert.equal(withHard.status, "strong");
});

test("solves that all came after the editorial cap the skill at 30", () => {
  const read = Array.from({ length: 10 }, () => item("hard", [ok(at(-1, 30))], { solutionAt: at(-1) }));
  const s = score(read);
  assert.equal(s.ceiling!.value, Math.round(CEILING.assistedOnly * 100));
  assert.ok(s.mastery <= 30);
});

test("leaning on help lowers the score against the same solves made alone", () => {
  const alone = score(Array.from({ length: 6 }, () => item("medium", [ok(at(-1, 30))])));
  const helped = score(Array.from({ length: 6 }, () => item("medium", [ok(at(-1, 30))], { hintsAt: at(-1) })));
  assert.ok(helped.mastery < alone.mastery, `${helped.mastery} !< ${alone.mastery}`);
  assert.ok(helped.indicators.some((i) => i.code === "assisted"));
});

test("a solve is timed from the first opening only within one sitting", () => {
  const sitting = summarizeItem(item("medium", [ok(at(-1, 40))], { openedAt: at(-1, 10) }), NOW)!;
  assert.equal(sitting.solveSecs, 30 * 60);
  const nextDay = summarizeItem(item("medium", [ok(at(-1, 40))], { openedAt: at(-3) }), NOW)!;
  assert.equal(nextDay.solveSecs, null);
  const openedAfter = summarizeItem(item("medium", [ok(at(-1, 40))], { openedAt: at(-1, 50) }), NOW)!;
  assert.equal(openedAfter.solveSecs, null, "a problem solved before engagement was recorded is untimed");
  // An hour on a 90-second question is a tab left open, not a slow answer.
  const idle = summarizeItem({ ...item("medium", [ok(at(-1), { secs: 3600 })]), source: "aptitude", parSecs: 90 }, NOW)!;
  assert.equal(idle.solveSecs, null);
  const slowButReal = summarizeItem({ ...item("medium", [ok(at(-1), { secs: 300 })]), source: "aptitude", parSecs: 90 }, NOW)!;
  assert.equal(slowButReal.solveSecs, 300);
});

test("slow solves show as pace and as a weak spot", () => {
  const slow = score(Array.from({ length: 3 }, () => item("easy", [ok(at(-1, 60))], { openedAt: at(-1) })));
  const pace = slow.components.find((c) => c.key === "pace")!;
  assert.ok(pace.value! < 100);
  assert.equal(slow.counts.paceRatio, 4);
  assert.ok(slow.indicators.some((i) => i.code === "slow"));
});

test("the review ladder climbs with practice spread out, even daily, and lapses only on forgetting", () => {
  const solveOn = (days: number[], difficulty: Difficulty = "easy") => days.map((d) => summarizeItem(item(difficulty, [ok(at(d))]), at(30))!);

  const first = reviewSchedule(solveOn([0]), at(0, 60))!;
  assert.equal(first.stage, 0);
  assert.equal(dayOf(first.nextReviewAt), BASE_DAY + REVIEW_LADDER_DAYS[0]);

  const onTime = reviewSchedule(solveOn([0, 2]), at(2, 60))!;
  assert.equal(onTime.stage, 1);
  assert.equal(dayOf(onTime.nextReviewAt), BASE_DAY + 2 + REVIEW_LADDER_DAYS[1]);

  const early = reviewSchedule(solveOn([0, 1]), at(1, 60))!;
  assert.equal(early.stage, 0, "a day after the first solve is not yet a review");

  const daily = reviewSchedule(solveOn(Array.from({ length: 30 }, (_, i) => i)), at(29, 60))!;
  // 2 days, then 7 more, then the 21-day rung: by day 29 the third rung.
  assert.equal(daily.stage, 2, `thirty straight days should climb, got stage ${daily.stage}`);

  // A failed day on a problem no harder than one solved: drop a rung, review tomorrow.
  const lapsed = reviewSchedule([...solveOn([0, 2]), summarizeItem(item("easy", [wa(at(4))]), at(30))!], at(4, 60))!;
  assert.equal(lapsed.stage, 0);
  assert.equal(dayOf(lapsed.nextReviewAt), BASE_DAY + 5);
  // Failing above one's level is learning, not forgetting.
  const reaching = reviewSchedule([...solveOn([0, 2]), summarizeItem(item("hard", [wa(at(4))]), at(30))!], at(4, 60))!;
  assert.equal(reaching.stage, 1);

  const due = reviewSchedule(solveOn([0]), at(5))!;
  assert.equal(due.due, true);
  assert.equal(due.overdueDays, 5 - REVIEW_LADDER_DAYS[0]);
});

test("time away costs retention, and retention can take at most a quarter of the score", () => {
  const items = Array.from({ length: 8 }, () => item("medium", [ok(at(-1))]));
  const fresh = score(items, at(0));
  const months = score(items, at(200));
  assert.ok(months.mastery < fresh.mastery);
  assert.ok(months.mastery >= Math.floor(fresh.mastery * 0.75), `${months.mastery} lost more than a quarter of ${fresh.mastery}`);
  assert.ok(months.indicators.some((i) => i.code === "rusty"));
  assert.ok(months.confidence < fresh.confidence, "a long-idle skill is held with less confidence");
});

test("the judge's verdicts become weak spots: time limits, near misses, crashes, low accuracy", () => {
  const s = score([
    item("medium", [tle(at(-2)), ok(at(-2, 30))]),
    item("medium", [tle(at(-2, 40))]),
    item("medium", [wa(at(-1), 0.9), ok(at(-1, 10))]),
    item("medium", [wa(at(-1, 20), 0.95)]),
    item("medium", [wa(at(-1, 30), 0.1)]),
  ]);
  const codes = s.indicators.map((i) => i.code);
  assert.ok(codes.includes("timeouts"));
  assert.ok(codes.includes("near_misses"));
  assert.ok(codes.includes("low_accuracy"));
  assert.equal(s.indicators.find((i) => i.code === "timeouts")!.mistake, "COMPLEXITY");
  assert.equal(s.indicators.find((i) => i.code === "near_misses")!.mistake, "EDGE_CASE");
  assert.equal(s.counts.failures.timeout, 2);
});

test("multiple choice: accuracy counts only first answers, a retry after the key is shown is near-worthless", () => {
  const q = (attempts: Attempt[]): ItemHistory => ({ ...item("medium", attempts), source: "aptitude", skills: ["apt:quantitative"] });
  const sums = [
    summarizeItem(q([ok(at(-1))]), NOW)!,
    summarizeItem(q([wa(at(-1, 1)), ok(at(-1, 2), { revealed: true })]), NOW)!,
  ];
  assert.equal(sums[1].assist, "solution");
  const s = scoreSkill("apt:quantitative", "aptitude", sums, [], { source: "aptitude", count: 300, points: 120 }, NOW);
  const accuracy = s.components.find((c) => c.key === "accuracy")!;
  assert.match(accuracy.detail, /1 of 2 questions right on the first answer/);
  assert.equal(s.counts.solution, 1);
});

test("skill tests: the best counted sitting scaled by level; a proctor-closed one is not evidence", () => {
  const sit = (percent: number, level: AssessmentRecord["level"], terminated = false, topics: AssessmentRecord["topics"] = []): AssessmentRecord => ({
    id: "t",
    title: "OS",
    href: "/skill-tests/os-basic",
    skills: ["cs:os"],
    at: at(-1),
    percent,
    level,
    terminated,
    topics,
  });
  const cat: SkillCatalogue = { source: "assessment", count: 2, points: 0 };
  const basic = scoreSkill("cs:os", null, [], [sit(80, "basic")], cat, NOW);
  const inter = scoreSkill("cs:os", null, [], [sit(80, "intermediate")], cat, NOW);
  assert.ok(inter.mastery > basic.mastery);
  assert.ok(basic.mastery <= 56 && basic.mastery >= 55, `80% at basic ≈ 56, got ${basic.mastery}`);

  const cheated = scoreSkill("cs:os", null, [], [sit(100, "intermediate", true)], cat, NOW);
  assert.equal(cheated.mastery, 0);
  assert.equal(cheated.status, "learning", "started, but nothing counted");

  const weak = scoreSkill("cs:os", null, [], [sit(60, "basic", false, [{ label: "Deadlocks", total: 4, correct: 1 }, { label: "Scheduling", total: 4, correct: 4 }])], cat, NOW);
  assert.ok(weak.indicators.some((i) => i.code === "weak_topic" && /Deadlocks: 1 of 4/.test(i.message)));
  assert.ok(!weak.indicators.some((i) => /Scheduling/.test(i.message)));
});
