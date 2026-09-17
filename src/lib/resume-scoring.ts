import type { LayoutSignals } from "./resume-extract.js";
import { bulletsOf, contentToText, headingKey, yearsOfExperience, type AddressedBullet, type ResumeContent } from "./resume-parse.js";
import type { JobRequirements } from "./resume-requirements.js";
import { STRONG_VERBS, WEAK_OPENINGS, compiledSkills, termPattern, type CompiledSkill } from "./resume-taxonomy.js";

/**
 * The ATS score, and every reason behind it.
 *
 * Eight categories, weighted by the table below, each returning its score,
 * its maximum, a sentence of reasoning and the evidence it rests on — so the
 * person can see exactly which line earned or lost a point. Six of the
 * eight are decided here from the resume, the requirements and the file's
 * layout signals, deterministically. Two — how relevant the experience is
 * and how well the whole resume is aimed at the job — are judgements, and
 * the model makes them (lib/resume-ai.ts); when the model is unavailable a
 * heuristic stands in and the report says so. The score is therefore never
 * "a number the AI made up": the model's share is bounded at 25 points and
 * its reasons are printed beside the rest.
 *
 * The weights are constants, not literals scattered through the rules, so
 * rebalancing is one edit.
 */

export const ATS_SCORING_WEIGHTS = {
  keywordMatch: 25,
  skillsMatch: 20,
  experienceRelevance: 20,
  structure: 10,
  atsCompatibility: 10,
  achievements: 5,
  education: 5,
  jobAlignment: 5,
} as const;

export type ScoreCategory = keyof typeof ATS_SCORING_WEIGHTS;

export const CATEGORY_LABELS: Record<ScoreCategory, string> = {
  keywordMatch: "Keyword match",
  skillsMatch: "Required skills",
  experienceRelevance: "Experience relevance",
  structure: "Resume structure",
  atsCompatibility: "ATS compatibility",
  achievements: "Achievement quality",
  education: "Education & certifications",
  jobAlignment: "Job alignment",
};

export interface CategoryScore {
  category: ScoreCategory;
  score: number;
  maxScore: number;
  reason: string;
  evidence: string[];
  matched?: string[];
  missing?: string[];
  /** The model decided this one; false means the heuristic stood in. */
  byModel?: boolean;
}

export type MatchStatus = "demonstrated" | "listed" | "missing";

export interface SkillMatch {
  name: string;
  category: string;
  requirement: "required" | "preferred";
  status: MatchStatus;
  /** Where it appears: "experience", "projects", "skills", "summary", "other". */
  where: string[];
  /** The line it was found in, when it was. */
  evidence: string | null;
}

export interface KeywordMatch {
  term: string;
  weight: number;
  required: boolean;
  status: "matched" | "partial" | "missing";
  evidence: string | null;
}

export type Severity = "high" | "medium" | "low";

export interface AtsIssue {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface BulletFinding extends AddressedBullet {
  weakOpening: string | null;
  hasMetric: boolean;
  strongVerb: boolean;
  tooLong: boolean;
}

export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  title: string;
  detail: string;
  priority: Priority;
  category: "skills" | "keywords" | "experience" | "achievements" | "structure" | "formatting" | "education" | "summary" | "alignment";
  effort: "low" | "medium" | "high";
  /** A bullet or field the recommendation is about, when it is about one. */
  path?: string;
}

export type SectionStatus = "strong" | "needs_attention" | "missing";

export interface SectionVerdict {
  status: SectionStatus;
  note: string;
}

export interface BulletSuggestion {
  path: string;
  context: string;
  original: string;
  suggested: string;
  rationale: string;
  /** The rewrite would want a figure the resume does not have; the person supplies it. */
  needsMetric: boolean;
}

export interface MissingKeywordAdvice {
  keyword: string;
  whyItMatters: string;
  whereItCouldFit: string;
}

/** What the model contributes (validated in lib/resume-ai.ts before it gets here). */
export interface AiJudgement {
  experienceRelevance: { score: number; reason: string };
  jobAlignment: { score: number; reason: string };
  strengths: string[];
  weaknesses: string[];
  sectionNotes: Partial<Record<string, string>>;
  recommendations: Recommendation[];
  bulletSuggestions: BulletSuggestion[];
  missingKeywordAdvice: MissingKeywordAdvice[];
  summaryFeedback: string;
}

export interface AnalysisResult {
  version: 1;
  overallScore: number;
  label: "Excellent match" | "Good match" | "Fair match" | "Weak match";
  weights: typeof ATS_SCORING_WEIGHTS;
  scoreBreakdown: Record<ScoreCategory, CategoryScore>;
  target: { source: JobRequirements["source"]; role: string; company: string; yearsRequired: number | null; yearsFound: number; education: string[]; certifications: string[]; responsibilities: string[] };
  matchedKeywords: KeywordMatch[];
  partialKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  matchedSkills: SkillMatch[];
  listedSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  softSkills: { matched: string[]; missing: string[] };
  domainTerms: { matched: string[]; missing: string[] };
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
  priorityImprovements: Recommendation[];
  sectionAnalysis: Record<"summary" | "experience" | "education" | "skills" | "projects" | "certifications", SectionVerdict>;
  atsIssues: AtsIssue[];
  jobAlignment: { score: number; reason: string };
  bulletPointSuggestions: BulletSuggestion[];
  missingKeywordAdvice: MissingKeywordAdvice[];
  bulletFindings: BulletFinding[];
  summaryFeedback: string | null;
  ai: { status: "ok" | "unavailable"; reason: string | null; model: string | null };
}

/* ── text views of the resume ──────────────────────────────────────────── */

interface Views {
  all: string;
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  other: string;
  /** Every line of the resume, for evidence lookup. */
  lines: string[];
}

function views(content: ResumeContent): Views {
  const experience = content.experience.map((e) => [e.position, e.company, ...e.bullets].join("\n")).join("\n");
  const projects = content.projects.map((p) => [p.name, p.technologies.join(", "), ...p.bullets].join("\n")).join("\n");
  const skills = content.skills.map((g) => [g.category, ...g.items].join(", ")).join("\n");
  const other = [
    ...content.education.map((e) => [e.degree, e.field, e.institution, ...e.details].join("\n")),
    ...content.certifications.map((c) => [c.name, c.issuer].join(" ")),
    ...content.achievements,
    ...content.customSections.map((c) => [c.title, ...c.bullets].join("\n")),
    content.basics.title,
  ].join("\n");
  const all = contentToText(content);
  return { all, summary: content.summary, experience, projects, skills, other, lines: all.split("\n").map((l) => l.trim()).filter(Boolean) };
}

