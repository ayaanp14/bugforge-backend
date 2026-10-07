import { test } from "node:test";
import assert from "node:assert/strict";
import { AREA_WEIGHTS, companyKey, readinessOf, statusOf, type ReadinessInput, type SkillReading } from "./readiness.js";

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 7, 12);

const reading = (label: string, mastery: number, confidence = 0.8): SkillReading => ({ mastery, confidence, label, href: `/skills?skill=${label}` });

const SKILLS: Record<string, SkillReading> = {
  "apt:quantitative": reading("Quantitative", 80),
  "apt:logical": reading("Logical", 40),
  "apt:verbal": reading("Verbal", 60),
  "dsa:arrays": reading("Arrays", 70),
  "dsa:hash-table": reading("Hash Table", 30),
  "cs:os": reading("Operating systems", 50, 0.5),
  "cs:networks": reading("Computer networks", 0, 0),
};

const base = (over: Partial<ReadinessInput> = {}): ReadinessInput => ({
  company: "TCS",
  family: "service",
  patterns: [
    {
      slug: "tcs-nqt",
      name: "TCS NQT",
      sourceNote: "From prep portals.",
      sections: [
        // 20 marks of numerical, 10 of reasoning (topics map to "logical").
        { key: "num", name: "Numerical", kind: "mcq", questionCount: 20, marksPerQuestion: 1, blueprint: [{ category: "quantitative", count: 20 }] },
        { key: "rea", name: "Reasoning", kind: "mcq", questionCount: 10, marksPerQuestion: 1, blueprint: [{ topics: ["number-series", "syllogisms"], count: 10 }] },
      ],
    },
  ],
  skill: (k) => SKILLS[k] ?? null,
  categoryOfTopic: (t) => (t === "number-series" || t === "syllogisms" ? "logical" : null),
  skillsForTags: (tags) => tags.map((t) => `dsa:${t.toLowerCase().replace(/ /g, "-")}`),
  codingSkills: [
    { key: "dsa:arrays", problems: 30 },
    { key: "dsa:hash-table", problems: 10 },
  ],
  companyHref: "/challenges/company/tcs",
  sittings: [],
  interviews: [],
  resume: null,
  targetDate: null,
  dailyMinutes: null,
  asOf: NOW,
  ...over,
});

const area = (r: ReturnType<typeof readinessOf>, key: string) => r.areas.find((a) => a.key === key)!;

test("each pattern section is read against the skills it draws from, weighted by its marks", () => {
  const r = readinessOf(base());
  // (20 × 80 + 10 × 40) / 30 = 66.7
  assert.equal(area(r, "assessment").score, 67);
  assert.deepEqual(area(r, "assessment").parts.map((p) => p.label), ["TCS NQT"]);
  // The weakest skill by marks at stake is the reasoning one; and the pattern has not been sat.
  assert.deepEqual(area(r, "assessment").next, [
    { label: "Sit the TCS NQT mock", href: "/tests/tcs-nqt" },
    { label: "Practise Logical", href: "/skills?skill=Logical" },
  ]);
});

test("a recent sitting of the pattern counts half, and old sittings do not count", () => {
  const recent = readinessOf(base({ sittings: [{ slug: "tcs-nqt", pct: 90, at: NOW - 5 * DAY }] }));
  assert.equal(area(recent, "assessment").score, Math.round((66.667 + 90) / 2));
  assert.ok(area(recent, "assessment").confidence >= 0.8);
  const stale = readinessOf(base({ sittings: [{ slug: "tcs-nqt", pct: 90, at: NOW - 200 * DAY }] }));
  assert.equal(area(stale, "assessment").score, 67);
});

test("coding reads the company's own topics, weighted by how many of its problems use each", () => {
  const r = readinessOf(base());
  // (30 × 70 + 10 × 30) / 40 = 60
  assert.equal(area(r, "coding").score, 60);
  assert.equal(area(r, "coding").next[0]!.label, "Practise Hash Table");
  assert.equal(area(r, "coding").next[1]!.href, "/challenges/company/tcs");
});

test("weights follow the company's family, and a company with no pattern shares the assessment's weight out", () => {
  for (const family of ["service", "product"] as const) {
    const total = Object.values(AREA_WEIGHTS[family]).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `${family} weights sum to 1`);
  }
  const none = readinessOf(base({ patterns: [], family: "product" }));
  assert.equal(none.areas.some((a) => a.key === "assessment"), false);
  assert.ok(Math.abs(none.areas.reduce((a, x) => a + x.weight, 0) - 1) < 1e-9);
  assert.ok(area(none, "coding").weight > AREA_WEIGHTS.product.coding);
});

test("no evidence is a known zero with no confidence, never a guess", () => {
  const r = readinessOf(base());
  assert.equal(area(r, "interview").score, 0);
  assert.equal(area(r, "interview").status, "unknown");
  assert.equal(area(r, "resume").status, "unknown");
  assert.equal(statusOf(90, 0.1), "unknown");
  assert.equal(statusOf(80, 0.5), "ready");
  assert.equal(statusOf(60, 0.5), "close");
  assert.equal(statusOf(20, 0.5), "not-yet");
});

test("interviews: the last three in four months; the resume counts more when aimed at this company", () => {
  const r = readinessOf(
    base({
      interviews: [
        { score: 70, at: NOW - DAY },
        { score: 50, at: NOW - 10 * DAY },
        { score: 90, at: NOW - 20 * DAY },
        { score: 10, at: NOW - 30 * DAY },
        { score: 99, at: NOW - 400 * DAY },
      ],
      resume: { score: 72, at: NOW - 3 * DAY, forCompany: true },
    }),
  );
  assert.equal(area(r, "interview").score, 70);
  assert.equal(area(r, "interview").confidence, 1);
  assert.equal(area(r, "resume").score, 72);
  assert.equal(area(r, "resume").confidence, 1);
  const other = readinessOf(base({ resume: { score: 72, at: NOW - 3 * DAY, forCompany: false } }));
  assert.equal(area(other, "resume").confidence, 0.7);
});

test("focus names what would move the estimate most — weight times room left — one action an area", () => {
  const r = readinessOf(base());
  assert.equal(r.focus.length, 3);
  // Never interviewed (0.15 × 100 = 15) just leads the assessment (0.45 × 33 ≈ 14.9), then CS fundamentals (0.15 × 75).
  assert.deepEqual(
    r.focus.map((f) => f.href),
    ["/mock-interview", "/tests/tcs-nqt", "/skills?skill=Computer networks"],
  );
  assert.equal(new Set(r.focus.map((f) => f.href)).size, 3);
});

test("a target date gives the days left and, with a daily budget, the hours", () => {
  const r = readinessOf(base({ targetDate: NOW + 10 * DAY, dailyMinutes: 60 }));
  assert.deepEqual(r.target, { date: "2026-10-17", daysLeft: 10, hoursLeft: 10 });
  assert.equal(readinessOf(base({ targetDate: NOW - 5 * DAY })).target, null, "a date long past is no target");
});

test("company names match loosely across the patterns and the tags", () => {
  assert.equal(companyKey("HCLTech"), companyKey("HCL"));
  assert.equal(companyKey("Tech Mahindra"), "techmahindra");
  assert.equal(companyKey("Facebook"), companyKey("Meta"));
});
