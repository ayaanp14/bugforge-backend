import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalCompany, experienceBody, experienceDescription, experienceTitle, parseExperience, readableExperienceMeta, tidyName, tidyRoundName } from "./interview-experience.js";
import { slugify } from "./slug.js";

const round = (name: string, detail: string) => ({ name, detail });
const long = "Two coding questions on arrays and a discussion of my project; the interviewer asked about time complexity and edge cases. ".repeat(2);
const base = {
  company: "morgan stanley",
  role: "Software Engineer",
  year: 2026,
  channel: "on-campus",
  outcome: "selected",
  difficulty: "medium",
  rounds: [round("Online assessment", long), round("Technical interview", "Asked about OS scheduling and a linked list question.")],
  problems: ["two-sum", "two-sum", "Bad Slug!", "merge-intervals"],
};

test("a complete experience parses, the company takes the catalogue's spelling and its page", () => {
  const r = parseExperience(base, "", 2026);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.company, "Morgan Stanley");
  assert.equal(r.value.companyTag, "Morgan Stanley");
  assert.equal(r.value.companySlug, "morgan-stanley");
  assert.equal(r.value.rounds.length, 2);
  // Deduplicated, malformed slugs dropped (the route checks the rest against the catalogue).
  assert.deepEqual(r.value.problems, ["two-sum", "merge-intervals"]);
});

test("a company the catalogue does not tag is kept as typed, with no page", () => {
  const r = parseExperience({ ...base, company: "  Deloitte   USI " }, "", 2026);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.company, "Deloitte USI");
  assert.equal(r.value.companyTag, null);
  assert.equal(r.value.companySlug, null);
});

test("aliases and renamed companies resolve", () => {
  assert.equal(canonicalCompany("Facebook"), "Meta");
  assert.equal(canonicalCompany("Tata Consultancy Services"), "TCS");
  assert.equal(canonicalCompany("hcltech"), "HCL");
  assert.equal(canonicalCompany("unknown co"), null);
});

test("missing parts are refused with a sentence", () => {
  const cases: Array<[Record<string, unknown>, RegExp]> = [
    [{ ...base, company: "" }, /company/],
    [{ ...base, role: "" }, /role/],
    [{ ...base, year: 2009 }, /year/],
    [{ ...base, year: 2028 }, /year/],
    [{ ...base, outcome: "great" }, /how it ended/],
    [{ ...base, difficulty: "brutal" }, /difficulty/],
    [{ ...base, rounds: [] }, /at least one round/],
    [{ ...base, rounds: [round("OA", "")] }, /line or two/],
    [{ ...base, rounds: [round("OA", "Two questions.")] }, /at least 200/],
  ];
  for (const [raw, error] of cases) {
    const r = parseExperience(raw, "", 2026);
    assert.equal(r.ok, false, JSON.stringify(raw).slice(0, 80));
    if (!r.ok) assert.match(r.error, error);
  }
  assert.equal(parseExperience(null, "", 2026).ok, false);
});

test("the closing notes count towards the length", () => {
  const short = { ...base, rounds: [round("OA", "Two questions.")] };
  assert.equal(parseExperience(short, "x".repeat(200), 2026).ok, true);
});

test("an unknown channel falls back to other; rounds are capped at eight", () => {
  const many = Array.from({ length: 12 }, (_, i) => round(`R${i + 1}`, long));
  const r = parseExperience({ ...base, channel: "carrier pigeon", rounds: many }, "", 2026);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.value.channel, "other");
  assert.equal(r.value.rounds.length, 8);
});

test("the title names role, company, year and channel", () => {
  assert.equal(experienceTitle({ role: "SDE Intern", company: "Amazon", year: 2025, channel: "off-campus" }), "SDE Intern at Amazon (2025, off campus)");
  assert.equal(experienceTitle({ role: "Analyst", company: "Zoho", year: 2024, channel: "other" }), "Analyst at Zoho (2024)");
});

test("an all-lower-case name reads tidied; a name written with capitals is left alone", () => {
  assert.equal(tidyName("intercontinental exchange"), "Intercontinental Exchange");
  assert.equal(tidyName("full stack software engineer"), "Full Stack Software Engineer");
  assert.equal(tidyName("sde-1 at ibm"), "SDE-1 at IBM");
  assert.equal(tidyName("sde2"), "SDE2");
  assert.equal(tidyName("e4"), "E4");
  assert.equal(tidyName(".net developer"), ".NET Developer");
  assert.equal(tidyName("bank of america"), "Bank of America");
  assert.equal(tidyName("the trade desk"), "The Trade Desk");
  assert.equal(tidyName("eBay"), "eBay");
  assert.equal(tidyName("SDE Intern"), "SDE Intern");
  assert.equal(tidyName("NVIDIA"), "NVIDIA");
  assert.equal(tidyName("3m"), "3m");
  assert.equal(tidyRoundName("onsite with panel"), "Onsite with panel");
  assert.equal(tidyRoundName("HR round"), "HR round");
});

test("tidying a name never moves a post's address", () => {
  for (const [company, role] of [["intercontinental exchange", "full stack software engineer"], ["ibm", "sde-1 (.net)"], ["bank of america", "e4"]] as const) {
    assert.equal(slugify(tidyName(company), 30), slugify(company, 30));
    assert.equal(slugify(`${tidyName(role)} 2025`, 60), slugify(`${role} 2025`, 60));
  }
});

test("the payload's meta reads tidied and anything else passes through", () => {
  const meta = { topic: "x", experience: { company: "acme corp", role: "qa engineer", year: 2025, rounds: [{ name: "online test", detail: "keep my words" }] } };
  assert.deepEqual(readableExperienceMeta(meta), { topic: "x", experience: { company: "Acme Corp", role: "QA Engineer", year: 2025, rounds: [{ name: "Online test", detail: "keep my words" }] } });
  assert.equal(meta.experience.company, "acme corp");
  const other = { kind: "problem" };
  assert.equal(readableExperienceMeta(other), other);
  assert.equal(readableExperienceMeta(null), null);
});

test("the description opens on the company and the role; the body is every round then the notes", () => {
  const e = { company: "Amazon", role: "SDE Intern", rounds: [{ name: "OA", detail: "Two questions." }, { name: "Technical", detail: "LRU cache." }] };
  assert.equal(experienceDescription(e, "Selected", "Two questions."), "Amazon SDE Intern interview: 2 rounds (OA, Technical). Selected. Two questions.");
  assert.equal(experienceBody(e, "Practise arrays."), "Round 1: OA\nTwo questions.\n\nRound 2: Technical\nLRU cache.\n\nPractise arrays.");
  assert.equal(experienceBody(e, ""), "Round 1: OA\nTwo questions.\n\nRound 2: Technical\nLRU cache.");
});