function firstLineMatching(lines: string[], patterns: RegExp[]): string | null {
  for (const line of lines) {
    for (const p of patterns) {
      p.lastIndex = 0;
      if (p.test(line)) return line.length > 180 ? line.slice(0, 177) + "…" : line;
    }
  }
  return null;
}

function mentioned(skill: CompiledSkill, text: string): boolean {
  return skill.patterns.some((p) => {
    p.lastIndex = 0;
    return p.test(text);
  });
}

/* ── skills and keywords ───────────────────────────────────────────────── */

function matchSkills(content: ResumeContent, req: JobRequirements, v: Views): SkillMatch[] {
  const byName = new Map(compiledSkills().map((s) => [s.name, s]));
  const out: SkillMatch[] = [];
  const consider = (name: string, requirement: "required" | "preferred") => {
    const skill = byName.get(name);
    if (!skill) return;
    const where: string[] = [];
    if (mentioned(skill, v.experience)) where.push("experience");
    if (mentioned(skill, v.projects)) where.push("projects");
    if (mentioned(skill, v.skills)) where.push("skills");
    if (mentioned(skill, v.summary)) where.push("summary");
    if (mentioned(skill, v.other)) where.push("other");
    const demonstrated = where.includes("experience") || where.includes("projects");
    const status: MatchStatus = demonstrated ? "demonstrated" : where.length ? "listed" : "missing";
    const evidence = status === "missing" ? null : firstLineMatching(demonstrated ? [...content.experience.flatMap((e) => e.bullets), ...content.projects.flatMap((p) => p.bullets)] : v.lines, skill.patterns);
    out.push({ name: skill.name, category: skill.category, requirement, status, where, evidence });
  };
  for (const s of req.requiredSkills) consider(s, "required");
  for (const s of req.preferredSkills) consider(s, "preferred");
  return out;
}

const SUFFIXES = ["ization", "isation", "ations", "ation", "ments", "ment", "ings", "ing", "ies", "ers", "er", "ed", "es", "s"];

/** A crude stem: enough that "deployed" and "deployment" agree, and cheap. */
export function stem(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 4) return w;
  for (const suffix of SUFFIXES) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
      // "optimized" → "optimiz" and "optimization" → "optim" must agree.
      const base = w.slice(0, -suffix.length);
      return base.length > 5 && /i[sz]$/.test(base) ? base.slice(0, -2) : base;
    }
  }
  return w;
}

function matchKeywords(req: JobRequirements, v: Views): KeywordMatch[] {
  const allStems = new Set(v.all.toLowerCase().split(/[^a-z0-9+#.]+/).filter(Boolean).map(stem));
  return req.keywords.map((k) => {
    const pattern = termPattern(k.term);
    const evidence = firstLineMatching(v.lines, [pattern]);
    if (evidence) return { ...k, status: "matched" as const, evidence };
    const words = k.term.toLowerCase().split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2);
    const partial = words.length > 0 && words.every((w) => allStems.has(stem(w)));
    return { ...k, status: partial ? ("partial" as const) : ("missing" as const), evidence: null };
  });
}

function matchTerms(terms: string[], text: string): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const t of terms) (termPattern(t).test(text) ? matched : missing).push(t);
  return { matched, missing };
}

/* ── bullets ───────────────────────────────────────────────────────────── */

