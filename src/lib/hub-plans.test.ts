import { test } from "node:test";
import assert from "node:assert/strict";
import { companyPlan, duration, topicPlan, type CompanyPlanProblem, type PlanProblem } from "./hub-plans.js";

/*
 * The hub study plans (2026-10-01): a topic's climbs easy → hard over
 * hour-long days that open with the sheet, a company's shares its places
 * among the techniques its problems use and takes them in learning order.
 */

const p = (slug: string, difficulty: string, topics: string[] = []): PlanProblem => ({ slug, title: slug.toUpperCase(), difficulty, topics });

test("a topic plan climbs easy to hard, caps each level and opens with the essentials", () => {
  const problems = [
    ...Array.from({ length: 6 }, (_, i) => p(`e${i}`, "EASY")),
    ...Array.from({ length: 10 }, (_, i) => p(`m${i}`, "MEDIUM")),
    ...Array.from({ length: 5 }, (_, i) => p(`h${i}`, "HARD")),
  ];
  // Priority order is the caller's: a hard one listed first still comes last.
  const plan = topicPlan({ label: "Sliding Window", problems: [problems[20], ...problems.slice(0, 20)], next: { label: "Prefix Sum", href: "/challenges/prefix-sum" } });
  const order = plan.stages.flatMap((s) => s.problems.map((x) => x.difficulty));
  assert.deepEqual([...new Set(order)], ["EASY", "MEDIUM", "HARD"]);
  assert.equal(order.filter((d) => d === "EASY").length, 4);
  assert.equal(order.filter((d) => d === "MEDIUM").length, 7);
  assert.equal(order.filter((d) => d === "HARD").length, 3);
  assert.equal(plan.stages[0].problems[0].slug, "e0");
  assert.equal(plan.stages[2].problems.length > 0, true);
  // The hard one the caller ranked first is the first hard one picked.
  assert.equal(plan.stages.flatMap((s) => s.problems).find((x) => x.difficulty === "HARD")?.slug, "h4");
  assert.match(plan.stages[0].note, /^Learn the pattern/);
  for (const s of plan.stages) assert.ok(s.minutes <= 90, `${s.title} runs ${s.minutes} min`);
  assert.equal(plan.picked, 14);
  assert.equal(plan.rest, 7);
  assert.match(plan.summary, /^14 of the 21 Sliding Window problems \(4 easy, 7 medium and 3 hard\) over \d+ days/);
  assert.match(plan.summary, /Then move on to Prefix Sum\.$/);
  assert.deepEqual(plan.stages[plan.stages.length - 1].link, { href: "/challenges/prefix-sum", label: "Next topic: Prefix Sum" });
});

test("a one-problem topic gets a one-day plan that says so", () => {
  const plan = topicPlan({ label: "Digit DP", problems: [p("count-digits", "HARD")] });
  assert.equal(plan.stages.length, 1);
  assert.equal(plan.rest, 0);
  assert.match(plan.summary, /^The one Digit DP problem \(1 hard\) over 1 day, about 1 h 5 min in all/);
  assert.match(plan.stages[0].note, /solve this problem\.$/);
});

const cp = (slug: string, difficulty: string, topic: [string, number] | null): CompanyPlanProblem => ({
  ...p(slug, difficulty),
  primary: topic ? { slug: topic[0], label: topic[0].toUpperCase(), rank: topic[1] } : null,
});

test("a company plan shares its places by topic, in learning order, easiest first within a topic", () => {
  const problems: CompanyPlanProblem[] = [
    ...Array.from({ length: 30 }, (_, i) => cp(`dp${i}`, i % 3 === 0 ? "HARD" : "MEDIUM", ["dp", 40])),
    ...Array.from({ length: 50 }, (_, i) => cp(`arr${i}`, i % 2 ? "EASY" : "MEDIUM", ["arrays", 0])),
    ...Array.from({ length: 20 }, (_, i) => cp(`sw${i}`, "MEDIUM", ["sliding", 6])),
    cp("odd", "EASY", null),
  ];
  const plan = companyPlan({ label: "Amazon", problems, patterns: [{ slug: "amazon-oa", name: "Amazon OA" }] });
  assert.equal(plan.picked, 40);
  assert.equal(plan.rest, problems.length - 40);
  const slugs = plan.stages.flatMap((s) => s.problems.map((x) => x.slug));
  // Learning order: arrays, then sliding window, then DP.
  const firstOf = (prefix: string) => slugs.findIndex((s) => s.startsWith(prefix));
  assert.ok(firstOf("arr") < firstOf("sw") && firstOf("sw") < firstOf("dp"));
  // Shares follow size: arrays (50) gets the most places.
  const count = (prefix: string) => slugs.filter((s) => s.startsWith(prefix)).length;
  assert.ok(count("arr") > count("dp") && count("dp") > count("sw"));
  // Easiest first within a topic.
  const arr = plan.stages.flatMap((s) => s.problems).filter((x) => x.slug.startsWith("arr"));
  assert.equal(arr.findIndex((x) => x.difficulty === "MEDIUM") > arr.map((x) => x.difficulty).lastIndexOf("EASY"), true);
  assert.match(plan.stages[0].title, /^Week 1: ARRAYS/);
  const last = plan.stages[plan.stages.length - 1];
  assert.deepEqual(last.link, { href: "/tests/amazon-oa", label: "Take the Amazon OA mock" });
  assert.equal(last.problems.length, 0);
  assert.match(plan.summary, /^40 of the 101 problems tagged Amazon over \d weeks, about/);
  assert.match(plan.summary, /It ends with the Amazon OA mock\.$/);
});

test("a small company's plan is one stage holding the whole list", () => {
  const plan = companyPlan({ label: "Zomato", problems: [cp("a", "EASY", ["arrays", 0]), cp("b", "MEDIUM", ["heap", 25]), cp("c", "MEDIUM", ["arrays", 0])] });
  assert.equal(plan.stages.length, 1);
  assert.equal(plan.stages[0].title, "The plan");
  assert.deepEqual(plan.stages[0].problems.map((x) => x.slug), ["a", "c", "b"]);
  assert.match(plan.summary, /^All 3 problems tagged Zomato, about 1 h 30 min of solving/);
});

test("durations read as a person would say them", () => {
  assert.equal(duration(45), "45 min");
  assert.equal(duration(60), "1 h");
  assert.equal(duration(95), "1 h 35 min");
  assert.equal(duration(452), "7 h 30 min");
});
