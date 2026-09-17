import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { LayoutSignals } from "./resume-extract.js";
import { emptyContent, parseResumeText } from "./resume-parse.js";
import { requirementsFor } from "./resume-requirements.js";
import { ATS_SCORING_WEIGHTS, atsIssues, bulletFindings, compareAnalyses, scoreResume, stem, type AiJudgement } from "./resume-scoring.js";
import { SAMPLE } from "./resume-parse.test.js";

/**
 * The scoring engine: the weights, each category's rule, the listed-versus-
 * demonstrated distinction, the ATS checks, and what the model may and may
 * not move.
 *
 * Run with: npm test
 */

const JD = `Backend Engineer\n\nResponsibilities\n- Build REST APIs and microservices in Java and Spring Boot\n- Work with Kafka and DynamoDB\n\nRequirements\n- 3+ years of backend experience\n- Strong Java, data structures and algorithms\n- Experience with AWS\n- Bachelor's degree in Computer Science\n\nPreferred\n- Kubernetes and Docker`;

const NOW = new Date("2026-09-17");
const { content, unmappedHeadings } = parseResumeText(SAMPLE);
const req = requirementsFor("Backend Engineer", "Amazon", JD);
const result = scoreResume({ content, requirements: req, layout: null, unmappedHeadings, ai: null, now: NOW });

const cleanLayout: LayoutSignals = { format: "pdf", pages: 1, multiColumn: false, tables: 0, textBoxes: 0, images: 0, headerContact: false, repeatedHeaderFooter: false, chars: 1500, decorativeSymbols: 0, headingHints: [] };

describe("ATS_SCORING_WEIGHTS", () => {
  it("sums to 100 and every category's maxScore is its weight", () => {
    assert.equal(Object.values(ATS_SCORING_WEIGHTS).reduce((n, w) => n + w, 0), 100);
    for (const [key, cat] of Object.entries(result.scoreBreakdown)) assert.equal(cat.maxScore, ATS_SCORING_WEIGHTS[key as keyof typeof ATS_SCORING_WEIGHTS]);
  });
  it("the overall score is the sum of the categories, and bounded", () => {
    const sum = Object.values(result.scoreBreakdown).reduce((n, c) => n + c.score, 0);
    assert.equal(result.overallScore, sum);
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    for (const c of Object.values(result.scoreBreakdown)) assert.ok(c.score >= 0 && c.score <= c.maxScore, c.category);
  });
});