const METRIC = /\d+(?:\.\d+)?\s*(?:%|percent|x\b|k\b|m\b|mn\b|million|billion|lakh|crore|ms\b|s\b|sec|seconds|minutes|hours|days|weeks|months|users|customers|clients|requests|transactions|records|rows|queries|events|orders|downloads|installs|stars|views|engineers|developers|members|people|teams|students|projects|apis|endpoints|services|tests|bugs|issues|tickets|pages|screens|features|releases|deployments|servers|nodes|clusters|countries|cities|₹|\$|€|£|rupees|dollars)|(?:\$|₹|€|£)\s*\d|\b\d{2,}(?:,\d{3})+\b|\b\d+\+/i;
// Longest first, so "helped with" is reported rather than its prefix "helped".
const WEAK = new RegExp(`^(?:${[...WEAK_OPENINGS].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");
const STRONG = new Set(STRONG_VERBS.map((v) => v.toLowerCase()));

export function bulletFindings(content: ResumeContent): BulletFinding[] {
  return bulletsOf(content).map((b) => {
    const text = b.text.trim();
    const weak = text.match(WEAK);
    const first = text.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "").toLowerCase() ?? "";
    return {
      ...b,
      weakOpening: weak ? weak[0] : null,
      hasMetric: METRIC.test(text),
      strongVerb: !weak && STRONG.has(first),
      tooLong: text.length > 300,
    };
  });
}

/* ── structure and ATS ─────────────────────────────────────────────────── */

const DATE_FORMATS: Array<[RegExp, string]> = [
  [/^[A-Za-z]{3,9}\.?\s*,?\s*'?\d{2,4}$/, "Month YYYY"],
  [/^\d{1,2}[/.-]\d{4}$/, "MM/YYYY"],
  [/^\d{4}$/, "YYYY"],
];

function dateFormats(content: ResumeContent): Set<string> {
  const formats = new Set<string>();
  const dates = [...content.experience.flatMap((e) => [e.startDate, e.endDate]), ...content.education.flatMap((e) => [e.startDate, e.endDate])].filter(Boolean);
  for (const d of dates) {
    const f = DATE_FORMATS.find(([re]) => re.test(d.trim()));
    formats.add(f ? f[1] : "other");
  }
  return formats;
}

export function atsIssues(content: ResumeContent, layout: LayoutSignals | null, unmappedHeadings: string[]): AtsIssue[] {
  const issues: AtsIssue[] = [];
  const push = (id: string, severity: Severity, title: string, detail: string) => issues.push({ id, severity, title, detail });
  if (layout) {
    if (layout.multiColumn) push("multi-column", "high", "Multi-column layout", "The file lays text out in two columns. Many parsers read straight across the page and interleave the columns, so a sidebar of skills can end up mixed into your experience. A single column is the safe layout.");
    if (layout.tables >= 3) push("tables", "high", "Several tables", `${layout.tables} tables carry content. Table cells are read in unpredictable order by some parsers; put the same content in plain paragraphs and bullets.`);
    else if (layout.tables > 0) push("tables", "medium", "Content in a table", `${layout.tables === 1 ? "A table" : `${layout.tables} tables`} in the document. Some parsers skip or reorder table cells; keep contact details and skills out of tables.`);
    if (layout.textBoxes > 0) push("text-boxes", "medium", "Text boxes", `${layout.textBoxes === 1 ? "A text box" : `${layout.textBoxes} text boxes`} in the document. Text inside a text box is often invisible to a parser; move it into the body.`);
    if (layout.headerContact) push("header-contact", "medium", "Contact details in the page header", "Your email or phone sits in the header or footer area. Parsers frequently ignore headers; put contact details at the top of the body.");
    if (layout.images >= 3) push("images", "medium", "Several images or graphics", `${layout.images} images. Graphics carry no text a parser can read, and decorative resumes are more often mis-parsed. Keep to a photo at most, and only where photos are expected.`);
    else if (layout.images > 0) push("images", "low", "An image in the resume", "An image (a photo or a logo) carries nothing a parser can read. Make sure nothing important — a skill, a contact line — exists only as a picture.");
    if (layout.pages !== null && layout.pages >= 4) push("length", "medium", `${layout.pages} pages`, "Four or more pages is long for a resume; recruiters and parsers both favour one page for early career, two for experienced candidates.");
    else if (layout.pages !== null && layout.pages === 3) push("length", "low", "Three pages", "Three pages is on the long side. Two is the usual ceiling; trim older or less relevant entries.");
    if (layout.decorativeSymbols > 10) push("symbols", "low", "Decorative symbols", `${layout.decorativeSymbols} icon or symbol glyphs in the text (stars, arrows, icon-font characters). They often become garbage characters after parsing; use plain bullets and words.`);
    if (layout.repeatedHeaderFooter) push("running-header", "low", "Running header or footer", "A line repeats at the top or bottom of every page. Parsers can duplicate or misplace it; keep headers and footers empty.");
  }
  const b = content.basics;
  if (!b.email || !b.phone) push("contact", "medium", "Missing contact details", `${!b.email && !b.phone ? "No email address or phone number" : !b.email ? "No email address" : "No phone number"} was found. Both should be on the first lines, in plain text.`);
  if (!b.name) push("name", "medium", "Name not found", "The candidate's name could not be identified at the top of the resume. It should be the first line, on its own.");
  const custom = content.customSections.filter((c) => c.bullets.length && !headingKey(c.title));
  const odd = [...new Set([...unmappedHeadings, ...custom.map((c) => c.title)])];
  if (odd.length >= 3) push("headings", "medium", "Unusual section titles", `${odd.slice(0, 4).join(", ")} — parsers look for standard titles (Experience, Education, Skills, Projects). Creative titles are often skipped.`);
  else if (odd.length > 0) push("headings", "low", "Unusual section title", `"${odd[0]}" is not a standard section title. Parsers map content by title; a standard one (Experience, Education, Skills, Projects, Certifications) is safer.`);
  const formats = dateFormats(content);
  if (formats.size > 1) push("dates", "low", "Inconsistent date formats", `Dates are written ${[...formats].join(" and ")}. Pick one format (Jun 2023 – Present) for every entry; parsers infer tenure from them.`);
  const undated = content.experience.filter((e) => !e.startDate && !e.endDate && !e.current);
  if (undated.length) push("undated", "low", "Experience without dates", `${undated.length === 1 ? "One role has" : `${undated.length} roles have`} no dates. Parsers compute experience from date ranges; each role needs a start and an end (or Present).`);
  const untitled = content.experience.filter((e) => !e.position || !e.company);
  if (untitled.length) push("untitled", "low", "Role or employer missing", `${untitled.length === 1 ? "One entry is" : `${untitled.length} entries are`} missing a job title or an employer name. Both should be on the entry's first line.`);
  const bullets = content.experience.flatMap((e) => e.bullets);
  if (content.experience.length && bullets.length === 0) push("no-bullets", "low", "Experience without bullet points", "The roles have no bullet points. Two to five bullets per role, each starting with an action verb, read best for people and parsers alike.");
  const long = bullets.filter((t) => t.length > 300).length;
  if (long >= 2) push("long-bullets", "low", "Very long bullets", `${long} bullets run past 300 characters. Split them: one outcome per bullet, ideally under two lines.`);
  return issues;
}

/* ── categories ────────────────────────────────────────────────────────── */

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));
const pct = (n: number) => `${Math.round(n * 100)}%`;

function keywordCategory(skills: SkillMatch[], keywords: KeywordMatch[], soft: { matched: string[]; missing: string[] }, domain: { matched: string[]; missing: string[] }, req: JobRequirements): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.keywordMatch;
  let weight = 0;
  let credit = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const s of skills) {
    const w = s.requirement === "required" ? 2 : 1;
    weight += w;
    credit += w * (s.status === "demonstrated" ? 1 : s.status === "listed" ? 0.8 : 0);
    (s.status === "missing" ? missing : matched).push(s.name);
  }
  for (const k of keywords) {
    const w = k.required ? 1.2 : 0.8;
    weight += w;
    credit += w * (k.status === "matched" ? 1 : k.status === "partial" ? 0.5 : 0);
    (k.status === "missing" ? missing : matched).push(k.term);
  }
  for (const t of soft.matched) {
    weight += 0.4;
    credit += 0.4;
    matched.push(t);
  }
  for (const t of soft.missing) {
    weight += 0.4;
    missing.push(t);
  }
  for (const t of domain.matched) {
    weight += 0.6;
    credit += 0.6;
    matched.push(t);
  }
  for (const t of domain.missing) {
    weight += 0.6;
    missing.push(t);
  }
  if (weight === 0) {
    return { category: "keywordMatch", score: clamp(max * 0.6, max), maxScore: max, reason: "No job description or recognised role to match keywords against — a baseline is given. Add a target to score this properly.", evidence: [], matched, missing };
  }
  const ratio = credit / weight;
  const reason =
    req.source === "jd"
      ? `${matched.length} of ${matched.length + missing.length} terms from the job description appear in the resume (${pct(ratio)} weighted coverage; required skills count double).`
      : `${matched.length} of ${matched.length + missing.length} terms expected for a ${req.role || "role"} appear in the resume (${pct(ratio)} weighted coverage).`;
  return { category: "keywordMatch", score: clamp(ratio * max, max), maxScore: max, reason, evidence: matched.slice(0, 12), matched, missing };
}

