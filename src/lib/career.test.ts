import { test } from "node:test";
import assert from "node:assert/strict";
import { careerOf, SHOWN_CONFIDENCE, type CareerFacts } from "./career.js";

const facts: CareerFacts = {
  solved: { problems: 42, bugs: 1, sql: 0 },
  credentials: [{ code: "CK-7H3K-9QXM", name: "Java · Basic", level: "basic", band: "distinction", issuedAt: new Date("2026-10-01T00:00:00Z") }],
  placementTests: [{ slug: "tcs-nqt-foundation", name: "TCS NQT Foundation", company: "TCS", percent: 71.6, at: new Date("2026-10-05T00:00:00Z") }],
  studyTracks: [{ key: "java", title: "Java", completedAt: new Date("2026-09-30T00:00:00Z") }],
  roadmapTiers: 2,
  github: { login: "ayaan" },
  self: { institute: "VIT", location: "Pune", website: null, linkedin: "linkedin.com/in/ayaan", github: "github.com/ayaan" },
  skills: {
    domains: [
      { key: "dsa", label: "DSA", mastery: 47.4, confidence: 0.62, started: 12, total: 55 },
      { key: "sql", label: "SQL", mastery: 10, confidence: 0.1, started: 1, total: 8 },
      { key: "cs", label: "CS fundamentals", mastery: 0, confidence: 0, started: 0, total: 4 },
    ],
    strongest: [{ key: "dsa:arrays", label: "Arrays", mastery: 81, confidence: 0.7 }],
  },
  readiness: { company: "TCS", score: 58.2, confidence: 0.55, status: "close" },
};

test("verified items: credentials, proctored bests, judged solves, completions, a signed-in GitHub", () => {
  const c = careerOf(facts, { skills: false, readiness: false });
  assert.ok(c.verified.every((i) => i.proof === "verified"));
  assert.deepEqual(c.verified.map((i) => i.label), ["Java · Basic credential", "TCS NQT Foundation", "Solved on CodeKairo", "Java study plan completed", "DSA roadmap", "GitHub account"]);
  assert.equal(c.verified[0]!.href, "/verify/CK-7H3K-9QXM");
  assert.equal(c.verified[0]!.detail, "Passed with distinction");
  assert.equal(c.verified[1]!.detail, "Best score 72% in a proctored sitting");
  assert.equal(c.verified[2]!.detail, "42 coding problems, 1 bug hunt, each accepted by the judge's hidden tests");
});

test("self-reported items are labelled so, and a typed GitHub link matching the linked account is not repeated", () => {
  const c = careerOf(facts, { skills: false, readiness: false });
  assert.deepEqual(c.selfReported.map((i) => [i.proof, i.label]), [["self-reported", "Institute"], ["self-reported", "Location"], ["self-reported", "LinkedIn"]]);
  const other = careerOf({ ...facts, self: { ...facts.self, github: "github.com/someone-else" } }, { skills: false, readiness: false });
  assert.ok(other.selfReported.some((i) => i.label === "GitHub (typed)"));
});

test("estimates leave only when their owner shows them — no key at all otherwise", () => {
  const hidden = careerOf(facts, { skills: false, readiness: false });
  assert.ok(!("assessed" in hidden));
  const text = JSON.stringify(hidden);
  for (const leak of ["47", "58", "Arrays", "close"]) assert.ok(!text.includes(leak), `leaked ${leak}`);

  const skillsOnly = careerOf(facts, { skills: true, readiness: false });
  assert.ok(skillsOnly.assessed?.skills && !("readiness" in skillsOnly.assessed));
  // Thinly measured or unstarted domains are not shown to anyone.
  assert.deepEqual(skillsOnly.assessed!.skills!.domains, [{ key: "dsa", label: "DSA", mastery: 47, confidence: 0.62 }]);
  assert.ok(0.1 < SHOWN_CONFIDENCE);
  assert.deepEqual(skillsOnly.assessed!.skills!.strongest, [{ key: "dsa:arrays", label: "Arrays", mastery: 81 }]);

  const readinessOnly = careerOf(facts, { skills: false, readiness: true });
  assert.deepEqual(readinessOnly.assessed!.readiness, { company: "TCS", score: 58, confidence: 0.55, status: "close" });
  assert.ok(!("skills" in readinessOnly.assessed!));
});

test("a readiness the site cannot estimate yet is not shown, even switched on", () => {
  const unknown = careerOf({ ...facts, readiness: { company: "TCS", score: 0, confidence: 0, status: "unknown" } }, { skills: false, readiness: true });
  assert.ok(!("assessed" in unknown));
});

test("a switch on with nothing to show adds nothing", () => {
  const empty = careerOf({ ...facts, skills: { domains: [], strongest: [] }, readiness: null }, { skills: true, readiness: true });
  assert.ok(!("assessed" in empty));
  const none = careerOf({ ...facts, credentials: [], placementTests: [], studyTracks: [], roadmapTiers: 0, github: null, solved: { problems: 0, bugs: 0, sql: 0 } }, { skills: false, readiness: false });
  assert.deepEqual(none.verified, []);
});