describe("skills and keywords", () => {
  it("separates demonstrated, listed-only and missing skills", () => {
    const names = (list: Array<{ name: string }>) => list.map((s) => s.name);
    assert.ok(names(result.matchedSkills).includes("Spring Boot"), "Spring Boot demonstrated in a bullet");
    assert.ok(names(result.matchedSkills).includes("Kubernetes"));
    assert.ok(names(result.listedSkills).includes("AWS"), "AWS only in the skills list");
    assert.ok(names(result.missingSkills).includes("Kafka"));
    assert.ok(names(result.missingSkills).includes("Data Structures"));
  });
  it("carries evidence for a demonstrated skill", () => {
    const sb = result.matchedSkills.find((s) => s.name === "Spring Boot")!;
    assert.match(sb.evidence ?? "", /Spring Boot/);
    assert.ok(sb.where.includes("experience"));
  });
  it("explains every category with a reason", () => {
    for (const c of Object.values(result.scoreBreakdown)) assert.ok(c.reason.length > 10, c.category);
    assert.match(result.scoreBreakdown.skillsMatch.reason, /required skills present/);
  });
  it("scores a resume higher once a missing required skill is demonstrated", () => {
    const better = structuredClone(content);
    better.experience[0].bullets.push("Streamed order events through Kafka to downstream services");
    const again = scoreResume({ content: better, requirements: req, layout: null, ai: null, now: NOW });
    assert.ok(again.scoreBreakdown.skillsMatch.score > result.scoreBreakdown.skillsMatch.score);
    assert.ok(again.scoreBreakdown.keywordMatch.score >= result.scoreBreakdown.keywordMatch.score);
    assert.ok(again.overallScore > result.overallScore);
  });
  it("gives a listed skill less credit than a demonstrated one", () => {
    const listed = structuredClone(content);
    listed.skills[0].items.push("Kafka");
    const demonstrated = structuredClone(content);
    demonstrated.experience[0].bullets.push("Streamed order events through Kafka to downstream services");
    const a = scoreResume({ content: listed, requirements: req, layout: null, ai: null, now: NOW }).scoreBreakdown.skillsMatch.score;
    const b = scoreResume({ content: demonstrated, requirements: req, layout: null, ai: null, now: NOW }).scoreBreakdown.skillsMatch.score;
    assert.ok(b >= a);
    assert.equal(scoreResume({ content: listed, requirements: req, layout: null, ai: null, now: NOW }).listedSkills.some((s) => s.name === "Kafka"), true);
  });
  it("matches a keyword partially through a stem", () => {
    assert.equal(stem("deployments"), "deploy");
    assert.equal(stem("optimization"), "optim");
    assert.equal(stem("optimized"), "optim");
    const r = requirementsFor("", "", "Requirements\n- Experience with Cloud Deployments and Payment Reconciliation across many teams for years and years and years.");
    r.keywords.push({ term: "cloud deployment", weight: 1, required: true });
    const c = structuredClone(content);
    c.experience[0].bullets.push("Handled cloud deployments for the team");
    const scored = scoreResume({ content: c, requirements: r, layout: null, ai: null, now: NOW });
    assert.ok(scored.matchedKeywords.some((k) => k.term === "cloud deployment") || scored.partialKeywords.some((k) => k.term === "cloud deployment"));
  });
  it("is deterministic", () => {
    const twice = scoreResume({ content, requirements: req, layout: null, unmappedHeadings, ai: null, now: NOW });
    assert.deepEqual(twice, result);
  });
});

describe("bullets and achievements", () => {
  it("flags weak openings and missing metrics", () => {
    const findings = bulletFindings(content);
    const weak = findings.filter((f) => f.weakOpening);
    assert.deepEqual(weak.map((f) => f.weakOpening), ["Worked on", "Helped with", "Responsible for"]);
    assert.equal(findings.find((f) => /2M requests/.test(f.text))!.hasMetric, true);
    assert.equal(findings.find((f) => /Built REST/.test(f.text))!.strongVerb, true);
    assert.equal(findings.find((f) => /Real-time chat/.test(f.text))!.hasMetric, false);
  });
  it("scores achievements from metrics and verbs", () => {
    const a = result.scoreBreakdown.achievements;
    assert.ok(a.score >= 3 && a.score <= 5);
    assert.match(a.reason, /bullets carry a measurable outcome/);
  });
});

