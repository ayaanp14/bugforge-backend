import { test } from "node:test";
import assert from "node:assert/strict";
import { companyKey } from "../readiness.js";
import { SIMULATIONS, interviewSkillWeights, simulationForCompany, simulationProblems } from "./index.js";

/**
 * Every shipped simulation held to its rules: its seeded pattern first, at
 * least one interview round, focus ids and builder rounds the interview
 * builder knows, and a source note and sources on each — and every company
 * with a seeded pattern has one.
 *
 * Run with: npm test
 */

// The seeded patterns live under scripts/ (outside rootDir), so they are read the way skill-graph.test.ts reads the catalogue.
const { MOCK_TESTS } = (await import(new URL("../../../scripts/mock-test-data/index.ts", import.meta.url).href)) as {
  MOCK_TESTS: Array<{ slug: string; company: string; family: string }>;
};
const patterns = new Map(MOCK_TESTS.map((t) => [t.slug, t.company]));

test("every shipped simulation keeps the rules", () => {
  assert.deepEqual(simulationProblems(SIMULATIONS, patterns), []);
});

test("every company with a seeded pattern has a simulation", () => {
  const companies = new Set(MOCK_TESTS.filter((t) => t.family !== "generic").map((t) => t.company));
  for (const c of companies) assert.ok(simulationForCompany(c), `${c} has no simulation`);
  assert.equal(SIMULATIONS.length, companies.size, "one simulation per company");
});

test("a simulation's family is its pattern's", () => {
  for (const s of SIMULATIONS) {
    const t = MOCK_TESTS.find((m) => m.slug === s.rounds[0]!.test)!;
    assert.equal(s.family, t.family, s.slug);
  }
});

test("the checks catch what they are for", () => {
  const good = SIMULATIONS[0]!;
  const broken = [
    { ...good, slug: "x", rounds: [{ ...good.rounds[1]! }, ...good.rounds.slice(1)] },
    { ...good, slug: "y", rounds: [{ ...good.rounds[0]!, test: "nope" }, ...good.rounds.slice(1)] },
    { ...good, slug: "z", sources: [{ label: "x", url: "http://insecure" }] },
  ];
  const problems = simulationProblems(broken, patterns);
  assert.ok(problems.some((p) => p.startsWith("simulation x: the first round must be")));
  assert.ok(problems.some((p) => p.includes('names test "nope"')));
  assert.ok(problems.some((p) => p.startsWith("simulation z: every source")));
});

test("a simulation's rounds weight the interview skills readiness reads", () => {
  const amazon = SIMULATIONS.find((s) => s.slug === "amazon")!;
  assert.deepEqual(interviewSkillWeights(amazon), [
    { key: "int:coding", weight: 2 },
    { key: "int:behavioural", weight: 1 },
  ]);
  const zs = SIMULATIONS.find((s) => s.slug === "zs-associates")!;
  assert.ok(!interviewSkillWeights(zs).some((w) => w.key === "int:case"), "a case study is no interview skill");
  // HCLTech's pattern is spelled "HCLTech", the tag "HCL".
  assert.equal(simulationForCompany("HCL")?.slug, "hcltech");
  assert.equal(companyKey(simulationForCompany("Facebook")?.company ?? ""), companyKey("Meta"));
});