function skillsCategory(skills: SkillMatch[], req: JobRequirements): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.skillsMatch;
  const required = skills.filter((s) => s.requirement === "required");
  const preferred = skills.filter((s) => s.requirement === "preferred");
  const credit = (s: SkillMatch) => (s.status === "demonstrated" ? 1 : s.status === "listed" ? 0.7 : 0);
  if (!required.length && !preferred.length) {
    return { category: "skillsMatch", score: clamp(max * 0.6, max), maxScore: max, reason: "The target names no skills the analyzer recognises, so a baseline is given.", evidence: [], matched: [], missing: [] };
  }
  const reqShare = preferred.length ? 14 : max;
  const prefShare = max - reqShare;
  const reqRatio = required.length ? required.reduce((n, s) => n + credit(s), 0) / required.length : 1;
  const prefRatio = preferred.length ? preferred.reduce((n, s) => n + credit(s), 0) / preferred.length : 0;
  const score = clamp(reqRatio * reqShare + prefRatio * prefShare, max);
  const demonstrated = skills.filter((s) => s.status === "demonstrated").map((s) => s.name);
  const listed = skills.filter((s) => s.status === "listed").map((s) => s.name);
  const missing = skills.filter((s) => s.status === "missing").map((s) => s.name);
  const reqMissing = required.filter((s) => s.status === "missing").map((s) => s.name);
  const parts = [`${required.length - reqMissing.length} of ${required.length} required skills present`];
  if (listed.length) parts.push(`${listed.length} only in the skills list, not shown in use`);
  if (preferred.length) parts.push(`${preferred.filter((s) => s.status !== "missing").length} of ${preferred.length} preferred`);
  return {
    category: "skillsMatch",
    score,
    maxScore: max,
    reason: `${parts.join("; ")}.${reqMissing.length ? ` Missing: ${reqMissing.slice(0, 5).join(", ")}${reqMissing.length > 5 ? "…" : ""}.` : ""}`,
    evidence: demonstrated.slice(0, 10),
    matched: [...demonstrated, ...listed],
    missing,
  };
}

function structureCategory(content: ResumeContent): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.structure;
  let score = 0;
  const evidence: string[] = [];
  const missing: string[] = [];
  const b = content.basics;
  const contact = (b.name ? 1 : 0) + (b.email ? 0.7 : 0) + (b.phone ? 0.3 : 0);
  score += Math.min(2, contact);
  if (contact >= 2) evidence.push("Contact block complete");
  else missing.push(!b.name ? "name" : !b.email ? "email" : "phone");
  if (content.summary.trim().length >= 80) {
    score += 1;
    evidence.push("Summary present");
  } else missing.push("summary");
  if (content.experience.length) {
    let exp = 3;
    if (content.experience.some((e) => !e.startDate && !e.endDate && !e.current)) exp -= 1;
    if (content.experience.some((e) => !e.position || !e.company)) exp -= 1;
    if (!content.experience.some((e) => e.bullets.length)) exp -= 1;
    score += Math.max(0, exp);
    evidence.push(`${content.experience.length} experience ${content.experience.length === 1 ? "entry" : "entries"}${exp < 3 ? " (some incomplete)" : ""}`);
  } else missing.push("experience");
  if (content.education.length) {
    score += 1;
    evidence.push("Education present");
  } else missing.push("education");
  const skillCount = content.skills.reduce((n, g) => n + g.items.length, 0);
  if (skillCount >= 5) {
    score += 2;
    evidence.push(`${skillCount} skills listed`);
  } else if (skillCount > 0) {
    score += 1;
    missing.push("a fuller skills list");
  } else missing.push("skills");
  if (content.projects.length || content.certifications.length) {
    score += 1;
    evidence.push(content.projects.length ? `${content.projects.length} projects` : "Certifications present");
  } else missing.push("projects or certifications");
  return {
    category: "structure",
    score: clamp(score, max),
    maxScore: max,
    reason: missing.length ? `Missing or thin: ${missing.join(", ")}.` : "Every expected section is present and complete.",
    evidence,
    missing,
  };
}

function atsCategory(issues: AtsIssue[]): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.atsCompatibility;
  const penalty = issues.reduce((n, i) => n + (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1), 0);
  return {
    category: "atsCompatibility",
    score: clamp(max - penalty, max),
    maxScore: max,
    reason: issues.length ? `${issues.length} compatibility ${issues.length === 1 ? "risk" : "risks"}: ${issues.slice(0, 3).map((i) => i.title.toLowerCase()).join(", ")}${issues.length > 3 ? "…" : ""}.` : "No layout or formatting risks detected.",
    evidence: issues.map((i) => i.title),
  };
}

function achievementsCategory(findings: BulletFinding[]): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.achievements;
  const work = findings.filter((f) => f.section === "experience" || f.section === "projects");
  if (!work.length) return { category: "achievements", score: 0, maxScore: max, reason: "No experience or project bullets to assess.", evidence: [] };
  const withMetric = work.filter((f) => f.hasMetric).length;
  const strong = work.filter((f) => f.strongVerb).length;
  const weak = work.filter((f) => f.weakOpening).length;
  const metricRatio = withMetric / work.length;
  const strongRatio = strong / work.length;
  const score = clamp(3 * Math.min(1, metricRatio / 0.4) + 2 * strongRatio, max);
  return {
    category: "achievements",
    score,
    maxScore: max,
    reason: `${withMetric} of ${work.length} bullets carry a measurable outcome; ${strong} open with an action verb${weak ? `, ${weak} open weakly ("${work.find((f) => f.weakOpening)?.weakOpening}")` : ""}.`,
    evidence: work.filter((f) => f.hasMetric).slice(0, 4).map((f) => f.text),
  };
}

