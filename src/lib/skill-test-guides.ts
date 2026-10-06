import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { isSkillLevel, skillDef } from "./skill-catalog.js";

/**
 * A written guide for each skill test: who it is for, what each topic
 * examines, how to prepare and what the day is like, one sample question
 * a reader can try, and the questions people ask about it.
 *
 * Why this exists: a test page (/skill-tests/<slug>) was the paper's
 * outline and its rules — the same few hundred words on all of them, which
 * is what a search engine files as thin and leaves "discovered, not
 * indexed". A search for "java certification test" or "operating systems
 * MCQ test" is answered by a page that says what the test examines and how
 * to get ready for it; that is what these are, and the page and its HTML
 * carry the same words (services/seo.ts skillTestHead writes them at the
 * edge, the SPA draws them).
 *
 * Files are content/skill-tests/<slug>.md, shipped with the API image like
 * the roadmap lessons (lib/roadmap-lessons.ts) — no table, no seed: read
 * once per process and served from memory, so a guide goes live with a
 * deploy. The slug is the test's ("java-basic"), which names its skill and
 * level.
 *
 * File shape — frontmatter between `---` lines, one `key: value` per line:
 *
 *   updated (YYYY-MM-DD), question + answer (the direct answer under the
 *   H1, 25–80 words), then three to six q:/a: pairs (the common questions,
 *   printed after the text and the page's FAQPage).
 *
 * then the body: `##` sections (three to six, never a `#` — the page owns
 * the H1), and last of all a `## Sample question` section written in the
 * question bank's own grammar (scripts/skill-test-data/AUTHORING.md):
 * `topic:`/`answer:`/`run:` lines, the prompt, `- A: …` options and a
 * `> ` explanation. The sample is public — the page lets a reader answer
 * it and then shows why — so it must never be a question from the private
 * bank; the seeder refuses one that is (scripts/seed-skill-tests.ts
 * --validate), and runs a `run:` sample on the judge with the bank's
 * (--run).
 */

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideSample {
  topic: string;
  prompt: string;
  options: string[];
  /** Indices of the correct options — public, it is a sample. */
  answer: number[];
  multi: boolean;
  explanation: string;
  run?: string;
}

export interface SkillTestGuide {
  slug: string;
  skill: string;
  level: string;
  updated: string;
  question: string;
  answer: string;
  faq: GuideFaq[];
  /** The `##` sections before the sample, as authored Markdown. */
  body: string;
  sample: GuideSample;
}

const KEYS = new Set(["updated", "question", "answer", "q", "a"]);
const LETTERS = "ABCDEF";
const FENCE = /^\s*(```|~~~)/;
const OPTION = /^- ([A-F]): (.*)$/;
const HEADER = /^(topic|answer|run):\s*(.*)$/;
export const SAMPLE_HEADING = "## Sample question";

/** "java-basic" → its skill and level; "networks-intermediate" → networks, intermediate. */
export function slugParts(slug: string): { skill: string; level: string } {
  const at = slug.lastIndexOf("-");
  return { skill: slug.slice(0, at), level: slug.slice(at + 1) };
}

/** One guide file, parsed; throws with the file name on anything malformed. */
export function parseGuide(text: string, file: string): SkillTestGuide {
  const slug = file.replace(/^.*[\\/]/, "").replace(/\.md$/, "");
  const { skill, level } = slugParts(slug);
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${file}: missing frontmatter`);

  const meta: Record<string, string> = {};
  const faq: GuideFaq[] = [];
  let pendingQ: string | null = null;
  for (const raw of match[1]!.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const at = line.indexOf(":");
    if (at === -1) throw new Error(`${file}: frontmatter line without a key: ${line.slice(0, 60)}`);
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (!KEYS.has(key)) throw new Error(`${file}: unknown frontmatter key "${key}"`);
    if (key === "q") {
      if (pendingQ !== null) throw new Error(`${file}: "q:" without its "a:" — ${pendingQ.slice(0, 50)}`);
      pendingQ = value;
    } else if (key === "a") {
      if (pendingQ === null) throw new Error(`${file}: "a:" without a "q:" before it`);
      faq.push({ q: pendingQ, a: value });
      pendingQ = null;
    } else {
      if (key in meta) throw new Error(`${file}: "${key}" given twice`);
      meta[key] = value;
    }
  }
  if (pendingQ !== null) throw new Error(`${file}: the last "q:" has no "a:"`);

  const lines = match[2]!.replace(/\r\n?/g, "\n").split("\n");
  let sampleAt = -1;
  let fenced = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (FENCE.test(lines[i]!)) fenced = !fenced;
    if (!fenced && lines[i]!.trim() === SAMPLE_HEADING) {
      sampleAt = i;
      break;
    }
  }
  if (sampleAt < 0) throw new Error(`${file}: no "${SAMPLE_HEADING}" section`);

  return {
    slug,
    skill,
    level,
    updated: meta["updated"] ?? "",
    question: meta["question"] ?? "",
    answer: meta["answer"] ?? "",
    faq,
    body: lines.slice(0, sampleAt).join("\n").trim(),
    sample: parseSample(lines.slice(sampleAt + 1), file),
  };
}