describe("structure, education and ATS", () => {
  it("gives full structure marks to a complete resume and finds what is missing otherwise", () => {
    assert.equal(result.scoreBreakdown.structure.score, 10);
    const thin = emptyContent();
    thin.basics.name = "X";
    const s = scoreResume({ content: thin, requirements: req, layout: null, ai: null, now: NOW }).scoreBreakdown.structure;
    assert.ok(s.score <= 2);
    assert.ok(s.missing!.includes("experience"));
  });
  it("checks the degree level against the requirement", () => {
    assert.equal(result.scoreBreakdown.education.score, 5);
    const masters = requirementsFor("", "", "Requirements\n- Master's degree in Computer Science required\n- Python and SQL experience over many years in a fast-paced environment.");
    const e = scoreResume({ content, requirements: masters, layout: null, ai: null, now: NOW }).scoreBreakdown.education;
    assert.ok(e.score < 5);
    assert.ok(e.missing!.some((m) => /master's/.test(m)));
  });
  it("reports layout risks as issues, with severities, and deducts for them", () => {
    const risky: LayoutSignals = { ...cleanLayout, multiColumn: true, tables: 1, headerContact: true, images: 1, pages: 3 };
    const issues = atsIssues(content, risky, []);
    const ids = issues.map((i) => i.id);
    for (const id of ["multi-column", "tables", "header-contact", "images", "length", "dates"]) assert.ok(ids.includes(id), id);
    assert.equal(issues.find((i) => i.id === "multi-column")!.severity, "high");
    const scored = scoreResume({ content, requirements: req, layout: risky, ai: null, now: NOW });
    assert.ok(scored.scoreBreakdown.atsCompatibility.score < result.scoreBreakdown.atsCompatibility.score);
    assert.ok(scored.scoreBreakdown.atsCompatibility.score >= 0);
  });
  it("flags missing contact details and unusual section titles from the content itself", () => {
    const c = structuredClone(content);
    c.basics.email = "";
    c.customSections.push({ id: "z", title: "My Journey", bullets: ["a"] });
    const ids = atsIssues(c, cleanLayout, ["Fun Stuff"]).map((i) => i.id);
    assert.ok(ids.includes("contact") && ids.includes("headings"));
  });
});

describe("the model's share", () => {
  const ai: AiJudgement = {
    experienceRelevance: { score: 90, reason: "Has done this job." },
    jobAlignment: { score: 80, reason: "Aimed well." },
    strengths: ["S1", "S2", "S3"],
    weaknesses: ["W1"],
    sectionNotes: { summary: "Fine." },
    recommendations: [{ title: "No evidence of Kafka", detail: "…", priority: "high", category: "skills", effort: "medium" }],
    bulletSuggestions: [{ path: "experience.0.bullets.2", context: "x", original: "Worked on migrating a monolith to microservices on Kubernetes", suggested: "Migrated a monolith to microservices on Kubernetes", rationale: "r", needsMetric: false }],
    missingKeywordAdvice: [{ keyword: "Kafka", whyItMatters: "why", whereItCouldFit: "where" }],
    summaryFeedback: "ok",
  };
  const withAi = scoreResume({ content, requirements: req, layout: null, unmappedHeadings, ai, model: "m", now: NOW });

  it("moves only the two judgement categories, scaled to their weights", () => {
    assert.equal(withAi.scoreBreakdown.experienceRelevance.score, 18);
    assert.equal(withAi.scoreBreakdown.jobAlignment.score, 4);
    assert.equal(withAi.scoreBreakdown.experienceRelevance.byModel, true);
    for (const key of ["keywordMatch", "skillsMatch", "structure", "atsCompatibility", "achievements", "education"] as const) {
      assert.equal(withAi.scoreBreakdown[key].score, result.scoreBreakdown[key].score, key);
    }
    assert.equal(withAi.ai.status, "ok");
    assert.equal(result.ai.status, "unavailable");
  });
  it("cannot push a category past its maximum", () => {
    const wild = scoreResume({ content, requirements: req, layout: null, ai: { ...ai, experienceRelevance: { score: 100, reason: "" }, jobAlignment: { score: 100, reason: "" } }, now: NOW });
    assert.equal(wild.scoreBreakdown.experienceRelevance.score, 20);
    assert.equal(wild.scoreBreakdown.jobAlignment.score, 5);
    assert.ok(wild.overallScore <= 100);
  });
  it("merges the model's prose with the deterministic findings without duplicating them", () => {
    assert.deepEqual(withAi.strengths, ["S1", "S2", "S3"]);
    assert.equal(withAi.sectionAnalysis.summary.note, "Fine.");
    assert.equal(withAi.recommendations.filter((r) => /Kafka/.test(r.title)).length, 1);
    assert.equal(withAi.missingKeywordAdvice.filter((a) => a.keyword === "Kafka").length, 1);
    assert.equal(withAi.bulletPointSuggestions.length, 1);
    assert.equal(withAi.priorityImprovements.length, 5);
  });
});

describe("compareAnalyses", () => {
  it("reports the delta, per category, and what was gained or lost", () => {
    const better = structuredClone(content);
    better.experience[0].bullets.push("Streamed order events through Kafka to downstream services");
    const after = scoreResume({ content: better, requirements: req, layout: null, ai: null, now: NOW });
    const cmp = compareAnalyses(result, after);
    assert.equal(cmp.overall.delta, after.overallScore - result.overallScore);
    assert.ok(cmp.overall.delta > 0);
    assert.deepEqual(cmp.skillsGained, ["Kafka"]);
    assert.deepEqual(cmp.skillsLost, []);
    assert.equal(cmp.categories.length, 8);
  });
});
