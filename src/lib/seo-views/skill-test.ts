/**
 * The first screen of a skill test page (/skill-tests/<slug>) as data, for
 * the static-first view the Worker draws from it (frontend
 * lib/seo/views/api/skill-test.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * What SkillTestDetailPage shows a visitor once `GET /api/skill-tests/:slug`
 * is in, in its order: the seal, the eyebrow and the title, the blurb, the
 * flags, the quick answer (the guide's question and answer), the sitting
 * card's numbers and rules, the paper — every section with its count, marks,
 * time and instructions — what it covers, and the guide's article. The
 * fields are the route's own (routes/skill-tests.ts: `testSummary`, the
 * sections, the pool's topics in pool order, BREACH_LIMIT), so the view and
 * the page draw the same numbers. A visitor has no standing (no arc on the
 * seal or the dial, no credential, no sittings), so none is sent.
 *
 * Built in services/seo.ts skillTestHead from the row, the pool's topics and
 * the guide it has already loaded (2026-10-14) — no query of its own; the
 * head's select gained `cooldownDays`, `languages` and each section's
 * `instructions` for it.
 */
import { BREACH_LIMIT } from "../skill-tests.js";

export interface SkillTestView {
  kind: "skill-test";
  skill: string;
  /** The seal's code ("JV"), lib/skill-catalog `short` — the SPA's SKILL_SHORT. */
  short: string;
  level: string;
  levelLabel: string;
  skillLabel: string;
  title: string;
  blurb: string;
  durationSec: number;
  totalQuestions: number;
  passPercent: number;
  distinctionPercent: number;
  cooldownDays: number;
  validityMonths: number;
  /** The judge languages the coding round takes; empty means any. */
  languages: string[];
  breachLimit: number;
  sections: Array<{ name: string; kind: string; questionCount: number; durationSec: number; marksPerQuestion: number; instructions: string | null }>;
  topics: Array<{ label: string; practice: { label: string; href: string } | null }>;
  /** The guide's direct answer: the question as plain text, the answer as safe inline HTML (inlineMd). */
  answer: { question: string; html: string } | null;
  /** The guide's article as safe HTML (markdownToHtml, anchors on): below the first screen, drawn so a reader who scrolls during the load reads it. */
  guide: string | null;
}

export interface SkillTestViewInput {
  skill: string;
  short: string | undefined;
  level: string;
  levelLabel: string;
  skillLabel: string;
  title: string;
  blurb: string;
  durationSec: number;
  totalQuestions: number;
  passPercent: number;
  distinctionPercent: number;
  cooldownDays: number;
  validityMonths: number;
  languages: unknown;
  sections: SkillTestView["sections"];
  topics: SkillTestView["topics"];
  answer: SkillTestView["answer"];
  guide: string | null;
}

export function skillTestView(t: SkillTestViewInput): SkillTestView {
  return {
    kind: "skill-test",
    skill: t.skill,
    short: t.short ?? t.skill.slice(0, 3).toUpperCase(),
    level: t.level,
    levelLabel: t.levelLabel,
    skillLabel: t.skillLabel,
    title: t.title,
    blurb: t.blurb,
    durationSec: t.durationSec,
    totalQuestions: t.totalQuestions,
    passPercent: t.passPercent,
    distinctionPercent: t.distinctionPercent,
    cooldownDays: t.cooldownDays,
    validityMonths: t.validityMonths,
    // routes/skill-tests languagesOf: the Json column as strings.
    languages: Array.isArray(t.languages) ? (t.languages as unknown[]).map(String) : [],
    breachLimit: BREACH_LIMIT,
    sections: t.sections,
    topics: t.topics,
    answer: t.answer,
    guide: t.guide,
  };
}
