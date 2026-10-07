import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVIEW_SKILLS, ROUND_SKILL, interviewLevel, interviewSkillOf } from "./interview-skills.js";

/**
 * Which interview skill a question evidences. The cases are real rows'
 * values from the local database (2026-10-07): the model's free-text topic,
 * focus area and expected skills, in the round they were asked in.
 *
 * Run with: npm test
 */

const q = (roundId: string, topic: string | null, focusArea: string | null = null, expectedSkills: string[] = []) => ({ roundId, topic, focusArea, expectedSkills });

test("the round decides when the question's words say nothing more", () => {
  assert.equal(interviewSkillOf(q("hr-round", "career goals")), "int:behavioural");
  assert.equal(interviewSkillOf(q("coding-interview", null)), "int:coding");
  assert.equal(interviewSkillOf(q("core-cs-fundamentals", "Process scheduling", "operating systems")), "int:technical");
  assert.equal(interviewSkillOf(q("system-design-interview", "pagination", "RESTful endpoints")), "int:design");
});

test("the question's own words override the round when they plainly say what it was", () => {
  // A technical round opening with the behavioural question.
  assert.equal(interviewSkillOf(q("technical-interview", "intro-behavioural", "communication and motivation", ["communication"])), "int:behavioural");
  assert.equal(interviewSkillOf(q("backend-round", "caching", "cache coherence", ["cache invalidation"])), "int:design");
  assert.equal(interviewSkillOf(q("technical-interview", "algorithms-array-search", "binary-search-fundamentals", ["complexity analysis"])), "int:coding");
  assert.equal(interviewSkillOf(q("debugging-interview", "race-condition", "concurrency", ["root cause analysis"])), "int:technical");
  // Ownership of an incident is a behavioural question about a technical event.
  assert.equal(interviewSkillOf(q("backend-round", "operational-incident-response", "ownership and end-to-end delivery")), "int:behavioural");
});

test("a tech stack is not a coding question", () => {
  assert.equal(interviewSkillOf(q("technical-interview", "full stack", "tech stack choices")), "int:technical");
});

test("rounds that are no interview skill give none; a round typed by hand is technical", () => {
  assert.equal(interviewSkillOf(q("aptitude-reasoning", "percentages")), null);
  assert.equal(interviewSkillOf(q("case-study", "market sizing")), null);
  assert.equal(interviewSkillOf(q("bar raiser with a VP", "past project")), "int:technical");
});

test("every built-in round maps to one of the four skills or deliberately to none", () => {
  for (const [round, skill] of Object.entries(ROUND_SKILL)) assert.ok(skill === null || (INTERVIEW_SKILLS as readonly string[]).includes(skill), round);
});

test("the interview's difficulty is the scorer's level", () => {
  assert.equal(interviewLevel("beginner"), "basic");
  assert.equal(interviewLevel("intermediate"), "intermediate");
  assert.equal(interviewLevel("advanced"), "advanced");
  assert.equal(interviewLevel(null), "basic");
});

test("each interview skill is a node of the graph's interview domain", async () => {
  const { skillNode } = await import("./skill-graph.js");
  for (const key of INTERVIEW_SKILLS) assert.equal(skillNode(key)?.domain, "interview", key);
});

test("a question's 0–10 score is a percentage for the scorer", async () => {
  const { answerPercent, ANSWER_PASS_SCORE } = await import("./interview-skills.js");
  assert.equal(answerPercent(8), 80);
  assert.equal(answerPercent(12), 100);
  assert.equal(ANSWER_PASS_SCORE, 6, "the interviewer's adequate");
});