/** The sample section, in the bank's grammar (scripts/skill-test-data/bank.ts parseBank). */
function parseSample(body: string[], file: string): GuideSample {
  let i = 0;
  while (i < body.length && !body[i]!.trim()) i += 1;
  const headers: Record<string, string> = {};
  while (i < body.length && HEADER.test(body[i]!)) {
    const m = HEADER.exec(body[i]!)!;
    headers[m[1]!] = m[2]!.trim();
    i += 1;
  }

  let optionStart = -1;
  let optionEnd = -1;
  let inFence = false;
  for (let j = i; j < body.length; j += 1) {
    if (FENCE.test(body[j]!)) inFence = !inFence;
    if (inFence) continue;
    if (OPTION.test(body[j]!)) {
      optionStart = j;
      optionEnd = j;
      while (optionEnd + 1 < body.length && OPTION.test(body[optionEnd + 1]!)) optionEnd += 1;
      break;
    }
  }
  if (optionStart < 0) throw new Error(`${file}: the sample question has no options ("- A: …" lines)`);

  const options: string[] = [];
  for (let j = optionStart; j <= optionEnd; j += 1) {
    const m = OPTION.exec(body[j]!)!;
    if (m[1] !== LETTERS[options.length]) throw new Error(`${file}: the sample's options must run A, B, C… in order`);
    options.push(m[2]!.trim());
  }

  const explanation: string[] = [];
  for (const line of body.slice(optionEnd + 1)) {
    if (!line.trim()) continue;
    if (line.startsWith(">")) explanation.push(line.replace(/^>\s?/, ""));
    else throw new Error(`${file}: only a "> explanation" may follow the sample's options (found "${line.slice(0, 40)}")`);
  }

  const answer = (headers["answer"] ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((letter) => LETTERS.indexOf(letter.toUpperCase()));
  return {
    topic: headers["topic"] ?? "",
    prompt: body.slice(i, optionStart).join("\n").trim(),
    options,
    answer,
    multi: answer.length > 1,
    explanation: explanation.join("\n").trim(),
    run: headers["run"] || undefined,
  };
}

/* ── Validation ──────────────────────────────────────────────────── */

/** Words of prose a reader reads — code blocks and Markdown marks left out. */
export function proseWords(markdown: string): number {
  const text = markdown
    .replace(/^\s*(```|~~~)[^\n]*\n[\s\S]*?\n\s*\1\s*$/gm, " ")
    .replace(/`[^`]*`/g, " x ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_|-]/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** The internal links a guide's text and answers make, in order. */
export function guideLinks(guide: SkillTestGuide): string[] {
  const text = [guide.body, guide.answer, ...guide.faq.map((f) => f.a), guide.sample.explanation].join("\n");
  return [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]!);
}

/**
 * Every rule a guide must keep, as messages. `knownPath` says whether a
 * site path exists (the seeder and the test build it from the catalogue);
 * without it links are only checked for shape.
 */
export function validateGuide(guide: SkillTestGuide, knownPath?: (path: string) => boolean): string[] {
  const at = `content/skill-tests/${guide.slug}.md`;
  const problems: string[] = [];
  const def = skillDef(guide.skill);
  if (!def || !isSkillLevel(guide.level)) problems.push(`${at}: the file name must be a test's slug, "<skill>-<level>"`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.updated)) problems.push(`${at}: updated must be YYYY-MM-DD`);
  if (!guide.question.endsWith("?")) problems.push(`${at}: question must be a question ("…?")`);
  const answerWords = words(guide.answer);
  if (answerWords < 25 || answerWords > 80) problems.push(`${at}: answer must be 25–80 words (has ${answerWords})`);
  if (guide.faq.length < 3 || guide.faq.length > 6) problems.push(`${at}: needs three to six q:/a: pairs (has ${guide.faq.length})`);
  for (const f of guide.faq) {
    if (!f.q.endsWith("?")) problems.push(`${at}: "${f.q.slice(0, 50)}" must end with "?"`);
    const n = words(f.a);
    if (n < 12 || n > 90) problems.push(`${at}: the answer to "${f.q.slice(0, 50)}" must be 12–90 words (has ${n})`);
  }
  if (new Set(guide.faq.map((f) => f.q.toLowerCase())).size !== guide.faq.length) problems.push(`${at}: two q: lines are the same`);

  // The body: sections, length, no H1.
  const headings = guide.body.split("\n").filter((l) => /^#{1,6}\s/.test(l));
  if (headings.some((h) => /^#\s/.test(h))) problems.push(`${at}: never a "#" heading — the page owns the H1`);
  const sections = headings.filter((h) => /^##\s/.test(h));
  if (sections.length < 3 || sections.length > 6) problems.push(`${at}: needs three to six "##" sections before the sample (has ${sections.length})`);
  if (new Set(sections.map((h) => h.toLowerCase())).size !== sections.length) problems.push(`${at}: two "##" sections share a title`);
  const prose = proseWords(guide.body);
  if (prose < 450) problems.push(`${at}: the guide needs at least 450 words of prose before the sample (has ${prose})`);
  if (prose > 1400) problems.push(`${at}: the guide runs to ${prose} words; keep it under 1,400`);
  if (/__CODEKAIRO_/.test([guide.body, guide.sample.prompt, guide.sample.options.join(""), guide.sample.explanation].join(""))) problems.push(`${at}: contains the reserved marker __CODEKAIRO_`);

  for (const href of guideLinks(guide)) {
    if (!href.startsWith("/")) problems.push(`${at}: link "${href}" must be a path on this site`);
    else if (knownPath && !knownPath(href.replace(/[?#].*$/, ""))) problems.push(`${at}: link "${href}" goes to a page that does not exist`);
  }

  // The sample, by the bank's rules.
  const s = guide.sample;
  if (def && !def.topics.some((t) => t.id === s.topic)) problems.push(`${at}: the sample's topic "${s.topic}" is not one of ${def.label}'s`);
  if (s.prompt.length < 10) problems.push(`${at}: the sample's prompt is missing`);
  if (s.options.length < 3 || s.options.length > 6) problems.push(`${at}: the sample needs 3–6 options`);
  if (s.answer.length === 0 || s.answer.some((i) => i < 0 || i >= s.options.length)) problems.push(`${at}: the sample's answer names no option`);
  if (s.multi !== /select all that apply/i.test(s.prompt)) problems.push(`${at}: a sample with several answers says "Select all that apply", and only that one`);
  if (s.explanation.length < 30) problems.push(`${at}: the sample's explanation must say why (30+ characters)`);
  if (s.run && (s.multi || !/^`[^`]+`$/.test(s.options[s.answer[0] ?? -1]?.trim() ?? ""))) {
    problems.push(`${at}: a run: sample keys one option written as one inline code span`);
  }
  return problems;
}

/**
 * Whether a path a guide links to is a page: the index pages, a topic hub,
 * an aptitude section or topic, a study track, a roadmap lesson, a skill
 * test. The study tracks are the four seeded ones (scripts/study-plans
 * TRACKS) — a guide must not link a track that is not live. `testSlugs`
 * comes from the seed source, which lives outside src/.
 */
export function siteLinkChecker(testSlugs: Iterable<string>, hubs: Iterable<string>, aptitude: Iterable<string>, lessons: Iterable<string>): (path: string) => boolean {
  const known = new Set<string>(["/challenges", "/roadmap", "/aptitude", "/study-plans", "/tests", "/skill-tests", "/bug-hunts", "/mock-interview", "/contests"]);
  for (const track of ["java", "javascript", "cpp", "python"]) known.add(`/study-plans/${track}`);
  for (const slug of testSlugs) known.add(`/skill-tests/${slug}`);
  for (const slug of hubs) known.add(`/challenges/${slug}`);
  for (const id of aptitude) known.add(`/aptitude/${id}`);
  for (const slug of lessons) known.add(`/roadmap/${slug}`);
  return (path) => known.has(path);
}

/* ── Loading ─────────────────────────────────────────────────────── */

export const GUIDE_DIR = fileURLToPath(new URL("../../content/skill-tests/", import.meta.url));

/** Every guide file, parsed. A file that does not parse is reported, never thrown. */
export function readGuides(dir: string = GUIDE_DIR): { guides: SkillTestGuide[]; problems: string[] } {
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
  } catch {
    return { guides: [], problems: [] };
  }
  const guides: SkillTestGuide[] = [];
  const problems: string[] = [];
  for (const file of files) {
    try {
      guides.push(parseGuide(readFileSync(`${dir}${file}`, "utf8"), file));
    } catch (err) {
      problems.push((err as Error).message);
    }
  }
  return { guides, problems };
}

let loaded: Map<string, SkillTestGuide> | null = null;

/**
 * The guide for a test, or null. Read once per process: a guide that does
 * not parse is logged and left out rather than taking the page down — the
 * test page reads as it did before guides, and the seeder's --validate and
 * skill-test-guides.test.ts are where a malformed file is stopped.
 */
export function guideFor(slug: string): SkillTestGuide | null {
  if (!loaded) {
    const { guides, problems } = readGuides();
    for (const p of problems) console.error(`[skill-test-guides] ${p}`);
    loaded = new Map(guides.map((g) => [g.slug, g]));
  }
  return loaded.get(slug) ?? null;
}