const LEVEL = /\b(bachelor|b\.?\s?tech|b\.?\s?e\b|b\.?\s?sc|bca|b\.?\s?com|bba|undergraduate)\b|\b(master|m\.?\s?tech|m\.?\s?sc|mca|mba|m\.?\s?com|postgraduate)\b|\b(ph\.?\s?d|doctorate)\b/i;

function levelOf(text: string): number {
  const m = text.match(LEVEL);
  if (!m) return 0;
  return m[3] ? 3 : m[2] ? 2 : 1;
}

function educationCategory(content: ResumeContent, req: JobRequirements): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.education;
  let score = 0;
  const evidence: string[] = [];
  const missing: string[] = [];
  if (content.education.length) {
    const e = content.education[0];
    score += e.degree && e.institution ? 3 : 2;
    evidence.push([e.degree, e.field, e.institution].filter(Boolean).join(", "));
    if (!e.degree) missing.push("degree name");
  } else missing.push("education section");
  if (req.education.length) {
    const wanted = Math.max(...req.education.map(levelOf));
    const have = Math.max(0, ...content.education.map((e) => levelOf(`${e.degree} ${e.field}`)));
    if (wanted === 0 || have >= wanted) {
      score += 1;
      evidence.push("Meets the stated education requirement");
    } else missing.push(`the stated ${wanted === 3 ? "doctorate" : wanted === 2 ? "master's" : "bachelor's"} requirement`);
  } else score += 1;
  if (req.certifications.length) {
    const have = content.certifications.map((c) => `${c.name} ${c.issuer}`.toLowerCase());
    const hit = req.certifications.some((c) => {
      const key = c.toLowerCase().replace(/certif\w*/g, "").trim().split(/\s+/).filter((w) => w.length > 2);
      return key.length > 0 && have.some((h) => key.every((k) => h.includes(k)));
    });
    if (hit) {
      score += 1;
      evidence.push("A requested certification is present");
    } else missing.push(`requested certification (${req.certifications[0]})`);
  } else if (content.certifications.length) {
    score += 1;
    evidence.push(`${content.certifications.length} certification${content.certifications.length === 1 ? "" : "s"}`);
  } else score += 0.5;
  return {
    category: "education",
    score: clamp(score, max),
    maxScore: max,
    reason: missing.length ? `Missing: ${missing.join(", ")}.` : "Education and certifications cover what the target asks for.",
    evidence,
    missing,
  };
}

const ROLE_TOKENS = /\b(engineer|developer|scientist|analyst|manager|designer|architect|consultant|intern|lead|administrator|specialist|tester|qa|sde|devops|sre|researcher)\b/i;

function titleAlignment(content: ResumeContent, role: string): number {
  if (!role) return 0.5;
  const roleWords = new Set(role.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !/^(senior|junior|lead|staff|principal|the|and|for)$/.test(w)));
  if (!roleWords.size) return 0.5;
  const titles = [content.basics.title, ...content.experience.map((e) => e.position)].filter(Boolean).map((t) => t.toLowerCase());
  let best = 0;
  for (const t of titles) {
    const words = new Set(t.split(/[^a-z]+/));
    const hits = [...roleWords].filter((w) => words.has(w)).length;
    best = Math.max(best, hits / roleWords.size);
  }
  if (best === 0 && titles.some((t) => ROLE_TOKENS.test(t)) && ROLE_TOKENS.test(role)) best = 0.3;
  return best;
}

function heuristicExperience(content: ResumeContent, req: JobRequirements, skills: SkillMatch[], years: number): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.experienceRelevance;
  if (!content.experience.length && !content.projects.length) {
    return { category: "experienceRelevance", score: 2, maxScore: max, reason: "No experience or project entries to judge relevance from.", evidence: [], byModel: false };
  }
  const yearsFit = req.yearsRequired === null || req.yearsRequired === 0 ? 1 : Math.min(1, years / req.yearsRequired);
  const wanted = compiledSkills().filter((s) => skills.some((m) => m.name === s.name));
  const bullets = [...content.experience.flatMap((e) => e.bullets), ...content.projects.flatMap((p) => p.bullets)];
  const relevant = bullets.filter((b) => wanted.some((s) => mentioned(s, b))).length;
  const relevance = bullets.length ? Math.min(1, (relevant / bullets.length) * 2) : 0.3;
  const title = titleAlignment(content, req.role);
  const score = clamp(max * (0.4 * yearsFit + 0.4 * relevance + 0.2 * title), max);
  return {
    category: "experienceRelevance",
    score,
    maxScore: max,
    reason: `Heuristic (the model was unavailable): ${relevant} of ${bullets.length} bullets mention a required or preferred skill; ${req.yearsRequired ? `${years} years against ${req.yearsRequired} asked for` : `${years} years of dated experience`}; ${title >= 0.5 ? "titles align with the target role" : "titles do not clearly match the target role"}.`,
    evidence: [],
    byModel: false,
  };
}

function heuristicAlignment(content: ResumeContent, req: JobRequirements, domain: { matched: string[]; missing: string[] }): CategoryScore {
  const max = ATS_SCORING_WEIGHTS.jobAlignment;
  const title = titleAlignment(content, req.role);
  const domainRatio = domain.matched.length + domain.missing.length ? domain.matched.length / (domain.matched.length + domain.missing.length) : 0.5;
  const summaryHits = req.role ? req.role.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && content.summary.toLowerCase().includes(w)).length > 0 : false;
  const score = clamp(max * (0.5 * title + 0.3 * domainRatio + 0.2 * (summaryHits ? 1 : 0)), max);
  return {
    category: "jobAlignment",
    score,
    maxScore: max,
    reason: `Heuristic (the model was unavailable): ${title >= 0.5 ? "job titles echo the target role" : "job titles do not name the target role"}${req.role && !summaryHits ? "; the summary does not mention it" : ""}.`,
    evidence: [],
    byModel: false,
  };
}

/* ── the deterministic report text ─────────────────────────────────────── */

function sectionAnalysis(content: ResumeContent, skills: SkillMatch[], findings: BulletFinding[]): AnalysisResult["sectionAnalysis"] {
  const exp = findings.filter((f) => f.section === "experience");
  const strongShare = exp.length ? exp.filter((f) => f.strongVerb).length / exp.length : 0;
  const metricShare = exp.length ? exp.filter((f) => f.hasMetric).length / exp.length : 0;
  const skillCount = content.skills.reduce((n, g) => n + g.items.length, 0);
  const reqMissing = skills.filter((s) => s.requirement === "required" && s.status === "missing").length;
  const proj = findings.filter((f) => f.section === "projects");
  return {
    summary: !content.summary.trim()
      ? { status: "missing", note: "No professional summary. Two or three lines naming the role you want, your years and your core stack give a recruiter the frame for everything below." }
      : content.summary.trim().length < 120
        ? { status: "needs_attention", note: "The summary is short. Name the target role, the years of experience and the two or three technologies that matter most for this job." }
        : { status: "strong", note: "A summary is present and substantial." },
    experience: !content.experience.length
      ? { status: "missing", note: "No work experience section. Internships, freelance work and long-term projects belong here." }
      : !exp.length
        ? { status: "needs_attention", note: "The roles have no bullet points describing what you did." }
        : strongShare < 0.5 || metricShare < 0.25
          ? { status: "needs_attention", note: `${Math.round(strongShare * 100)}% of bullets open with an action verb and ${Math.round(metricShare * 100)}% carry a measurable result. Aim for every bullet to do both.` }
          : { status: "strong", note: "Bullets open with action verbs and most carry a measurable outcome." },
    education: !content.education.length
      ? { status: "missing", note: "No education section." }
      : content.education.some((e) => !e.degree || !e.institution)
        ? { status: "needs_attention", note: "An education entry is missing the degree or the institution name." }
        : { status: "strong", note: "Degree, institution and dates are present." },
    skills: skillCount === 0
      ? { status: "missing", note: "No skills section. Parsers and recruiters both look for one; group it by kind (Languages, Frameworks, Tools)." }
      : skillCount < 5 || reqMissing > 0
        ? { status: "needs_attention", note: reqMissing > 0 ? `${reqMissing} required skill${reqMissing === 1 ? "" : "s"} from the target ${reqMissing === 1 ? "is" : "are"} absent. Add only the ones you genuinely have.` : "The skills list is short." }
        : { status: "strong", note: `${skillCount} skills listed, covering the target's requirements.` },
    projects: !content.projects.length
      ? { status: "missing", note: "No projects section. Optional for experienced candidates; for students and early careers it is where the evidence lives." }
      : !proj.length || content.projects.some((p) => !p.technologies.length && !p.bullets.length)
        ? { status: "needs_attention", note: "Projects need the technologies used and one or two bullets on what was built and what came of it." }
        : { status: "strong", note: `${content.projects.length} project${content.projects.length === 1 ? "" : "s"} with technologies and outcomes.` },
    certifications: !content.certifications.length ? { status: "missing", note: "No certifications listed — fine unless the job asks for one." } : { status: "strong", note: `${content.certifications.length} listed.` },
  };
}

function deterministicRecommendations(content: ResumeContent, req: JobRequirements, skills: SkillMatch[], keywords: KeywordMatch[], findings: BulletFinding[], issues: AtsIssue[], years: number): Recommendation[] {
  const out: Recommendation[] = [];
  const reqMissing = skills.filter((s) => s.requirement === "required" && s.status === "missing");
  for (const s of reqMissing.slice(0, 4)) {
    out.push({
      title: `No evidence of ${s.name}`,
      detail: `${s.name} is ${req.source === "jd" ? "listed as required in the job description" : `expected for a ${req.role || "role like this"}`}, but the resume does not show it. If you have used ${s.name}, add it where you used it — a bullet under that role or project — and to the skills list. If you have not, leave it out; do not list a skill you cannot speak to.`,
      priority: "high",
      category: "skills",
      effort: "medium",
    });
  }
  const listedOnly = skills.filter((s) => s.requirement === "required" && s.status === "listed");
  if (listedOnly.length) {
    out.push({
      title: `Show ${listedOnly.slice(0, 3).map((s) => s.name).join(", ")} in use`,
      detail: `${listedOnly.length === 1 ? "This skill appears" : "These skills appear"} only in the skills list. A parser counts the keyword, but a reader wants to see it used: add a bullet under the role or project where you applied ${listedOnly.length === 1 ? "it" : "them"}.`,
      priority: "medium",
      category: "experience",
      effort: "medium",
    });
  }
  const prefMissing = skills.filter((s) => s.requirement === "preferred" && s.status === "missing");
  if (prefMissing.length) {
    out.push({
      title: `Preferred skills not shown: ${prefMissing.slice(0, 4).map((s) => s.name).join(", ")}`,
      detail: `Listed as preferred, not required. Add any you genuinely have — in the skills list and, where possible, in a bullet — and ignore the rest.`,
      priority: "low",
      category: "skills",
      effort: "low",
    });
  }
  const work = findings.filter((f) => f.section === "experience" || f.section === "projects");
  const weak = work.filter((f) => f.weakOpening);
  if (weak.length) {
    out.push({
      title: `Rewrite ${weak.length} bullet${weak.length === 1 ? "" : "s"} that open weakly`,
      detail: `Openings like "${[...new Set(weak.map((f) => f.weakOpening))].slice(0, 3).join('", "')}" describe involvement, not results. Lead with the action and the outcome: "Built X using Y, which did Z".`,
      priority: "medium",
      category: "achievements",
      effort: "low",
      path: weak[0].path,
    });
  }
  const withMetric = work.filter((f) => f.hasMetric).length;
  if (work.length && withMetric / work.length < 0.3) {
    out.push({
      title: "Add measurable outcomes to your bullets",
      detail: `Only ${withMetric} of ${work.length} bullets carry a number. Where you genuinely know the figure — users served, requests a day, time saved, error rate, team size — add it. Where you do not, say what changed in words rather than inventing a number.`,
      priority: "high",
      category: "achievements",
      effort: "medium",
    });
  }
  if (!content.summary.trim()) {
    out.push({ title: "Add a professional summary", detail: `Two or three lines at the top: the role you are targeting${req.role ? ` (${req.role})` : ""}, your years of experience, and the two or three technologies from the job that you know best.`, priority: "medium", category: "summary", effort: "low", path: "summary" });
  }
  for (const i of issues.filter((x) => x.severity !== "low").slice(0, 3)) {
    out.push({ title: i.title, detail: i.detail, priority: i.severity === "high" ? "high" : "medium", category: "formatting", effort: "medium" });
  }
  if (req.yearsRequired !== null && req.yearsRequired > 0 && years < req.yearsRequired * 0.75) {
    out.push({
      title: `The job asks for ${req.yearsRequired}+ years; your dated roles add up to ${years}`,
      detail: "Make sure every role, internship and long project has a date range so the experience it represents is counted. Do not stretch dates. If the gap is real, the summary can point to depth that compensates — shipped systems, scale handled, ownership.",
      priority: "medium",
      category: "experience",
      effort: "low",
    });
  }
  const missingKw = keywords.filter((k) => k.status === "missing" && k.required).slice(0, 3);
  if (missingKw.length) {
    out.push({
      title: `Terms from the posting not in the resume: ${missingKw.map((k) => k.term).join(", ")}`,
      detail: "Recruiters search postings' own words. Where one of these describes something you have actually done, use the posting's term for it rather than a synonym.",
      priority: "low",
      category: "keywords",
      effort: "low",
    });
  }
  return out;
}

function deterministicStrengths(content: ResumeContent, skills: SkillMatch[], findings: BulletFinding[], issues: AtsIssue[]): string[] {
  const out: string[] = [];
  const demonstrated = skills.filter((s) => s.status === "demonstrated");
  if (demonstrated.length >= 3) out.push(`${demonstrated.length} of the target's skills are shown in use, not just listed: ${demonstrated.slice(0, 4).map((s) => s.name).join(", ")}.`);
  const work = findings.filter((f) => f.section === "experience" || f.section === "projects");
  const metric = work.filter((f) => f.hasMetric).length;
  if (work.length && metric / work.length >= 0.4) out.push(`${metric} of ${work.length} bullets carry a measurable outcome.`);
  const strong = work.filter((f) => f.strongVerb).length;
  if (work.length && strong / work.length >= 0.7) out.push("Bullets consistently open with action verbs.");
  if (!issues.some((i) => i.severity === "high")) out.push("The layout has no high-risk formatting for parsers.");
  if (content.projects.length >= 2 && content.projects.every((p) => p.technologies.length)) out.push("Projects name their technologies, which parsers and readers both use.");
  if (content.summary.trim().length >= 120) out.push("A substantial summary frames the resume.");
  return out.slice(0, 5);
}

function deterministicWeaknesses(content: ResumeContent, skills: SkillMatch[], findings: BulletFinding[], issues: AtsIssue[]): string[] {
  const out: string[] = [];
  const reqMissing = skills.filter((s) => s.requirement === "required" && s.status === "missing");
  if (reqMissing.length) out.push(`${reqMissing.length} required skill${reqMissing.length === 1 ? "" : "s"} not evidenced: ${reqMissing.slice(0, 4).map((s) => s.name).join(", ")}.`);
  const work = findings.filter((f) => f.section === "experience" || f.section === "projects");
  const weak = work.filter((f) => f.weakOpening).length;
  if (weak) out.push(`${weak} bullet${weak === 1 ? "" : "s"} open with a weak phrase ("${work.find((f) => f.weakOpening)?.weakOpening}").`);
  const metric = work.filter((f) => f.hasMetric).length;
  if (work.length && metric / work.length < 0.3) out.push(`Few measurable outcomes: ${metric} of ${work.length} bullets carry a number.`);
  for (const i of issues.filter((x) => x.severity === "high")) out.push(`${i.title} — a parsing risk.`);
  if (!content.summary.trim()) out.push("No professional summary.");
  if (!content.skills.length) out.push("No skills section.");
  return out.slice(0, 5);
}

function deterministicKeywordAdvice(skills: SkillMatch[], keywords: KeywordMatch[], req: JobRequirements): MissingKeywordAdvice[] {
  const out: MissingKeywordAdvice[] = [];
  for (const s of skills.filter((x) => x.status === "missing").slice(0, 6)) {
    out.push({
      keyword: s.name,
      whyItMatters: s.requirement === "required" ? `Named as a requirement${req.source === "jd" ? " in the job description" : ` for ${req.role || "this role"}`}; a keyword filter may look for it.` : `Listed as preferred${req.source === "jd" ? " in the job description" : ""}; a nice-to-have that separates similar candidates.`,
      whereItCouldFit: s.category === "language" || s.category === "framework" || s.category === "database" || s.category === "cloud" || s.category === "devops" || s.category === "tooling" ? "The skills list, and a bullet under the role or project where you actually used it." : "A bullet under the relevant role, or the summary, if it describes work you have done.",
    });
  }
  for (const k of keywords.filter((x) => x.status === "missing" && x.required).slice(0, 4)) {
    out.push({ keyword: k.term, whyItMatters: "A term the posting uses; recruiters search for the posting's own words.", whereItCouldFit: "Wherever you describe the same thing — use the posting's wording for it, if it is accurate." });
  }
  return out;
}

/* ── the composition ───────────────────────────────────────────────────── */

export interface ScoreInput {
  content: ResumeContent;
  requirements: JobRequirements;
  layout: LayoutSignals | null;
  unmappedHeadings?: string[];
  ai: AiJudgement | null;
  aiFailure?: string | null;
  model?: string | null;
  now?: Date;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function labelFor(score: number): AnalysisResult["label"] {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Good match";
  if (score >= 50) return "Fair match";
  return "Weak match";
}

/** The whole report. Pure: the same inputs always give the same score. */
export function scoreResume(input: ScoreInput): AnalysisResult {
  const { content, requirements: req, layout, ai } = input;
  const v = views(content);
  const skills = matchSkills(content, req, v);
  const keywords = matchKeywords(req, v);
  const soft = matchTerms(req.softSkills, v.all);
  const domain = matchTerms(req.domainTerms, v.all);
  const findings = bulletFindings(content);
  const issues = atsIssues(content, layout, input.unmappedHeadings ?? []);
  const years = yearsOfExperience(content, input.now);

  const breakdown: Record<ScoreCategory, CategoryScore> = {
    keywordMatch: keywordCategory(skills, keywords, soft, domain, req),
    skillsMatch: skillsCategory(skills, req),
    experienceRelevance: ai
      ? { category: "experienceRelevance", score: clamp((ai.experienceRelevance.score / 100) * ATS_SCORING_WEIGHTS.experienceRelevance, ATS_SCORING_WEIGHTS.experienceRelevance), maxScore: ATS_SCORING_WEIGHTS.experienceRelevance, reason: ai.experienceRelevance.reason, evidence: [], byModel: true }
      : heuristicExperience(content, req, skills, years),
    structure: structureCategory(content),
    atsCompatibility: atsCategory(issues),
    achievements: achievementsCategory(findings),
    education: educationCategory(content, req),
    jobAlignment: ai
      ? { category: "jobAlignment", score: clamp((ai.jobAlignment.score / 100) * ATS_SCORING_WEIGHTS.jobAlignment, ATS_SCORING_WEIGHTS.jobAlignment), maxScore: ATS_SCORING_WEIGHTS.jobAlignment, reason: ai.jobAlignment.reason, evidence: [], byModel: true }
      : heuristicAlignment(content, req, domain),
  };
  const overall = Object.values(breakdown).reduce((n, c) => n + c.score, 0);

  const base = deterministicRecommendations(content, req, skills, keywords, findings, issues, years);
  // The model's recommendations lead; the deterministic ones fill in what it did not cover.
  const recommendations = ai ? [...ai.recommendations, ...base.filter((r) => !ai.recommendations.some((a) => similarTitle(a.title, r.title)))] : base;
  recommendations.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  const sections = sectionAnalysis(content, skills, findings);
  if (ai) {
    for (const key of Object.keys(sections) as Array<keyof typeof sections>) {
      const note = ai.sectionNotes[key];
      if (note) sections[key] = { ...sections[key], note };
    }
  }
  const advice = deterministicKeywordAdvice(skills, keywords, req);
  const missingKeywordAdvice = ai
    ? [...ai.missingKeywordAdvice, ...advice.filter((a) => !ai.missingKeywordAdvice.some((m) => m.keyword.toLowerCase() === a.keyword.toLowerCase()))]
    : advice;

  return {
    version: 1,
    overallScore: overall,
    label: labelFor(overall),
    weights: ATS_SCORING_WEIGHTS,
    scoreBreakdown: breakdown,
    target: { source: req.source, role: req.role, company: req.company, yearsRequired: req.yearsRequired, yearsFound: years, education: req.education, certifications: req.certifications, responsibilities: req.responsibilities },
    matchedKeywords: keywords.filter((k) => k.status === "matched"),
    partialKeywords: keywords.filter((k) => k.status === "partial"),
    missingKeywords: keywords.filter((k) => k.status === "missing"),
    matchedSkills: skills.filter((s) => s.status === "demonstrated"),
    listedSkills: skills.filter((s) => s.status === "listed"),
    missingSkills: skills.filter((s) => s.status === "missing"),
    softSkills: soft,
    domainTerms: domain,
    strengths: ai && ai.strengths.length ? ai.strengths : deterministicStrengths(content, skills, findings, issues),
    weaknesses: ai && ai.weaknesses.length ? ai.weaknesses : deterministicWeaknesses(content, skills, findings, issues),
    recommendations,
    priorityImprovements: recommendations.slice(0, 5),
    sectionAnalysis: sections,
    atsIssues: issues,
    jobAlignment: { score: breakdown.jobAlignment.score, reason: breakdown.jobAlignment.reason },
    bulletPointSuggestions: ai ? ai.bulletSuggestions : [],
    missingKeywordAdvice: missingKeywordAdvice.slice(0, 10),
    bulletFindings: findings.filter((f) => f.weakOpening || f.tooLong || (!f.hasMetric && f.section === "experience")),
    summaryFeedback: ai?.summaryFeedback || null,
    ai: { status: ai ? "ok" : "unavailable", reason: ai ? null : (input.aiFailure ?? "The model was not available; the report is the deterministic analysis only."), model: input.model ?? null },
  };
}

function similarTitle(a: string, b: string): boolean {
  const norm = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const x = norm(a);
  const y = norm(b);
  if (!x.size || !y.size) return false;
  const shared = [...x].filter((w) => y.has(w)).length;
  return shared / Math.min(x.size, y.size) >= 0.6;
}

/** The parts of two analyses a before/after view compares. */
export function compareAnalyses(before: AnalysisResult, after: AnalysisResult) {
  const categories = (Object.keys(ATS_SCORING_WEIGHTS) as ScoreCategory[]).map((key) => ({
    category: key,
    label: CATEGORY_LABELS[key],
    before: before.scoreBreakdown[key].score,
    after: after.scoreBreakdown[key].score,
    maxScore: ATS_SCORING_WEIGHTS[key],
  }));
  const names = (list: Array<{ name: string }>) => list.map((s) => s.name);
  const terms = (list: Array<{ term: string }>) => list.map((s) => s.term);
  const beforeSkills = new Set([...names(before.matchedSkills), ...names(before.listedSkills)]);
  const afterSkills = new Set([...names(after.matchedSkills), ...names(after.listedSkills)]);
  const beforeKw = new Set(terms(before.matchedKeywords));
  const afterKw = new Set(terms(after.matchedKeywords));
  return {
    overall: { before: before.overallScore, after: after.overallScore, delta: after.overallScore - before.overallScore },
    categories,
    skillsGained: [...afterSkills].filter((s) => !beforeSkills.has(s)),
    skillsLost: [...beforeSkills].filter((s) => !afterSkills.has(s)),
    keywordsGained: [...afterKw].filter((k) => !beforeKw.has(k)),
    keywordsLost: [...beforeKw].filter((k) => !afterKw.has(k)),
    issuesResolved: before.atsIssues.filter((i) => !after.atsIssues.some((j) => j.id === i.id)).map((i) => i.title),
    issuesIntroduced: after.atsIssues.filter((i) => !before.atsIssues.some((j) => j.id === i.id)).map((i) => i.title),
  };
}
