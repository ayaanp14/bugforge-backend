import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { APTITUDE_CANONICAL, APTITUDE_CATEGORIES, APTITUDE_TOPICS, aptitudeCanonicalSlug, aptitudeTopic, aptitudeCategory } from "../lib/aptitude-topics.js";
import { escapeHtml, markdownOutline, markdownToHtml } from "../lib/markdown-html.js";
import { BUG_HUBS, bugHub } from "../lib/bug-hubs.js";
import { isCompanyTag } from "../lib/companies.js";
import { PROBLEM_CANONICAL, problemCanonicalSlug } from "../lib/problem-canonical.js";
import { renamedCompanyHubSlug } from "../lib/problem-topics.js";
import { TEST_GUIDES } from "../lib/test-guides.js";
import { isSkillLevel, LEVEL_LABEL, SKILL_GROUPS, SKILLS, skillDef, skillTopic } from "../lib/skill-catalog.js";
import { guideFor } from "../lib/skill-test-guides.js";
import { credentialPath, normalizeCredentialCode } from "../lib/skill-tests.js";
import { poolTopics, verifyCredential } from "./skill-credentials.js";
import { APTITUDE_ESSENTIALS } from "../lib/aptitude-essentials.js";
import { APTITUDE_SECTION_GUIDES } from "../lib/aptitude-section-guides.js";
import { trackDefinition, trackList, type LessonSeo } from "./study-plans.js";
import { roadDefinition } from "./roadmap.js";
import { hubIndex, hubPage, hubsForTags, relatedProblems, type HubSummary } from "./problem-hubs.js";
import { getCatalogue } from "./dashboard.js";
import { bugHubIndex, bugHubPage, bugPath } from "./bug-hunts.js";
import { topicOrder } from "./aptitude-bank.js";
import { CARD_HEIGHT, CARD_WIDTH, getShareCard } from "./share-cards.js";
import { CONTENT_CARD_DESIGN, CONTENT_CARD_HEIGHT, CONTENT_CARD_WIDTH, contentCardPng, type ContentCard } from "../lib/content-card.js";
import { testSamples } from "./test-samples.js";
import { frameSvg } from "../lib/walkthroughs/svg.js";
import type { Walkthrough } from "../lib/walkthroughs/index.js";
import { LESSON_LANGUAGES, RESERVED_LESSON_SLUGS, WALKTHROUGH_MARKER } from "../lib/roadmap-lessons.js";
import { lessonPage, lessonSitemapEntries, lessonSyllabus, lessonsForTopics } from "./roadmap-lessons.js";

/**
 * What a search engine is told about the app's public content.
 *
 * The SPA opens its content pages — problems, bug hunts, study lessons,
 * aptitude questions, placement test patterns, and the hub pages over
 * them — to visitors, and the Cloudflare Worker in front of it completes
 * each page's <head> before the HTML leaves the edge, so a crawler that
 * never runs JavaScript still reads the right title and description.
 * `headFor` answers that lookup per URL; the sitemap builders enumerate
 * the same URLs for /sitemap.xml. Both are cached: the Worker caches a
 * head at the edge for an hour and a sitemap for a day, and here every
 * builder sits behind the in-process cache too, so a crawl of thousands
 * of URLs costs the database very little.
 *
 * The words are the same ones the pages set at runtime (the SPA's
 * hooks/useDocumentTitle callers, through src/lib/seo/titles.ts) — a
 * crawler must not see one title in the HTML and another after render.
 * The title templates live in one place here (`titles`) and are mirrored
 * there; seo.test.ts pins them.
 *
 * Beyond the head, each answer carries what a crawler that never runs
 * JavaScript would otherwise never see: `content`, the page's own text
 * rendered to a safe HTML subset (lib/markdown-html) — the statement,
 * editorial and reference solution of a problem, the report and files of
 * a bug hunt, a track's modules and lessons as links, a lesson's body and
 * exercises, a question with its options and (behind a disclosure) its
 * answer and worked solution, a test's sections, a hub's whole list —
 * which the Worker writes into the page's <div id="root"> (the SPA's
 * lib/seo/prerender); `facts`, the fields the page's typed structured-data
 * node names (the SPA's PageFacts), so the JSON-LD the edge writes and the
 * JSON-LD the page sets are identical; and `trail`, the breadcrumb from
 * the home page down to this one, which the page draws and the
 * BreadcrumbList repeats. Nothing here is sent that the page does not
 * show a visitor.
 */

/** The public site: canonical URLs are built on it. */
export const SITE_ORIGIN = (process.env["SITE_ORIGIN"] ?? "https://codekairo.com").replace(/\/+$/, "");

/** The SPA's PageFacts (src/lib/seo/structured-data.ts), mirrored. */
export interface PageFacts {
  keywords?: string[];
  difficulty?: string;
  language?: string;
  modules?: string[];
  lessons?: number;
  minutes?: number;
  track?: { title: string; path: string };
  checkpoint?: boolean;
  company?: string;
  questions?: number;
  topic?: string;
  /** A hub's size — problems, hunts or questions listed. */
  count?: number;
  /** An aptitude question's options, and the index of the correct one. */
  options?: string[];
  answer?: number;
  /** An aptitude question's stem as plain text — its Question node's `text`. */
  question?: string;
  /** A hub's first entries in page order (at most twenty) — its ItemList's elements. */
  items?: Array<{ name: string; path: string }>;
  /**
   * The questions a page prints with their answers, in page order — a
   * lesson's direct answer, then its common questions. Inline Markdown as
   * authored; the SPA's structured data renders them as plain text.
   */
  faq?: Array<{ q: string; a: string }>;
  /** A roadmap lesson's level ("Beginner" …) and the date it was last revised (YYYY-MM-DD). */
  level?: string;
  updated?: string;
  /** Home → section → … → this page. The last item is the page itself. */
  trail?: Crumb[];
}

export interface Crumb {
  name: string;
  path: string;
}

export interface PageHead {
  path: string;
  title: string;
  description: string;
  /**
   * The page's own preview picture (og:image / twitter:image), when it has
   * one — a shared win's card. Every other page uses the site's default.
   */
  image?: { url: string; width: number; height: number; alt: string };
  /** What the page's structured data names about it. */
  facts?: PageFacts;
  /** The page's text as safe HTML, for the prerendered body. */
  content?: string;
  /** The page's breadcrumb label — its own name, without the title's suffixes. */
  crumb?: string;
  /**
   * The address the page's canonical link should name, when it is not the
   * page's own: a restated aptitude question points at the original. The
   * page stays indexable and served; the canonical says which copy counts.
   */
  canonical?: string;
  /**
   * Served, linked and readable, but not to be indexed: the Worker writes
   * `noindex, follow` and the sitemap leaves it out. A company hub with one
   * or two problems (lib/problem-topics MIN_INDEXED_COMPANY_PROBLEMS).
   */
  noindex?: boolean;
  /**
   * For an index page the build already prerendered (/challenges …): the
   * HTML of its child list, which the Worker adds below the page's guide.
   * The title and description of such a page are the SPA's; the ones here
   * are placeholders the Worker ignores.
   */
  section?: "index";
}

/** A public address that has moved: the Worker answers with a 301. */
export interface PageRedirect {
  redirect: string;
}

const BRAND = "CodeKairo";
const DESCRIPTION_MAX = 158;
const LANGUAGE_LIST = "JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Kotlin, Swift, Rust, PHP and Ruby";

/* ── Titles: one template per page kind, mirrored in the SPA ─────── */

/**
 * The <title> of every content page, from the page's own facts. The SPA's
 * src/lib/seo/titles.ts holds the same functions — a page sets its title
 * with them at runtime, and the edge writes the same string here. Brand
 * last; the intent ("Coding Problem & Solution", "Aptitude Question") in
 * the middle so two pages never share a title.
 */
/**
 * Google shows about 600 px of a title — some 60 characters — and names the
 * site on its own line above it, so the brand is added only where the whole
 * title still fits. Until 2026-09-30 every template ended in it and 2,891 of
 * the 3,229 indexable titles ran past 60 (an aptitude question's median was
 * 88), so what a result cut off was the intent. The SPA's lib/seo/titles has
 * the same rule; the H1 is the title less the brand (lib/seo/prerender).
 */
const TITLE_BUDGET = 60;
const branded = (core: string): string => {
  const full = `${core} — ${BRAND}`;
  return full.length <= TITLE_BUDGET ? full : core;
};

export const titles = {
  problem: (title: string, difficulty: string) => branded(`${title} — ${difficulty} Problem & Solution`),
  topicHub: (label: string, count: number) => branded(`${label} Coding Problems: ${count} ${count === 1 ? "Question" : "Questions"} with Solutions`),
  companyHub: (label: string, count: number) => branded(`${label} Coding Interview Questions: ${count} Tagged ${count === 1 ? "Problem" : "Problems"}`),
  bugHunt: (title: string, language: string) => branded(`${title} — ${language} Bug Hunt`),
  bugHub: (label: string, count: number, kind: "language" | "category") =>
    branded(kind === "language" ? `${label} Debugging Practice: ${count} Bug Hunts on Real Code` : `${label} Bug Hunts: ${count} Debugging Challenges`),
  aptitudeCategory: (label: string, questions: number) => branded(`${questions} ${label} Questions with Solutions`),
  aptitudeTopic: (label: string) => branded(`${label} Aptitude Questions with Solutions`),
  aptitudeQuestion: (title: string, topicLabel: string) => branded(`${title} — ${topicLabel} Aptitude Question`),
  // "learn java", "java tutorial": the words a track is searched by. It
  // was "Learn Java: 20-Module Study Plan with 138 Lessons" — "study plan"
  // is this site's word, not a searcher's.
  studyTrack: (language: string, lessons: number) => branded(`Learn ${language}: Free ${language} Tutorial in ${lessons} Lessons`),
  // A lesson's authored search title (its seo-title — "What Is the JVM?
  // JDK vs JRE vs JVM Explained") when it has one; the lesson's own title
  // otherwise, which is written for a reader already on the page.
  studyLesson: (lesson: string, language: string, checkpoint: boolean, searchTitle?: string | null) =>
    branded(searchTitle ? searchTitle : `${lesson} — ${language} ${checkpoint ? "checkpoint" : "lesson"}`),
  // "tcs nqt pattern", "… syllabus": what the results for a company's test
  // are titled with; the page is the pattern guide and the mock (2026-10-01
  // SXO audit — it said "Mock Test" only). The CodeKairo papers follow no
  // company's pattern, so they keep the plain name.
  test: (name: string, company: string) =>
    branded(company === BRAND ? `${name} — Free Mock Test` : name.includes(company) ? `${name}: Pattern, Syllabus & Mock Test` : `${name} (${company}): Pattern, Syllabus & Mock Test`),
  // "java certification test": the phrase searched; "skill test" is in the H1 and description. Fits 60 characters for every skill.
  skillTest: (skill: string, level: string) => branded(`${skill} Certification Test (${level})`),
  // A roadmap lesson's authored search title ("Two Pointers Technique:
  // Explained with Examples & Code") — the tutorial's words, never the
  // hub's "… Coding Problems", so the two pages never compete for a query.
  roadmapLesson: (searchTitle: string) => branded(searchTitle),
};

/**
 * A track's meta description — the SPA's lib/seo/titles has the same
 * function. Composed rather than the track's blurb plus counts, which ran
 * to 250–370 characters and was cut mid-list in every result.
 */
export function trackDescription(language: string, modules: number, lessons: number, runtime: string): string {
  return `Learn ${language} free: ${lessons} lessons in ${modules} modules, from first programs to interview questions, with exercises judged on ${runtime} and a certificate.`;
}

/** Placeholders for inline code while summarise() strips markup (private-use, never in a statement). */
const CODE_OPEN = String.fromCharCode(0xe000);
const CODE_CLOSE = String.fromCharCode(0xe001);
const CODE_SLOT = new RegExp(`${CODE_OPEN}(\\d+)${CODE_CLOSE}`, "g");

/** A meta description from Markdown — the SPA's lib/seo/summary, mirrored. */
export function summarise(markdown: string, fallback = "", max = DESCRIPTION_MAX): string {
  // Inline code is set aside before the markup is stripped and put back after:
  // inside backticks "<" is literal, and unwrapping the spans first let the
  // tag pattern swallow `0 < p < n - 1` up to the next ">" — Valid Mountain
  // Array's description lost half a sentence (2026-10-02). The placeholders
  // are private-use characters, which no statement contains.
  const code: string[] = [];
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, (_m, c: string) => `${CODE_OPEN}${code.push(c) - 1}${CODE_CLOSE}`)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    // Only something shaped like a tag: "<" then a letter or "/".
    .replace(/<\/?[A-Za-z][^<>]*>/g, " ")
    .replace(CODE_SLOT, (_m, i: string) => code[Number(i)] ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  if (text.length <= max) return text;
  // A sentence ends at punctuation followed by a space or the end — not at
  // the dot inside "$40.00", "Node 16.17" or "e.g.", which the old
  // "[^.!?]+" pattern treated as a boundary and so began a description
  // mid-number ("00 and the total goes NEGATIVE").
  const sentences = text.match(/[^]*?[.!?]+(?=\s|$)\s?/g) ?? [];
  let out = "";
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  out = out.trim();
  if (out.length >= 60) return out;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 40))}…`;
}

/**
 * A question's stem as plain text, for a list row and its Question node:
 * the prompt without its tables and code (a data-interpretation question
 * opens with one), cut on a sentence where it can be.
 */
export function questionStem(prompt: string, max = 160): string {
  const text = prompt
    .replace(/```[\s\S]*?```/g, " ")
    .split("\n")
    .filter((line) => !/^\s*\|/.test(line))
    .join("\n");
  return summarise(text, "", max);
}

/** The first twenty entries of a list, as a hub's facts name them. */
const firstItems = (rows: Array<{ name: string; path: string }>) => rows.slice(0, 20);

/* ── HTML pieces ─────────────────────────────────────────────────── */

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);
/** "javascript" as the product prints it; the SPA's BugWorkspaceLoader does the same. */
export const languageName = (s: string) => (s.toLowerCase() === "javascript" ? "JavaScript" : s.toLowerCase() === "typescript" ? "TypeScript" : titleCase(s));

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const h = escapeHtml;
const link = (href: string, label: string) => `<a href="${h(href)}">${h(label)}</a>`;
/** A "Difficulty: Easy · Topics: Arrays" strip; a value may be HTML already (`html: true`). */
const factList = (pairs: Array<[string, string | undefined, { html?: boolean }?]>) =>
  `<ul class="facts">${pairs
    .filter((p): p is [string, string, { html?: boolean }?] => Boolean(p[1]))
    .map(([k, v, o]) => `<li><strong>${h(k)}:</strong> ${o?.html ? v : h(v)}</li>`)
    .join("")}</ul>`;
const section = (title: string, html: string, id?: string) => (html.trim() ? `<section${id ? ` id="${h(id)}"` : ""}><h2>${h(title)}</h2>${html}</section>` : "");
const linkList = (items: Array<{ href: string; label: string; note?: string }>) =>
  `<ul>${items.map((it) => `<li>${link(it.href, it.label)}${it.note ? ` <span class="note">${h(it.note)}</span>` : ""}</li>`).join("")}</ul>`;
const codeBlock = (lang: string, code: string) => `<pre><code class="language-${h(lang)}">${h(code)}</code></pre>`;
/** One line of Markdown (`code`, **bold**) as inline HTML — an option, a question, an answer. */
const inlineMd = (s: string) => markdownToHtml(s, 1_000).replace(/^<p>|<\/p>$/g, "");
/** "305 easy · 271 medium · 22 hard" */
const difficultySplit = (counts: Record<string, number>) =>
  ["EASY", "MEDIUM", "HARD"]
    .map((d) => [d, counts[d] ?? counts[d.toLowerCase()] ?? 0] as const)
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${n} ${d.toLowerCase()}`)
    .join(" · ");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * A walkthrough as a crawler reads it: the last frame drawn (the answer, as
 * a static SVG) and every step's sentence in order — the same words the
 * page's figure plays (lib/walkthroughs).
 */
const walkthroughHtml = (w: Walkthrough) =>
  `<figure>${frameSvg(w, w.frames[w.frames.length - 1], `${w.title}: the finished state`).replace("<svg ", '<svg style="max-width:100%;height:auto" ')}<figcaption>${h(w.title)}. Example: <code>${h(w.input)}</code></figcaption></figure>` +
  `<ol>${w.frames.map((f) => `<li>${h(f.caption)}</li>`).join("")}</ol>`;

const HOME: Crumb = { name: "Home", path: "/" };
const SECTION = {
  challenges: { name: "Coding problems", path: "/challenges" },
  bugHunts: { name: "Bug hunts", path: "/bug-hunts" },
  studyPlans: { name: "Study plans", path: "/study-plans" },
  aptitude: { name: "Aptitude", path: "/aptitude" },
  tests: { name: "Placement tests", path: "/tests" },
  skillTests: { name: "Skill tests", path: "/skill-tests" },
  roadmap: { name: "DSA roadmap", path: "/roadmap" },
} as const;

const HEAD_TTL_MS = 60 * 60 * 1000;

/* ── The lookup ──────────────────────────────────────────────────── */

/**
 * The head for one public URL; a redirect when the address has moved (a
 * bug hunt's id, now that it has a slug); null when nothing lives there —
 * the Worker then serves a real 404 rather than a page claiming a problem
 * that does not exist. Only the shapes the SPA's PUBLIC_APP_ROUTES declares
 * are answered; anything else is null too.
 */
export async function headFor(path: string): Promise<PageHead | PageRedirect | null> {
  const head = await pageHead(path);
  if (!head || "redirect" in head) return head;
  const card = contentCardFor(path, head);
  return card ? { ...head, image: contentCardImage(path, head.title) } : head;
}

/* ── Link-preview cards ──────────────────────────────────────────── */

/**
 * The preview card a content page shares with (lib/content-card), built
 * from the head the page already has, so the picture says what the page
 * says. Null for anything that is not a problem, bug hunt, lesson, aptitude
 * question or test pattern — those keep the site's own card.
 */
export function contentCardFor(path: string, head: PageHead): ContentCard | null {
  const f = head.facts ?? {};
  const name = head.crumb ?? head.title;
  let m: RegExpExecArray | null;
  if (/^\/problems\/[a-z0-9-]+$/.test(path)) {
    const difficulty = f.difficulty ?? "";
    return {
      kind: "problem",
      label: "Coding problem",
      eyebrow: [difficulty, ...(f.keywords ?? []).slice(0, 2)].filter(Boolean).join(" · "),
      title: name,
      facts: [
        { value: difficulty || "Any level", unit: "difficulty" },
        { value: "13", unit: "languages" },
        { value: "Editorial", unit: "and solutions" },
      ],
    };
  }
  if ((m = /^\/bug-hunts\/([a-z0-9-]+)$/.exec(path)) && !bugHub(m[1])) {
    return {
      kind: "bug",
      label: "Bug hunt",
      eyebrow: [f.language, f.difficulty].filter(Boolean).join(" · "),
      title: name,
      facts: [
        { value: f.language ?? "Real", unit: "codebase" },
        { value: f.difficulty ?? "Any level", unit: "difficulty" },
        { value: "Hidden", unit: "tests" },
      ],
    };
  }
  if (/^\/study-plans\/[a-z0-9-]+\/[a-z0-9-]+$/.test(path)) {
    return {
      kind: "lesson",
      label: `${f.language ?? "Study"} ${f.checkpoint ? "checkpoint" : "lesson"}`,
      eyebrow: `${f.language ?? ""} study plan`.trim(),
      // The lesson's search title (what its <title> leads with), not the
      // heading written for a reader already on the page.
      title: head.title.replace(/\s+—\s+CodeKairo$/, ""),
      facts: [
        { value: f.minutes ? `${f.minutes} min` : "Short", unit: "read" },
        { value: f.checkpoint ? "Graded" : "Exercises", unit: f.checkpoint ? "checkpoint" : "judged" },
        { value: "Free", unit: "course" },
      ],
    };
  }
  if (/^\/roadmap\/(?!certificate$)[a-z0-9-]+$/.test(path)) {
    return {
      kind: "lesson",
      label: "DSA tutorial",
      eyebrow: "DSA roadmap",
      // The lesson's search title, as its <title> leads with it.
      title: head.title.replace(/\s+—\s+CodeKairo$/, ""),
      facts: [
        { value: f.minutes ? `${f.minutes} min` : "Short", unit: "read" },
        { value: "4", unit: "languages" },
        { value: f.level ?? "Free", unit: f.level ? "level" : "tutorial" },
      ],
    };
  }
  if (/^\/aptitude\/q\/[a-z0-9-]+$/.test(path)) {
    return {
      kind: "aptitude",
      label: "Aptitude question",
      eyebrow: f.topic ?? "Aptitude",
      title: name,
      facts: [
        { value: f.difficulty ?? "Any level", unit: "difficulty" },
        { value: f.minutes ? `${Math.round(f.minutes * 60)} s` : "Timed", unit: "time target" },
        { value: "Worked", unit: "solution" },
      ],
    };
  }
  if ((m = /^\/challenges\/(company\/)?[a-z0-9-]+$/.exec(path))) {
    return {
      kind: "problem",
      label: m[1] ? "Company questions" : "Topic",
      eyebrow: "Coding problems",
      title: name,
      facts: [
        { value: f.count ? String(f.count) : "Many", unit: "problems" },
        { value: "13", unit: "languages" },
        { value: "Editorials", unit: "and solutions" },
      ],
    };
  }
  if ((m = /^\/bug-hunts\/([a-z0-9-]+)$/.exec(path)) && bugHub(m[1])) {
    return {
      kind: "bug",
      label: "Bug hunts",
      eyebrow: "Debugging practice",
      title: name,
      facts: [
        { value: f.count ? String(f.count) : "Many", unit: "hunts" },
        { value: "Real", unit: "codebases" },
        { value: "Hidden", unit: "tests" },
      ],
    };
  }
  if (/^\/aptitude\/[a-z0-9-]+$/.test(path)) {
    return {
      kind: "aptitude",
      label: "Aptitude",
      eyebrow: "Placement aptitude",
      title: name,
      facts: [
        { value: f.count ? String(f.count) : "Many", unit: "questions" },
        { value: "Worked", unit: "solutions" },
        { value: "Free", unit: "practice" },
      ],
    };
  }
  if (/^\/skill-tests\/[a-z0-9-]+$/.test(path)) {
    return {
      kind: "test",
      label: "Skill test",
      eyebrow: "Certification",
      title: name,
      facts: [
        { value: f.minutes ? `${f.minutes} min` : "Timed", unit: "test" },
        { value: f.questions ? String(f.questions) : "Mixed", unit: "questions" },
        { value: "Verifiable", unit: "credential" },
      ],
    };
  }
  if (/^\/tests\/[a-z0-9-]+$/.test(path)) {
    return {
      kind: "test",
      label: "Placement mock test",
      eyebrow: f.company ? `${f.company} pattern` : "Company pattern",
      title: name,
      facts: [
        { value: f.minutes ? `${f.minutes} min` : "Timed", unit: "full length" },
        { value: f.questions ? String(f.questions) : "Mixed", unit: "questions" },
        { value: "Full", unit: "review" },
      ],
    };
  }
  return null;
}

/**
 * The card's address: the path, the design, and a hash of the page's title.
 * Without the hash a retitled page kept its old picture on every platform
 * that had cached the URL (2026-10-01 audit); the title is what the card
 * draws, so a new title is a new address. The SPA's runtime head builds the
 * same string (src/lib/content-card.ts `titleKey` is this function).
 */
export const cardTitleKey = (title: string): string => {
  let h = 0x811c9dc5;
  const t = title.replace(/\s+—\s+CodeKairo$/, "");
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
};
export const contentCardUrl = (path: string, title: string): string =>
  `${API_ORIGIN}/api/seo/card.png?path=${encodeURIComponent(path)}&d=${CONTENT_CARD_DESIGN}&v=${cardTitleKey(title)}`;

/** The alt is the page's title with the brand once — what the SPA's lib/content-card writes too. */
function contentCardImage(path: string, title: string): NonNullable<PageHead["image"]> {
  return { url: contentCardUrl(path, title), width: CONTENT_CARD_WIDTH, height: CONTENT_CARD_HEIGHT, alt: `${title.replace(/\s+—\s+CodeKairo$/, "")} — ${BRAND}` };
}

/** The PNG for GET /api/seo/card.png, or null when the path has no card. */
export async function contentCardImageFor(path: string): Promise<Buffer | null> {
  const head = await pageHead(path);
  if (!head || "redirect" in head) return null;
  const card = contentCardFor(path, head);
  return card ? contentCardPng(JSON.stringify(card), card) : null;
}

async function pageHead(path: string): Promise<PageHead | PageRedirect | null> {
  let m: RegExpExecArray | null;
  if (path === "/challenges") return challengesIndex();
  if ((m = /^\/challenges\/company\/([a-z0-9-]+)$/.exec(path))) {
    // A renamed company's old hub (Facebook → Meta, lib/companies COMPANY_RENAMED) moves for good.
    const moved = renamedCompanyHubSlug(m[1]);
    return moved ? { redirect: `/challenges/company/${moved}` } : hubHead("company", m[1]);
  }
  if ((m = /^\/challenges\/([a-z0-9-]+)$/.exec(path))) return hubHead("topic", m[1]);
  if ((m = /^\/problems\/([a-z0-9][a-z0-9-]*)$/.exec(path))) return problemHead(m[1]);
  if (path === "/bug-hunts") return bugHuntsIndex();
  if ((m = /^\/bug-hunts\/([a-z0-9][a-z0-9-]*)$/.exec(path))) return bugHub(m[1]) ? bugHubHead(m[1]) : bugHuntHead(m[1]);
  if (path === "/study-plans") return studyPlansIndex();
  if ((m = /^\/study-plans\/([a-z0-9-]+)$/.exec(path))) return trackHead(m[1]);
  if ((m = /^\/study-plans\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path))) {
    if (m[2] === "certificate" || m[2] === "m") return null;
    return lessonHead(m[1], m[2]);
  }
  if (path === "/aptitude") return aptitudeIndex();
  if ((m = /^\/aptitude\/q\/([a-z0-9-]+)$/.exec(path))) return aptitudeQuestionHead(m[1]);
  if ((m = /^\/aptitude\/([a-z0-9-]+)$/.exec(path))) return aptitudeCategory(m[1]) ? aptitudeCategoryHead(m[1]) : aptitudeTopicHead(m[1]);
  if (path === "/tests") return testsIndex();
  if ((m = /^\/tests\/([a-z0-9-]+)$/.exec(path))) {
    if (m[1] === "attempt" || m[1] === "result") return null;
    return testHead(m[1]);
  }
  if (path === "/skill-tests") return skillTestsIndex();
  if ((m = /^\/skill-tests\/([a-z0-9-]+)$/.exec(path))) {
    if (m[1] === "attempt" || m[1] === "result") return null;
    return skillTestHead(m[1]);
  }
  if ((m = /^\/verify\/([a-z0-9-]{8,12})$/.exec(path))) return credentialHead(m[1]);
  if (path === "/roadmap") return roadmapIndex();
  if ((m = /^\/roadmap\/([a-z0-9][a-z0-9-]*)$/.exec(path))) return RESERVED_LESSON_SLUGS.has(m[1]) ? null : roadmapLessonHead(m[1]);
  if ((m = /^\/share\/([a-z0-9]{10,40})$/.exec(path))) return shareHead(m[1]);
  return null;
}

/* ── A shared win ─────────────────────────────────────────────────── */

/** Where the API answers from the outside: the preview image's absolute address. */
const API_ORIGIN = (process.env["BACKEND_PUBLIC_URL"] ?? "https://api.codekairo.com").replace(/\/+$/, "");

/**
 * /share/<id> — one person's win, as the page a LinkedIn, WhatsApp or X post
 * links to. What matters here is the preview: its image is the card the
 * author made (services/share-cards.ts), so the platforms draw the picture
 * themselves when the link is posted — none of them accept a file through a
 * share link. The page is noindex (the route table says so): it exists to be
 * shared, not searched.
 */
async function shareHead(id: string): Promise<PageHead | null> {
  const card = await getShareCard(id);
  if (!card) return null;
  const who = card.user.name || card.user.username || "A CodeKairo coder";
  const level = card.difficulty ? `${card.difficulty.charAt(0).toUpperCase()}${card.difficulty.slice(1)} ` : "";
  const what =
    card.kind === "roadmap"
      ? `cleared the ${card.title} tier of the DSA roadmap`
      : card.kind === "bug"
        ? `fixed the ${level.toLowerCase()}bug hunt "${card.title}"`
        : `solved ${card.title}`;
  const title = `${who} ${what} on ${BRAND}`;
  const target =
    card.kind === "problem" && card.slug
      ? { href: `/problems/${card.slug}`, label: `Solve ${card.title}` }
      : card.kind === "bug" && card.challengeId
        ? { href: bugPath({ id: card.challengeId, slug: null }), label: `Fix ${card.title}` }
        : { href: "/roadmap", label: "Walk the DSA roadmap" };
  const description =
    card.kind === "roadmap"
      ? `${who} opened a chest on CodeKairo's DSA roadmap. Practise problems in 13 languages, clear the road, and share your own wins.`
      : `${who} ${card.kind === "bug" ? "fixed" : "solved"} ${card.title}${level ? ` (${level.trim()})` : ""}${card.xp ? ` for +${card.xp} XP` : ""}. Try it yourself on CodeKairo — free coding practice in 13 languages.`;
  return {
    path: `/share/${id}`,
    title,
    description,
    crumb: "Shared win",
    image: { url: `${API_ORIGIN}/api/share-cards/${id}/image.jpg`, width: CARD_WIDTH, height: CARD_HEIGHT, alt: title },
    content: `<p>${h(description)}</p><p><a href="${h(target.href)}">${h(target.label)}</a> · <a href="/register">Join CodeKairo</a></p>`,
  };
}

/* ── Coding problems ─────────────────────────────────────────────── */

const hubPath = (hub: { kind: "topic" | "company"; slug: string }) => (hub.kind === "topic" ? `/challenges/${hub.slug}` : `/challenges/company/${hub.slug}`);
const hubLinks = (hubs: HubSummary[]) => hubs.map((x) => link(hubPath(x), x.label)).join(", ");
const problemRow = (p: { slug: string; title: string; difficulty: string }) => ({ href: `/problems/${p.slug}`, label: p.title, note: titleCase(p.difficulty) });

/** The two reference solutions a search most often asks for, then the rest by name. */
const SHOWN_SOLUTIONS: Array<[key: string, label: string, lang: string]> = [
  ["python", "Python", "python"],
  ["javascript", "JavaScript", "javascript"],
];
const SOLUTION_NAMES: Record<string, string> = {
  c: "C", cpp: "C++", csharp: "C#", go: "Go", java: "Java", javascript: "JavaScript", kotlin: "Kotlin", php: "PHP",
  python: "Python", ruby: "Ruby", rust: "Rust", swift: "Swift", typescript: "TypeScript",
};

function problemHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:problem:v3:${slug}`, HEAD_TTL_MS, async () => {
    const p = await prisma.problem.findFirst({
      where: { slug, isPublished: true },
      select: { title: true, difficulty: true, description: true, tags: true, editorial: true, solutions: true, timeLimitMs: true, memoryLimitMb: true },
    });
    if (!p) return null;
    const difficulty = titleCase(p.difficulty);
    const tags = asStrings(p.tags);
    const topics = tags.filter((t) => !isCompanyTag(t));
    const [hubs, related] = await Promise.all([hubsForTags(tags), relatedProblems(slug, tags, p.difficulty)]);
    const lessons = await lessonsForTopics(hubs.topics.map((t) => t.slug));
    const primary = hubs.topics[0];
    const trail: Crumb[] = [HOME, SECTION.challenges, ...(primary ? [{ name: primary.label, path: hubPath(primary) }] : []), { name: p.title, path: `/problems/${slug}` }];

    // The reference solutions: Python and JavaScript in full (what "two sum
    // python solution" is looking for), the other languages named. All 13
    // are on the page's Editorial tab for a visitor.
    const solutions = (p.solutions && typeof p.solutions === "object" ? (p.solutions as Record<string, unknown>) : {}) as Record<string, unknown>;
    const shown = SHOWN_SOLUTIONS.filter(([k]) => typeof solutions[k] === "string" && (solutions[k] as string).trim());
    const others = Object.keys(solutions)
      .filter((k) => typeof solutions[k] === "string" && !shown.some(([s]) => s === k))
      .map((k) => SOLUTION_NAMES[k] ?? k)
      .sort();
    const solutionHtml = shown.map(([k, label, lang]) => `<h3>${h(label)}</h3>${codeBlock(lang, solutions[k] as string)}`).join("") +
      (others.length ? `<p>Also on the editorial tab: ${h(others.join(", "))}.</p>` : "");

    // The statement, the editorial (its own headings — approach, why it
    // works, complexity, pitfalls — arrive one level down from
    // markdownToHtml), the solutions, and where to go next. Not the hints:
    // the page opens them one at a time.
    const content =
      factList([
        ["Difficulty", difficulty],
        ["Topics", hubs.topics.length ? hubLinks(hubs.topics) : topics.join(", ") || undefined, { html: hubs.topics.length > 0 }],
        ["Asked at", hubs.companies.length ? hubLinks(hubs.companies) : undefined, { html: true }],
        ["Time limit", `${p.timeLimitMs / 1000} s`],
        ["Memory limit", `${p.memoryLimitMb} MB`],
        ["Languages", LANGUAGE_LIST],
      ]) +
      section("Problem statement", markdownToHtml(p.description, 24_000, { under: 2 }), "statement") +
      (p.editorial ? section(`How to solve ${p.title}`, markdownToHtml(p.editorial, 12_000, { under: 2 }), "editorial") : "") +
      (solutionHtml ? section("Reference solution", solutionHtml, "solution") : "") +
      (related.length ? section(primary ? `More ${primary.label.toLowerCase()} problems` : "Related problems", linkList(related.map(problemRow)), "related") : "") +
      (primary ? `<p>${link(hubPath(primary), `All ${primary.count} ${primary.label.toLowerCase()} problems`)} · ${link("/challenges", "the whole catalogue")}</p>` : "") +
      (lessons.length ? `<p>Learn the technique: ${lessons.map((l) => link(`/roadmap/${l.slug}`, l.title)).join(" · ")}</p>` : "");
    const canonical = problemCanonicalSlug(slug);
    // Look-alike problems open with the same sentence (the stock-trading
    // series, three sentence-counting ones): such a description is led by
    // the title, as an aptitude question's is (2026-10-01: 7 groups shared one).
    const plain = summarise(p.description, `${p.title}: a ${difficulty.toLowerCase()} coding problem on ${BRAND}, judged by hidden tests in 13 languages.`);
    const shared = (await sharedProblemDescriptions()).has(plain);
    return {
      path: `/problems/${slug}`,
      title: titles.problem(p.title, difficulty),
      description: shared ? `${p.title}: ${summarise(p.description, "", Math.max(60, DESCRIPTION_MAX - p.title.length - 2))}` : plain,
      facts: { difficulty, keywords: topics, trail },
      content,
      crumb: p.title,
      ...(canonical !== slug ? { canonical: `/problems/${canonical}` } : {}),
    };
  });
}

/**
 * The descriptions two or more published problems would share — the first
 * sentence of a series' statements — computed once over the catalogue.
 */
function sharedProblemDescriptions(): Promise<Set<string>> {
  return cached("seo:problem-descriptions:v1", HEAD_TTL_MS, async () => {
    const rows = await prisma.problem.findMany({ where: { isPublished: true }, select: { description: true } });
    const seen = new Map<string, number>();
    for (const r of rows) {
      const d = summarise(r.description);
      seen.set(d, (seen.get(d) ?? 0) + 1);
    }
    return new Set([...seen].filter(([, n]) => n > 1).map(([d]) => d));
  });
}

/** "4-week study plan" for a plan in weeks, "study plan" for one in a single stage — the company hub's description. */
const companyPlanSpan = (stages: ReadonlyArray<{ problems: unknown[] }>) => {
  const weeks = stages.filter((s) => s.problems.length > 0).length;
  return weeks > 1 ? `${weeks}-week study plan` : "study plan";
};

/** A topic or company hub: its introduction, its difficulty split, every problem, the other hubs. */
async function hubHead(kind: "topic" | "company", slug: string): Promise<PageHead | null> {
  const page = await hubPage(kind, slug);
  if (!page) return null;
  const path = kind === "topic" ? `/challenges/${slug}` : `/challenges/company/${slug}`;
  const noun = kind === "topic" ? `${page.label.toLowerCase()} problems` : `problems tagged ${page.label}`;
  const trail: Crumb[] = [HOME, SECTION.challenges, { name: page.label, path }];
  const byLevel = (level: string) => page.problems.filter((p) => p.difficulty.toUpperCase() === level);
  const levels = (["EASY", "MEDIUM", "HARD"] as const).map((level) => {
    const rows = byLevel(level);
    return rows.length ? `<h3>${h(titleCase(level))} (${rows.length})</h3>${linkList(rows.map((p) => ({ href: `/problems/${p.slug}`, label: p.title, note: p.topics.filter((t) => t !== page.tag).slice(0, 3).join(", ") })))}` : "";
  });
  const w = page.walkthrough;
  const walkthrough = w ? section(`How ${page.label.toLowerCase()} works, step by step`, walkthroughHtml(w), "walkthrough") : "";
  // The tutorial that teaches this topic on the road (lib/roadmap-lessons),
  // linked first: the hub is where it is practised, the lesson where it is learnt.
  const lesson = page.lesson ? `<p>New to ${h(page.label.toLowerCase())}? ${link(`/roadmap/${page.lesson.slug}`, `Read the ${page.lesson.title} tutorial`)} first.</p>` : "";
  const plan = section(
    kind === "topic" ? `${page.label} study plan` : `${page.label} study plan by topic`,
    `<p>${h(page.plan.summary)}</p>` +
      page.plan.stages
        .map(
          (s) =>
            `<h3>${h(s.title)}</h3><p>${h(s.note)}</p>` +
            (s.problems.length ? linkList(s.problems.map((p) => ({ href: `/problems/${p.slug}`, label: p.title, note: titleCase(p.difficulty) }))) : "") +
            (s.link ? `<p>${link(s.link.href, s.link.label)}</p>` : ""),
        )
        .join(""),
    "study-plan",
  );
  const links = page.links.length
    ? section(
        kind === "topic" ? `Companies that ask ${page.label.toLowerCase()} problems` : `Topics ${page.label} asks most`,
        linkList(page.links.map((l) => ({ href: hubPath(l), label: l.label, note: `${plural(l.count, "problem")}${kind === "topic" ? ` on ${page.label.toLowerCase()}` : ""}` }))),
        kind === "topic" ? "companies" : "topics",
      )
    : "";
  const content =
    factList([
      ["Problems", String(page.count)],
      ["By difficulty", difficultySplit(page.byDifficulty)],
      ["Languages", LANGUAGE_LIST],
      ["Cost", "Free on every plan; sign in to run and submit"],
    ]) +
    `<p>${h(page.blurb)}</p>` +
    lesson +
    walkthrough +
    plan +
    // The technique on one sheet (lib/topic-essentials): when to reach for
    // it, the pattern, its cost and its traps — a hub was one paragraph over
    // a list until 2026-10-01 (19% of the page its own text).
    (page.essentials ? section(`${page.label}: the essentials`, markdownToHtml(page.essentials, 8_000, { under: 2 }), "essentials") : "") +
    (page.patterns.length
      ? section(`${page.label} test patterns`, linkList(page.patterns.map((t) => ({ href: `/tests/${t.slug}`, label: t.name, note: "pattern guide and timed mock" }))), "patterns")
      : "") +
    section(`All ${noun}`, levels.join(""), "problems") +
    links +
    (page.related.length ? section(kind === "topic" ? "Other topics" : "Other companies", linkList(page.related.map((r) => ({ href: hubPath(r), label: r.label, note: plural(r.count, "problem") }))), "related") : "") +
    (page.next ? `<p>Next topic: ${link(hubPath(page.next), page.next.label)}</p>` : "");
  return {
    path,
    ...(page.indexed ? {} : { noindex: true }),
    title: kind === "topic" ? titles.topicHub(page.label, page.count) : titles.companyHub(page.label, page.count),
    // Composed descriptions go through summarise() for its 158-character
    // cap, which drops whole trailing sentences — so each puts what the
    // page is first and the lines it can lose last (2026-09-30: 90 of 91
    // hubs and every test pattern ran past 160 and were cut mid-sentence).
    description: summarise(
      // What the page is first; the walkthrough and the plan in a second
      // sentence the cap may drop whole for a long name (mirrored in the
      // SPA's ChallengeHubPage).
      kind === "topic"
        ? `${plural(page.count, `${page.label.toLowerCase()} coding problem`)} — ${difficultySplit(page.byDifficulty)} — with solutions in 13 languages. Plus a step-by-step walkthrough and a ${page.plan.stages.length}-day plan.`
        : `${plural(page.count, "coding problem")} tagged ${page.label} — ${difficultySplit(page.byDifficulty)} — with solutions in 13 languages. Plus a ${companyPlanSpan(page.plan.stages)} by topic.`,
    ),
    facts: {
      topic: page.label,
      count: page.count,
      keywords: kind === "topic" ? [page.label] : undefined,
      company: kind === "company" ? page.label : undefined,
      // In the page's order: easy, then medium, then hard.
      items: firstItems((["EASY", "MEDIUM", "HARD"] as const).flatMap((level) => byLevel(level)).map((p) => ({ name: p.title, path: `/problems/${p.slug}` }))),
      trail,
    },
    content,
    crumb: page.label,
  };
}

/** The catalogue index's child list: every topic hub and company hub, with counts. */
async function challengesIndex(): Promise<PageHead> {
  const [index, catalogue] = await Promise.all([hubIndex(), getCatalogue()]);
  const total = catalogue.length;
  const content =
    section("Browse by topic", linkList(index.topics.map((t) => ({ href: hubPath(t), label: t.label, note: `${t.count} problems · ${difficultySplit(t.byDifficulty)}` }))), "topics") +
    section("Browse by company", linkList(index.companies.map((c) => ({ href: hubPath(c), label: c.label, note: `${c.count} problems` }))), "companies") +
    `<p>${plural(total, "problem")} in the catalogue. ${link("/roadmap", "The DSA roadmap")} orders about 150 of them into 19 stages; ${link("/contests", "the daily contest")} picks one a day.</p>`;
  return { path: "/challenges", title: "Coding problems", description: "", content, section: "index" };
}

/* ── Bug hunts ───────────────────────────────────────────────────── */

const FILE_CHARS = 6_000;

function bugHuntHead(idOrSlug: string): Promise<PageHead | PageRedirect | null> {
  return cached(`seo:head:bug:v2:${idOrSlug}`, HEAD_TTL_MS, async () => {
    const b = await prisma.bugChallenge.findFirst({
      where: { isPublished: true, OR: [{ slug: idOrSlug }, { id: idOrSlug }] },
      select: {
        id: true, slug: true, title: true, language: true, bugReport: true, description: true, logs: true, difficulty: true, category: true, tags: true, origin: true,
        files: { select: { filePath: true, content: true, isEditable: true, language: true }, orderBy: { filePath: "asc" } },
        tests: { where: { isHidden: false }, select: { name: true } },
      },
    });
    if (!b) return null;
    // A link minted before slugs existed: send the crawler to the one address.
    if (b.slug && b.slug !== idOrSlug) return { redirect: `/bug-hunts/${b.slug}` };
    const path = bugPath(b);
    const language = languageName(b.language);
    const difficulty = titleCase(b.difficulty);
    const langHub = BUG_HUBS.find((x) => x.kind === "language" && x.value === b.language.toLowerCase());
    const catHub = BUG_HUBS.find((x) => x.kind === "category" && x.value === b.category.toLowerCase());
    const keywords = [b.category, ...asStrings(b.tags)].filter(Boolean);
    const trail: Crumb[] = [HOME, SECTION.bugHunts, ...(langHub ? [{ name: langHub.label, path: `/bug-hunts/${langHub.id}` }] : []), { name: b.title, path }];
    const editable = b.files.filter((f) => f.isEditable);
    const locked = b.files.filter((f) => !f.isEditable);
    // The project as shipped: the editable files in full (the code with the
    // bug in it — what the page's editor shows), the locked ones by name.
    // Not the tests' code and never the fix: the hidden tests are the judge.
    const filesHtml =
      editable.map((f) => `<h3>${h(f.filePath)} <span class="note">(editable)</span></h3>${codeBlock(f.language, f.content.length > FILE_CHARS ? `${f.content.slice(0, FILE_CHARS)}\n…` : f.content)}`).join("") +
      (locked.length ? `<p>Read-only context: ${h(locked.map((f) => f.filePath).join(", "))}.</p>` : "");
    const content =
      factList([
        ["Language", langHub ? link(`/bug-hunts/${langHub.id}`, language) : language, { html: Boolean(langHub) }],
        ["Layer", catHub ? link(`/bug-hunts/${catHub.id}`, catHub.label) : titleCase(b.category), { html: Boolean(catHub) }],
        ["Difficulty", difficulty],
        ["Concepts", asStrings(b.tags).join(", ") || undefined],
        ["Modelled on", b.origin ?? undefined],
        ["Visible tests", b.tests.length ? b.tests.map((t) => t.name).join("; ") : undefined],
        ["Reward", "50 XP for a complete fix"],
      ]) +
      section("Briefing", markdownToHtml(b.description), "briefing") +
      section("Bug report", markdownToHtml(b.bugReport), "report") +
      (b.logs ? section("Logs", codeBlock("text", b.logs), "logs") : "") +
      section("The code as shipped", filesHtml, "files") +
      `<p>Open the hunt to edit the files, run the visible tests and submit against the hidden ones.${langHub ? ` ${link(`/bug-hunts/${langHub.id}`, `More ${language} bug hunts`)}.` : ""}</p>`;
    return {
      path,
      title: titles.bugHunt(b.title, language),
      // The briefing, not the bug report: every report opens with its ticket
      // header ("BUG-2107 · Priority: Critical · Reported by: …"), and cut
      // at 160 characters that header was the whole search snippet (2026-09-30).
      description: summarise(b.description || b.bugReport, `${b.title}: a debugging challenge on real ${language} code — read the bug report, find the bug, fix it and pass the hidden tests.`),
      facts: { difficulty, language, keywords, trail },
      content,
      crumb: b.title,
    };
  });
}

async function bugHubHead(id: string): Promise<PageHead | null> {
  const page = await bugHubPage(id);
  if (!page) return null;
  const path = `/bug-hunts/${id}`;
  const trail: Crumb[] = [HOME, SECTION.bugHunts, { name: page.label, path }];
  const rows = page.hunts.map((x) => ({
    href: bugPath(x),
    label: x.title,
    note: [titleCase(x.difficulty), page.kind === "language" ? titleCase(x.category) : languageName(x.language), ...x.tags.slice(0, 2)].join(" · "),
  }));
  const content =
    factList([
      ["Hunts", String(page.count)],
      ["By difficulty", difficultySplit(page.byDifficulty)],
      ["Reward", "50 XP per complete fix"],
    ]) +
    `<p>${h(page.blurb)}</p>` +
    section(`Every ${page.noun.replace(/ bug hunts$/, "")} bug hunt`, linkList(rows), "hunts") +
    section("Browse by", linkList(page.related.map((r) => ({ href: `/bug-hunts/${r.id}`, label: r.label, note: `${r.count} hunts` }))), "related");
  return {
    path,
    title: titles.bugHub(page.label, page.count, page.kind),
    description: summarise(`${page.count} ${page.noun} — ${difficultySplit(page.byDifficulty)} — each a small project with a planted bug, a bug report and hidden tests that decide whether the fix is complete. Read any hunt free on ${BRAND}.`),
    facts: {
      language: page.kind === "language" ? page.label : undefined,
      topic: page.kind === "category" ? page.label : undefined,
      count: page.count,
      items: firstItems(page.hunts.map((x) => ({ name: x.title, path: bugPath(x) }))),
      trail,
    },
    content,
    crumb: page.label,
  };
}

/** The bug hunts index's child list: the hubs, then every hunt by language. */
async function bugHuntsIndex(): Promise<PageHead> {
  const index = await bugHubIndex();
  const pages = await Promise.all(index.languages.map((l) => bugHubPage(l.id)));
  const byLanguage = pages
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => `<h3>${link(`/bug-hunts/${p.id}`, p.label)} (${p.count})</h3>${linkList(p.hunts.map((x) => ({ href: bugPath(x), label: x.title, note: `${titleCase(x.difficulty)} · ${titleCase(x.category)}` })))}`)
    .join("");
  const content =
    section("Browse by language", linkList(index.languages.map((l) => ({ href: `/bug-hunts/${l.id}`, label: l.label, note: `${l.count} hunts · ${difficultySplit(l.byDifficulty)}` }))), "languages") +
    section("Browse by layer", linkList(index.categories.map((c) => ({ href: `/bug-hunts/${c.id}`, label: c.label, note: `${c.count} hunts` }))), "categories") +
    section("Every bug hunt", byLanguage, "hunts");
  return { path: "/bug-hunts", title: "Bug hunts", description: "", content, section: "index" };
}

/* ── Study plans ─────────────────────────────────────────────────── */

async function trackHead(key: string): Promise<PageHead | null> {
  const track = await trackDefinition(key);
  if (!track) return null;
  const path = `/study-plans/${key}`;
  const lessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
  const minutes = track.modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.minutes, 0), 0);
  const trail: Crumb[] = [HOME, SECTION.studyPlans, { name: track.title, path }];
  // Every module and every lesson as a link: the crawl path into the
  // track, and the syllabus a reader would want anyway.
  const modules = track.modules
    .map(
      (m, i) =>
        `<section id="${h(m.slug)}"><h3>Module ${i + 1}: ${h(m.title)}</h3><p>${h(m.blurb)}</p>${linkList(
          m.lessons.map((l) => ({ href: `/study-plans/${key}/${l.slug}`, label: `${l.title}${l.kind === "test" ? " (checkpoint)" : ""}`, note: `${l.minutes} min` })),
        )}</section>`,
    )
    .join("");
  const content =
    factList([
      ["Language", track.title],
      ["Runtime", track.runtime],
      ["Modules", String(track.modules.length)],
      ["Lessons", String(lessons)],
      ["Reading time", `about ${Math.round(minutes / 60)} hours`],
      ["Cost", "Free on every plan, with a certificate"],
    ]) +
    `<p>${h(track.blurb)}</p>` +
    section("Syllabus", modules, "syllabus");
  return {
    path,
    title: titles.studyTrack(track.title, lessons),
    description: trackDescription(track.title, track.modules.length, lessons, track.runtime),
    facts: { language: track.title, modules: track.modules.map((m) => m.title), lessons, minutes, trail },
    content,
    crumb: track.title,
  };
}

async function lessonHead(key: string, lessonSlug: string): Promise<PageHead | null> {
  const track = await trackDefinition(key);
  if (!track) return null;
  const mod = track.modules.find((m) => m.lessons.some((l) => l.slug === lessonSlug));
  const lesson = mod?.lessons.find((l) => l.slug === lessonSlug);
  if (!mod || !lesson) return null;
  const path = `/study-plans/${key}/${lessonSlug}`;
  const isTest = lesson.kind === "test";
  const seo = lesson.seo;
  const trail: Crumb[] = [HOME, SECTION.studyPlans, { name: `${track.title} study plan`, path: `/study-plans/${key}` }, { name: lesson.title, path }];
  // The reading and the exercise prompts — what a visitor sees on the page.
  // Solutions, hidden cases and quiz answers never leave the server; the
  // quiz prompts are left out too, so the page reads as a lesson rather
  // than a test paper.
  const exercises = lesson.exercises.map((x) => `<section><h3>${h(x.title)}</h3>${markdownToHtml(x.prompt, 4_000)}</section>`).join("");
  // The way on runs across module boundaries, as the page's own does
  // (services/study-plans lessonFor): a crawler can walk the whole track
  // lesson by lesson, not just the module it landed in.
  const flat = track.modules.flatMap((m) => m.lessons);
  const at = flat.findIndex((l) => l.slug === lessonSlug);
  const prev = flat[at - 1];
  const next = flat[at + 1];
  const siblings = mod.lessons.map((l) => ({ href: `/study-plans/${key}/${l.slug}`, label: `${l.title}${l.slug === lessonSlug ? " (this lesson)" : ""}` }));
  // The page's order: the direct answer under the heading, the contents,
  // the text with an anchor on every heading, the common questions, then
  // the exercises — the same blocks the SPA's StudyLessonPage draws.
  const outline = markdownOutline(lesson.body);
  const faq = seo?.faq ?? [];
  const content =
    factList([
      ["Course", link(`/study-plans/${key}`, `${track.title} study plan`), { html: true }],
      ["Module", mod.title],
      ["Kind", isTest ? "Checkpoint — cleared at 70%" : "Lesson"],
      ["Reading time", `${lesson.minutes} min`],
      ["Runtime", track.runtime],
    ]) +
    (seo?.question && seo.answer ? `<section id="answer"><h2>${inlineMd(seo.question)}</h2><p>${inlineMd(seo.answer)}</p></section>` : "") +
    (isTest ? `<p>${h(lesson.title)} is the checkpoint that closes the ${h(mod.title)} module: a graded quiz and whole-program exercises, passed at 70%.</p>` : "") +
    (outline.length > 1 ? `<nav id="contents" aria-label="On this page"><h2>On this page</h2>${linkList(outline.map((o) => ({ href: `#${o.id}`, label: o.text })))}</nav>` : "") +
    section(isTest ? "Instructions" : "Lesson", markdownToHtml(lesson.body, 24_000, { anchors: true }), "lesson") +
    (faq.length ? `<section id="questions"><h2>Common questions</h2>${faq.map((f) => `<h3>${inlineMd(f.q)}</h3><p>${inlineMd(f.a)}</p>`).join("")}</section>` : "") +
    section(lesson.exercises.length === 1 ? "Exercise" : "Exercises", exercises, "exercises") +
    section(`In this module: ${mod.title}`, linkList(siblings), "module") +
    `<p>${prev ? link(`/study-plans/${key}/${prev.slug}`, `← ${prev.title}`) : ""}${prev && next ? " · " : ""}${next ? link(`/study-plans/${key}/${next.slug}`, `${next.title} →`) : ""}</p>`;
  return {
    path,
    title: titles.studyLesson(lesson.title, track.title, isTest, seo?.title),
    description: seo?.description ?? summarise(lesson.body, `${lesson.title}: a ${track.title} lesson with exercises judged on ${track.runtime} and a graded quiz.`),
    facts: {
      minutes: lesson.minutes,
      checkpoint: isTest,
      language: track.title,
      track: { title: `${track.title} study plan`, path: `/study-plans/${key}` },
      ...lessonFaq(seo),
      trail,
    },
    content,
    crumb: lesson.title,
  };
}

/**
 * The questions a lesson page prints, in its order — the direct answer,
 * then the common questions — for the FAQ its structured data names. The
 * SPA's StudyLessonPage builds the same list from the same fields.
 */
export function lessonFaq(seo: LessonSeo | null): { faq?: Array<{ q: string; a: string }> } {
  if (!seo) return {};
  const faq = [...(seo.question && seo.answer ? [{ q: seo.question, a: seo.answer }] : []), ...seo.faq];
  return faq.length ? { faq } : {};
}

/**
 * The study plans index's child list: every language track, then the DSA
 * plans on the hub pages — one per topic, one per company (lib/hub-plans),
 * the page's two "DSA study plans" lists since 2026-10-01.
 */
async function studyPlansIndex(): Promise<PageHead> {
  const [tracks, hubs] = await Promise.all([trackList(), hubIndex()]);
  const content =
    section(
      "The tracks",
      linkList(tracks.map((t) => ({ href: `/study-plans/${t.key}`, label: `${t.title} study plan`, note: `${t.modules} modules · ${t.lessons} lessons · about ${Math.round(t.minutes / 60)} hours · ${t.runtime}` }))),
      "tracks",
    ) +
    section("DSA study plans by topic", linkList(hubs.topics.map((t) => ({ href: hubPath(t), label: t.label, note: plural(t.count, "problem") }))), "dsa-topics") +
    section(
      "DSA study plans by company",
      linkList(hubs.companies.filter((c) => c.indexed).map((c) => ({ href: hubPath(c), label: c.label, note: plural(c.count, "problem") }))),
      "dsa-companies",
    );
  return { path: "/study-plans", title: "Study plans", description: "", content, section: "index" };
}

/* ── Aptitude ────────────────────────────────────────────────────── */

/** Question counts per topic, from one grouped query, cached with the heads. */
function aptitudeCounts(): Promise<Map<string, { total: number; byDifficulty: Record<string, number> }>> {
  return cached("seo:aptitude:counts", HEAD_TTL_MS, async () => {
    const rows = await prisma.aptitudeQuestion.groupBy({ by: ["topic", "difficulty"], _count: { _all: true } });
    const out = new Map<string, { total: number; byDifficulty: Record<string, number> }>();
    for (const r of rows) {
      const entry = out.get(r.topic) ?? { total: 0, byDifficulty: {} };
      entry.total += r._count._all;
      entry.byDifficulty[r.difficulty.toUpperCase()] = (entry.byDifficulty[r.difficulty.toUpperCase()] ?? 0) + r._count._all;
      out.set(r.topic, entry);
    }
    return out;
  });
}

async function aptitudeCategoryHead(id: string): Promise<PageHead | null> {
  const category = aptitudeCategory(id);
  if (!category) return null;
  const counts = await aptitudeCounts();
  const topics = APTITUDE_TOPICS.filter((t) => t.category === category.id);
  const questions = topics.reduce((n, t) => n + (counts.get(t.id)?.total ?? 0), 0);
  const path = `/aptitude/${id}`;
  const trail: Crumb[] = [HOME, SECTION.aptitude, { name: category.label, path }];
  const content =
    factList([
      ["Topics", String(topics.length)],
      ["Questions", String(questions)],
      ["Cost", "Free, unlimited on every plan"],
    ]) +
    `<p>${h(category.blurb)}</p>` +
    // What this section of a placement paper asks and how to practise it
    // (lib/aptitude-section-guides) — a section hub was 62–116 words of its
    // own until 2026-10-01.
    (APTITUDE_SECTION_GUIDES[id] ? section(`${category.label} in placement papers`, markdownToHtml(APTITUDE_SECTION_GUIDES[id], 8_000, { under: 2 }), "guide") : "") +
    section(
      `${category.label} topics`,
      `<ul>${topics.map((t) => `<li>${link(`/aptitude/${t.id}`, t.label)} <span class="note">${counts.get(t.id)?.total ?? 0} questions</span> — ${h(t.blurb)}</li>`).join("")}</ul>`,
      "topics",
    ) +
    section("Other sections", linkList(APTITUDE_CATEGORIES.filter((c) => c.id !== id).map((c) => ({ href: `/aptitude/${c.id}`, label: c.label }))), "related");
  return {
    path,
    title: titles.aptitudeCategory(category.label, questions),
    description: summarise(`${questions} ${category.label.toLowerCase()} questions across ${topics.length} topics, each with a time target, hints, a worked solution and an approach note. ${category.blurb} Free on ${BRAND}.`),
    facts: { topic: category.label, count: questions, items: firstItems(topics.map((t) => ({ name: t.label, path: `/aptitude/${t.id}` }))), trail },
    content,
    crumb: category.label,
  };
}

function aptitudeTopicHead(topicId: string): Promise<PageHead | null> {
  const topic = aptitudeTopic(topicId);
  if (!topic) return Promise.resolve(null);
  return cached(`seo:head:aptitude-topic:v3:${topicId}`, HEAD_TTL_MS, async () => {
    // Every question of the topic as a link — the crawl path into the bank.
    const rows = await prisma.aptitudeQuestion.findMany({ where: { topic: topicId }, select: { slug: true, title: true, difficulty: true, prompt: true }, orderBy: { orderIndex: "asc" }, take: 500 });
    const category = aptitudeCategory(topic.category);
    const categoryLabel = category?.label ?? topic.category;
    const path = `/aptitude/${topicId}`;
    const trail: Crumb[] = [HOME, SECTION.aptitude, ...(category ? [{ name: category.label, path: `/aptitude/${category.id}` }] : []), { name: topic.label, path }];
    const byDifficulty: Record<string, number> = {};
    for (const r of rows) byDifficulty[r.difficulty.toUpperCase()] = (byDifficulty[r.difficulty.toUpperCase()] ?? 0) + 1;
    const siblings = APTITUDE_TOPICS.filter((t) => t.category === topic.category && t.id !== topicId);
    const content =
      factList([
        ["Section", category ? link(`/aptitude/${category.id}`, categoryLabel) : categoryLabel, { html: Boolean(category) }],
        ["Questions", String(rows.length)],
        ["By difficulty", difficultySplit(byDifficulty)],
        ["Cost", "Free, unlimited on every plan"],
      ]) +
      `<p>${h(topic.blurb)}</p>` +
      // The formulas, rules and method (lib/aptitude-essentials): what a search
      // for "<topic> formulas" wants, and until 2026-10-01 the page had only
      // the one-sentence blurb before its question list.
      (APTITUDE_ESSENTIALS[topicId] ? section(`${topic.label}: the essentials`, markdownToHtml(APTITUDE_ESSENTIALS[topicId], 8_000, { under: 2 }), "essentials") : "") +
      // Each question by its nickname and its stem — what a search for
      // "<topic> aptitude questions" expects a list of (2026-10-01 SXO audit:
      // the rows were nicknames alone). The answer stays on the question's page.
      section(
        "Questions",
        `<ol>${rows.map((r) => `<li>${link(`/aptitude/q/${r.slug}`, r.title)} <span class="note">${h(titleCase(r.difficulty))}</span><br>${h(questionStem(r.prompt))}</li>`).join("")}</ol>`,
        "questions",
      ) +
      (siblings.length ? section(`More ${categoryLabel.toLowerCase()} topics`, linkList(siblings.map((t) => ({ href: `/aptitude/${t.id}`, label: t.label }))), "related") : "");
    return {
      path,
      title: titles.aptitudeTopic(topic.label),
      description: summarise(`${rows.length} ${topic.label} questions with hints, worked solutions and time targets — ${difficultySplit(byDifficulty)}. ${topic.blurb} Free on ${BRAND}.`),
      facts: { topic: `${topic.label} (${categoryLabel})`, count: rows.length, items: firstItems(rows.map((r) => ({ name: r.title, path: `/aptitude/q/${r.slug}` }))), trail },
      content,
      crumb: topic.label,
    };
  });
}

function aptitudeQuestionHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:aptitude:v3:${slug}`, HEAD_TTL_MS, async () => {
    const q = await prisma.aptitudeQuestion.findUnique({
      where: { slug },
      select: { prompt: true, topic: true, category: true, title: true, options: true, answer: true, solution: true, approach: true, difficulty: true, timeTargetSec: true },
    });
    if (!q) return null;
    const topic = aptitudeTopic(q.topic);
    const label = topic?.label ?? q.topic;
    const category = aptitudeCategory(q.category);
    const difficulty = titleCase(q.difficulty);
    const path = `/aptitude/q/${slug}`;
    const trail: Crumb[] = [
      HOME,
      SECTION.aptitude,
      ...(category ? [{ name: category.label, path: `/aptitude/${category.id}` }] : []),
      { name: label, path: `/aptitude/${q.topic}` },
      { name: q.title, path },
    ];
    const options = asStrings(q.options);
    const letter = (i: number) => String.fromCharCode(65 + i);
    // The page's neighbours in topic order, the same six the API sends it.
    const order = await topicOrder(q.topic);
    const at = order.findIndex((s) => s.slug === slug);
    const start = Math.max(0, Math.min(at - 3, order.length - 7));
    const related = order.filter((s, i) => i >= start && i < start + 7 && s.slug !== slug).slice(0, 6);
    // The question and its options, then — behind a disclosure, as the page
    // shows it to a visitor — the correct option, the worked solution and
    // the idea it tests. A member sees these only after an attempt (the
    // API withholds them until one exists); the page is public, and a
    // question without its answer is not a page anyone searches for.
    const answerHtml =
      `<p><strong>Correct answer: ${letter(q.answer)}.</strong> ${options[q.answer] ? inlineMd(options[q.answer]) : ""}</p>` +
      `<h3>Worked solution</h3>${markdownToHtml(q.solution, 6_000)}` +
      `<h3>The idea</h3>${markdownToHtml(q.approach, 3_000)}`;
    const content =
      factList([
        ["Topic", link(`/aptitude/${q.topic}`, label), { html: true }],
        ["Section", category ? link(`/aptitude/${category.id}`, category.label) : undefined, { html: true }],
        ["Difficulty", difficulty],
        ["Time target", `${q.timeTargetSec} seconds`],
      ]) +
      section("Question", markdownToHtml(q.prompt, 6_000), "question") +
      section("Options", `<ol type="A">${options.map((o) => `<li>${inlineMd(o)}</li>`).join("")}</ol>`, "options") +
      `<details id="answer"><summary>Show the answer and the worked solution</summary>${answerHtml}</details>` +
      (related.length ? section(`More ${label} questions`, linkList(related.map((r) => ({ href: `/aptitude/q/${r.slug}`, label: r.title, note: titleCase(r.difficulty) }))), "related") : "") +
      `<p>${link(`/aptitude/${q.topic}`, `All ${label} questions`)} · ${link("/tests", "placement mock tests")}</p>`;
    const canonical = aptitudeCanonicalSlug(slug);
    return {
      path,
      title: titles.aptitudeQuestion(q.title, label),
      // The title leads the description: thirty sentence-correction
      // questions share the prompt "Choose the grammatically correct
      // sentence", and only the title tells their pages apart.
      // The prompt gets what the title and the closing line leave of 158.
      description: `${q.title}: ${summarise(q.prompt, `a ${label} aptitude question with a worked solution.`, Math.max(60, 115 - q.title.length))} Answer and worked solution on ${BRAND}.`,
      facts: { difficulty, topic: label, minutes: q.timeTargetSec / 60, options, answer: q.answer, question: questionStem(q.prompt, 500), trail },
      content,
      crumb: q.title,
      ...(canonical !== slug ? { canonical: `/aptitude/q/${canonical}` } : {}),
    };
  });
}

/** The aptitude index's child list: every section with its topics and counts. */
async function aptitudeIndex(): Promise<PageHead> {
  const counts = await aptitudeCounts();
  const sections = APTITUDE_CATEGORIES.map((c) => {
    const topics = APTITUDE_TOPICS.filter((t) => t.category === c.id);
    const n = topics.reduce((a, t) => a + (counts.get(t.id)?.total ?? 0), 0);
    return `<section><h3>${link(`/aptitude/${c.id}`, c.label)} <span class="note">${n} questions</span></h3><p>${h(c.blurb)}</p>${linkList(
      topics.map((t) => ({ href: `/aptitude/${t.id}`, label: t.label, note: `${counts.get(t.id)?.total ?? 0} questions` })),
    )}</section>`;
  }).join("");
  return { path: "/aptitude", title: "Aptitude", description: "", content: section("The syllabus", sections, "syllabus"), section: "index" };
}

/* ── Placement tests ─────────────────────────────────────────────── */

function testHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:test:v3:${slug}`, HEAD_TTL_MS, async () => {
    const t = await prisma.mockTest.findFirst({
      where: { slug, published: true },
      select: {
        name: true, company: true, blurb: true, instructions: true, durationSec: true, totalQuestions: true, negativeMark: true, sectionalTiming: true, highlights: true, sourceNote: true, family: true,
        sections: { orderBy: { orderIndex: "asc" }, select: { name: true, durationSec: true, questionCount: true, kind: true, marksPerQuestion: true } },
      },
    });
    if (!t) return null;
    const path = `/tests/${slug}`;
    const minutes = Math.round(t.durationSec / 60);
    const trail: Crumb[] = [HOME, SECTION.tests, { name: t.name, path }];
    const [others, samples] = await Promise.all([
      prisma.mockTest.findMany({ where: { published: true, family: t.family, NOT: { slug } }, select: { slug: true, name: true, company: true }, orderBy: { orderIndex: "asc" }, take: 8 }),
      testSamples(slug),
    ]);
    const letter = (i: number) => String.fromCharCode(65 + i);
    // A dozen questions of the paper's kind, each with its answer behind a
    // disclosure (services/test-samples) — the page draws the same list.
    const samplesHtml = samples
      .map(
        (q) =>
          `<section><h3>${link(`/aptitude/q/${q.slug}`, q.title)}</h3>${markdownToHtml(q.prompt, 3_000, { under: 3 })}<ol type="A">${q.options.map((o) => `<li>${inlineMd(o)}</li>`).join("")}</ol><details><summary>Show the answer</summary><p><strong>${letter(q.answer)}.</strong> ${q.options[q.answer] ? inlineMd(q.options[q.answer]) : ""} ${link(`/aptitude/q/${q.slug}`, "Worked solution")}</p></details></section>`,
      )
      .join("");
    const rows = t.sections
      .map((s) => `<tr><td>${h(s.name)}</td><td>${s.questionCount}</td><td>${Math.round(s.durationSec / 60)} min</td><td>${s.kind === "coding" ? "Coding" : "Multiple choice"}</td><td>${s.marksPerQuestion}</td></tr>`)
      .join("");
    const content =
      factList([
        ["Pattern", `${t.company}`],
        ["Duration", `${minutes} minutes`],
        ["Questions", String(t.totalQuestions)],
        ["Timing", t.sectionalTiming ? "Sectional — each section on its own clock" : "Free — move between sections until the paper's clock ends"],
        ["Negative marking", t.negativeMark > 0 ? `${t.negativeMark} marks per wrong answer` : "None"],
      ]) +
      `<p>${h(t.blurb)}</p>` +
      (asStrings(t.highlights).length ? `<ul>${asStrings(t.highlights).map((x) => `<li>${h(x)}</li>`).join("")}</ul>` : "") +
      section("Sections", `<table><thead><tr><th>Section</th><th>Questions</th><th>Time</th><th>Kind</th><th>Marks each</th></tr></thead><tbody>${rows}</tbody></table>`, "sections") +
      section("Instructions", markdownToHtml(t.instructions, 6_000), "instructions") +
      // The written preparation guide (lib/test-guides): what a search for
      // "<company> test pattern" is answered by — the results are guides, and
      // this page was a mock-test lobby of ~240 own words (2026-10-01).
      (TEST_GUIDES[slug] ? section("How to prepare for this pattern", markdownToHtml(TEST_GUIDES[slug], 12_000, { under: 2 }), "guide") : "") +
      (samplesHtml ? section("Sample questions", samplesHtml, "samples") : "") +
      (t.sourceNote ? section("About this pattern", `<p>${h(t.sourceNote)}</p>`, "source") : "") +
      `<p>Modelled on the published pattern; not affiliated with ${h(t.company)}. Every sitting draws a fresh paper from ${link("/aptitude", "the aptitude bank")}${t.sections.some((s) => s.kind === "coding") ? ` and ${link("/challenges", "the problem catalogue")}` : ""}.</p>` +
      (others.length ? section("Similar patterns", linkList(others.map((o) => ({ href: `/tests/${o.slug}`, label: o.name, note: o.company }))), "related") : "");
    return {
      path,
      title: titles.test(t.name, t.company),
      // What the page is first; the pattern's blurb (its rules) where it fits.
      // The test's name and its sections lead: the shared opening ("A
      // full-length timed mock modelled on the … pattern") made two or three
      // tests' descriptions identical once cut (2026-10-01 audit).
      description: summarise(
        `${t.name} pattern: ${t.totalQuestions} questions in ${minutes} minutes across ${t.sections.length} ${t.sections.length === 1 ? "section" : "sections"}${t.negativeMark > 0 ? ", with negative marking" : ""}. Sample questions, a preparation guide and a free timed mock.`,
      ),
      facts: { company: t.company, minutes, questions: t.totalQuestions, trail },
      content,
      crumb: t.name,
    };
  });
}

/** The tests index's child list: every pattern by family. */
async function testsIndex(): Promise<PageHead> {
  const rows = await prisma.mockTest.findMany({ where: { published: true }, select: { slug: true, name: true, company: true, family: true, durationSec: true, totalQuestions: true }, orderBy: [{ family: "asc" }, { orderIndex: "asc" }] });
  const families = new Map<string, typeof rows>();
  for (const r of rows) families.set(r.family, [...(families.get(r.family) ?? []), r]);
  const FAMILY_LABEL: Record<string, string> = { service: "Service-company patterns", product: "Product-company patterns", generic: "General patterns" };
  const content = section(
    "Every pattern",
    [...families.entries()].map(([f, list]) => `<h3>${h(FAMILY_LABEL[f] ?? titleCase(f))}</h3>${linkList(list.map((t) => ({ href: `/tests/${t.slug}`, label: t.name, note: `${t.company} · ${Math.round(t.durationSec / 60)} min · ${t.totalQuestions} questions` })))}`).join(""),
    "patterns",
  );
  return { path: "/tests", title: "Placement tests", description: "", content, section: "index" };
}

/* ── Skill tests ─────────────────────────────────────────────────── */

/**
 * A skill test's page as a crawler reads it, in the SPA's order: the facts,
 * the direct answer, the paper, what it covers (each topic with where to
 * practise it), the written guide (lib/skill-test-guides), the sample
 * question with its answer folded away, the common questions, the rules and
 * the other tests. The guide's questions are the FAQPage (facts.faq), as on
 * a roadmap lesson.
 */
function skillTestHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:skill-test:v3:${slug}`, HEAD_TTL_MS, async () => {
    const t = await prisma.skillTest.findFirst({
      where: { slug, published: true },
      select: {
        skill: true, level: true, title: true, blurb: true, instructions: true, durationSec: true, totalQuestions: true, passPercent: true, distinctionPercent: true, validityMonths: true,
        sections: { orderBy: { orderIndex: "asc" }, select: { name: true, durationSec: true, questionCount: true, kind: true, marksPerQuestion: true } },
      },
    });
    if (!t) return null;
    const def = skillDef(t.skill);
    const skillLabel = def?.label ?? t.skill;
    const levelLabel = isSkillLevel(t.level) ? LEVEL_LABEL[t.level] : t.level;
    const path = `/skill-tests/${slug}`;
    const minutes = Math.round(t.durationSec / 60);
    const trail: Crumb[] = [HOME, SECTION.skillTests, { name: t.title, path }];
    const [others, covered] = await Promise.all([
      prisma.skillTest.findMany({ where: { published: true, NOT: { slug } }, select: { slug: true, title: true }, orderBy: { orderIndex: "asc" } }),
      poolTopics(t.skill, t.level),
    ]);
    const rows = t.sections
      .map((s) => `<tr><td>${h(s.name)}</td><td>${s.questionCount}</td><td>${Math.round(s.durationSec / 60)} min</td><td>${s.kind === "coding" ? "Coding" : "Multiple choice"}</td><td>${s.marksPerQuestion}</td></tr>`)
      .join("");
    const guide = guideFor(slug);
    const sample = guide?.sample;
    const letter = (i: number) => "ABCDEF"[i] ?? "?";
    const sampleHtml = sample
      ? section(
          "Sample question",
          `<p>Topic: ${h(skillTopic(t.skill, sample.topic)?.label ?? sample.topic)}</p>` +
            markdownToHtml(sample.prompt, 6_000, { under: 3 }) +
            `<ol type="A">${sample.options.map((o) => `<li>${inlineMd(o)}</li>`).join("")}</ol>` +
            `<details><summary>Show the answer</summary><p><strong>${sample.answer.map(letter).join(", ")}.</strong> ${sample.answer.map((i) => inlineMd(sample.options[i] ?? "")).join("; ")}</p>${markdownToHtml(sample.explanation, 4_000)}</details>`,
          "sample",
        )
      : "";
    const content =
      factList([
        ["Skill", skillLabel],
        ["Level", levelLabel],
        ["Duration", `${minutes} minutes`],
        ["Questions", String(t.totalQuestions)],
        ["Pass mark", `${t.passPercent}% (distinction at ${t.distinctionPercent}%)`],
        ["Credential", `Verifiable, valid for ${t.validityMonths / 12} years`],
      ]) +
      `<p>${h(t.blurb)}</p>` +
      (guide ? `<section id="answer"><h2>${inlineMd(guide.question)}</h2><p>${inlineMd(guide.answer)}</p></section>` : "") +
      section("Sections", `<table><thead><tr><th>Section</th><th>Questions</th><th>Time</th><th>Kind</th><th>Marks each</th></tr></thead><tbody>${rows}</tbody></table>`, "sections") +
      (def && covered.length
        ? section(
            "What it covers",
            `<ul>${def.topics
              .filter((x) => covered.includes(x.id))
              .map((x) => `<li>${h(x.label)}${x.practice ? ` — practise with ${link(x.practice.href, x.practice.label)}` : ""}</li>`)
              .join("")}</ul>`,
            "topics",
          )
        : "") +
      (guide ? `<article id="guide">${markdownToHtml(guide.body, 60_000, { anchors: true, under: 1 })}</article>` : "") +
      sampleHtml +
      (guide?.faq.length ? `<section id="questions"><h2>Common questions</h2>${guide.faq.map((f) => `<h3>${inlineMd(f.q)}</h3><p>${inlineMd(f.a)}</p>`).join("")}</section>` : "") +
      section("Rules", markdownToHtml(t.instructions, 6_000), "rules") +
      (others.length ? section("Other skill tests", linkList(others.map((o) => ({ href: `/skill-tests/${o.slug}`, label: o.title }))), "related") : "");
    return {
      path,
      title: titles.skillTest(skillLabel, levelLabel),
      description: summarise(`A free ${minutes}-minute ${skillLabel} skill test at ${levelLabel.toLowerCase()} level. Pass with ${t.passPercent}% to earn a verifiable CodeKairo credential and a profile frame. ${t.blurb}`),
      facts: {
        minutes,
        questions: t.totalQuestions,
        level: levelLabel,
        topic: skillLabel,
        ...(def && covered.length ? { keywords: def.topics.filter((x) => covered.includes(x.id)).map((x) => x.label) } : {}),
        ...(guide ? { updated: guide.updated, faq: [{ q: guide.question, a: guide.answer }, ...guide.faq] } : {}),
        trail,
      },
      content,
      crumb: t.title,
    };
  });
}

/** The skill tests index's child list: every test, by skill. */
async function skillTestsIndex(): Promise<PageHead> {
  const rows = await prisma.skillTest.findMany({ where: { published: true }, select: { slug: true, title: true, skill: true, durationSec: true, totalQuestions: true }, orderBy: { orderIndex: "asc" } });
  // Grouped as the page groups them: languages, problem solving, CS fundamentals.
  const content = section(
    "Every skill test",
    SKILL_GROUPS.map((group) => {
      const skills = SKILLS.filter((skill) => skill.group === group.id && rows.some((r) => r.skill === skill.id));
      if (!skills.length) return "";
      return `<h3>${h(group.label)}</h3>${skills
        .map((skill) => `<h4>${h(skill.label)}</h4><p>${h(skill.blurb)}</p>${linkList(rows.filter((r) => r.skill === skill.id).map((t) => ({ href: `/skill-tests/${t.slug}`, label: t.title, note: `${Math.round(t.durationSec / 60)} min · ${t.totalQuestions} questions` })))}`)
        .join("")}`;
    }).join(""),
    "tests",
  );
  return { path: "/skill-tests", title: "Skill tests", description: "", content, section: "index" };
}

/**
 * /verify/<code> — a credential's public check, the page a certificate's
 * printed link and a LinkedIn "Licenses & certifications" entry lead to.
 * Noindex (the route table says so): it answers "is this real?" for the
 * one person asking; it is not a page for search. A code that resolves to
 * nothing is a 404, so a forged certificate's link says so plainly.
 */
async function credentialHead(raw: string): Promise<PageHead | null> {
  const code = normalizeCredentialCode(raw);
  if (!code) return null;
  const c = await verifyCredential(code, null);
  if (!c) return null;
  const who = c.holder.name || c.holder.username || "A CodeKairo member";
  const state = c.status === "valid" ? "Verified" : c.status === "expired" ? "Expired" : "Revoked";
  const title = `${state}: ${who} — ${c.name} | ${BRAND}`;
  const description =
    c.status === "valid"
      ? `${who} passed the CodeKairo ${c.name} skill test${c.band === "distinction" ? " with distinction" : ""}. Credential ${c.code}, issued ${c.issuedAt.toISOString().slice(0, 10)}, valid until ${c.expiresAt.toISOString().slice(0, 10)}.`
      : `Credential ${c.code} (${c.name}, held by ${who}) is ${c.status}.`;
  return {
    path: credentialPath(c.code),
    title,
    description: summarise(description),
    crumb: "Credential",
    content: `<p>${h(description)}</p><p><a href="/skill-tests/${h(c.test.slug)}">About the ${h(c.test.title)} test</a> · <a href="/skill-tests">All skill tests</a></p>`,
  };
}

/* ── The roadmap ─────────────────────────────────────────────────── */

/** The roadmap index's child list: every tier, its stages, their problems. */
async function roadmapIndex(): Promise<PageHead> {
  const [road, syllabus] = await Promise.all([roadDefinition(), lessonSyllabus()]);
  const lessonsOf = new Map(syllabus.tiers.flatMap((t) => t.stages.map((s) => [s.id, s.lessons] as const)));
  const tiers = road.tiers
    .map((tier) => {
      const stages = road.stages.filter((s) => s.tier === tier.id);
      return `<section><h3>${h(tier.title)}</h3><p>${h(tier.blurb)} The chest at the end pays ${tier.rewardXp} XP${tier.interviewCredits ? ` and ${plural(tier.interviewCredits, "bonus mock interview")}` : ""}.</p>${stages
        .map((s) => {
          // The stage's lessons first: what to read, then what to solve.
          const lessons = lessonsOf.get(s.id) ?? [];
          const learn = lessons.length ? `<p>Learn: ${lessons.map((l) => link(`/roadmap/${l.slug}`, l.title)).join(" · ")}</p>` : "";
          return `<h4>Stage ${road.stages.indexOf(s) + 1}: ${h(s.title)}</h4><p>${h(s.blurb)} Cleared at ${s.required} of ${s.problems.length} solved.</p>${learn}${linkList(s.problems.map(problemRow))}`;
        })
        .join("")}</section>`;
    })
    .join("");
  const plan = roadmapPlan(road);
  const planHtml =
    `<p>At about ${PLAN_PACE} problems a day, five days a week, the road takes ${plan.weeks} weeks — about ${Math.ceil(plan.weeks / 4.3)} months — counting only the solves each stage needs to clear. Most placement seasons start in the final year, so starting in the pre-final year's second half leaves room to revise.</p>` +
    `<table><thead><tr><th>Weeks</th><th>Stage</th><th>Solves to clear</th></tr></thead><tbody>${plan.rows.map((r) => `<tr><td>${h(r.weeks)}</td><td>${h(r.stage)}</td><td>${r.required}</td></tr>`).join("")}</tbody></table>`;
  return { path: "/roadmap", title: "DSA roadmap", description: "", content: section("A week-by-week plan", planHtml, "plan") + section("The road, stage by stage", tiers, "stages"), section: "index" };
}

/**
 * A roadmap lesson (/roadmap/<slug>, services/roadmap-lessons): the
 * tutorial behind a stage. The page's order — the direct answer under the
 * heading, the contents, the article with an anchor on every heading and
 * its walkthrough where the text places it, the common questions, the
 * practice problems, the stage's other lessons and the way on — the same
 * blocks the SPA's RoadmapLessonPage draws. Code groups print as their four
 * programs in turn, then the output.
 */
async function roadmapLessonHead(slug: string): Promise<PageHead | null> {
  const page = await lessonPage(slug);
  if (!page) return null;
  const { lesson: l, stage } = page;
  const path = `/roadmap/${l.slug}`;
  const trail: Crumb[] = [HOME, SECTION.roadmap, { name: l.title, path }];
  const outline = markdownOutline(l.body);
  // The article's own "##" stay h2 — it is the page, not a section under one.
  const article = markdownToHtml(l.body, 120_000, { anchors: true, under: 1 }).replace(`<p>${WALKTHROUGH_MARKER}</p>`, () => (page.walkthrough ? walkthroughHtml(page.walkthrough) : ""));
  const siblings = page.syllabus.tiers.flatMap((t) => t.stages).find((s) => s.id === stage.id)?.lessons ?? [];
  const content =
    factList([
      ["Roadmap stage", link("/roadmap", `Stage ${stage.number}: ${stage.title}`), { html: true }],
      ["Level", l.level],
      ["Reading time", `${l.minutes} min`],
      ["Code", LESSON_LANGUAGES.map((x) => ({ cpp: "C++", java: "Java", python: "Python", javascript: "JavaScript" })[x]).join(", ")],
      ["Updated", l.updated],
    ]) +
    `<section id="answer"><h2>${inlineMd(l.seo.question)}</h2><p>${inlineMd(l.seo.answer)}</p></section>` +
    (outline.length > 1 ? `<nav id="contents" aria-label="On this page"><h2>On this page</h2>${linkList(outline.map((o) => ({ href: `#${o.id}`, label: o.text })))}</nav>` : "") +
    `<article id="lesson">${article}</article>` +
    section(
      "Practice problems",
      linkList(page.practice.map(problemRow)) + (page.hub ? `<p>${link(`/challenges/${page.hub.slug}`, `All ${plural(page.hub.count, `${page.hub.label.toLowerCase()} problem`)}`)}</p>` : ""),
      "practice",
    ) +
    (l.seo.faq.length ? `<section id="questions"><h2>Common questions</h2>${l.seo.faq.map((f) => `<h3>${inlineMd(f.q)}</h3><p>${inlineMd(f.a)}</p>`).join("")}</section>` : "") +
    section(`Stage ${stage.number}: ${stage.title}`, `<p>${h(stage.blurb)} The stage clears at ${stage.required} of its ${stage.total} problems solved.</p>${linkList(siblings.map((s) => ({ href: `/roadmap/${s.slug}`, label: `${s.title}${s.slug === l.slug ? " (this lesson)" : ""}`, note: `${s.minutes} min` })))}`, "stage") +
    `<p>${page.prev ? link(`/roadmap/${page.prev.slug}`, `← ${page.prev.title}`) : link("/roadmap", "← The DSA roadmap")}${page.next ? ` · ${link(`/roadmap/${page.next.slug}`, `${page.next.title} →`)}` : ""}</p>`;
  return {
    path,
    title: titles.roadmapLesson(l.seo.title),
    description: l.seo.description,
    facts: {
      minutes: l.minutes,
      level: l.level,
      updated: l.updated,
      topic: page.hub?.label ?? stage.title,
      track: { title: "DSA roadmap", path: "/roadmap" },
      faq: [{ q: l.seo.question, a: l.seo.answer }, ...l.seo.faq],
      trail,
    },
    content,
    crumb: l.title,
  };
}

/** Problems a day in the plan; the SPA's roadmap page (lib/roadmap-plan.ts) uses the same pace. */
export const PLAN_PACE = 2;

/**
 * The road as weeks: each stage takes the solves it needs to clear
 * (`required`) at PLAN_PACE a day over five days a week, rounded up to whole
 * weeks and laid end to end. The SPA's roadmap page computes the same table
 * from the same payload (frontend lib/roadmap-plan.ts — keep the two equal).
 */
export function roadmapPlan(road: { stages: Array<{ title: string; required: number }> }): { weeks: number; rows: Array<{ weeks: string; stage: string; required: number }> } {
  let week = 1;
  const rows = road.stages.map((s, i) => {
    const span = Math.max(1, Math.ceil(s.required / (PLAN_PACE * 5)));
    const from = week;
    week += span;
    return { weeks: span === 1 ? `Week ${from}` : `Weeks ${from}–${from + span - 1}`, stage: `${i + 1}. ${s.title}`, required: s.required };
  });
  return { weeks: week - 1, rows };
}

/* ── Sitemaps ─────────────────────────────────────────────────── */

export const SITEMAP_NAMES = ["problems", "bug-hunts", "study-plans", "aptitude", "tests", "categories", "roadmap"] as const;
export type SitemapName = (typeof SITEMAP_NAMES)[number];

const SITEMAP_TTL_MS = 60 * 60 * 1000;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlset(entries: Array<{ path: string; lastmod?: Date | null }>): string {
  const rows = entries.map((e) => {
    const loc = `    <loc>${escapeXml(SITE_ORIGIN + e.path)}</loc>`;
    const mod = e.lastmod ? `\n    <lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>` : "";
    return `  <url>\n${loc}${mod}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

/**
 * One sitemap's XML: every public URL of that kind, with the row's own
 * update time where the table records one. Empty for a name nobody
 * declared, which the route answers with a 404. Each stays far below the
 * 50,000-URL / 50 MB limit of one file; a kind that grows past it splits
 * into problems-1.xml, problems-2.xml … here and in the index the SPA's
 * build writes (vite.config.ts CONTENT_SITEMAPS).
 */
export function sitemapXml(name: string): Promise<string | null> {
  if (!(SITEMAP_NAMES as readonly string[]).includes(name)) return Promise.resolve(null);
  return cached(`seo:sitemap:v3:${name}`, SITEMAP_TTL_MS, async () => {
    switch (name as SitemapName) {
      case "problems": {
        // No updatedAt on the problem table; a creation date would only say
        // when the row appeared, so no lastmod is claimed at all.
        // A second copy of a problem (PROBLEM_CANONICAL) is left out, as a
        // restated aptitude question is below: a sitemap lists canonicals.
        const rows = await prisma.problem.findMany({ where: { isPublished: true }, select: { slug: true }, orderBy: { createdAt: "asc" } });
        return urlset(rows.filter((r) => !(r.slug in PROBLEM_CANONICAL)).map((r) => ({ path: `/problems/${r.slug}` })));
      }
      case "bug-hunts": {
        const rows = await prisma.bugChallenge.findMany({ where: { isPublished: true }, select: { id: true, slug: true }, orderBy: { createdAt: "asc" } });
        return urlset(rows.map((r) => ({ path: bugPath(r) })));
      }
      case "study-plans": {
        const tracks = await trackList();
        const entries: Array<{ path: string }> = [];
        for (const t of tracks) {
          entries.push({ path: `/study-plans/${t.key}` });
          const def = await trackDefinition(t.key);
          for (const m of def?.modules ?? []) for (const l of m.lessons) entries.push({ path: `/study-plans/${t.key}/${l.slug}` });
        }
        return urlset(entries);
      }
      case "aptitude": {
        // A restated question (APTITUDE_CANONICAL) is left out: its page
        // names the original as canonical, and a sitemap lists canonicals.
        // No lastmod: every seed rewrites every row, so updatedAt was one
        // date for all 1,164 that moved with each seed — a lastmod that
        // changes when nothing did teaches a crawler to ignore it (2026-10-01).
        const rows = await prisma.aptitudeQuestion.findMany({ select: { slug: true }, orderBy: { slug: "asc" } });
        return urlset(rows.filter((r) => !(r.slug in APTITUDE_CANONICAL)).map((r) => ({ path: `/aptitude/q/${r.slug}` })));
      }
      case "tests": {
        // The placement patterns and the skill tests: both are tests a
        // visitor reads the rules of before sitting one.
        // No lastmod for a pattern, as with aptitude: they are re-seeded in
        // bulk. A skill test's page is its written guide, which carries the
        // date it was last revised (lib/skill-test-guides `updated`).
        const [rows, skill] = await Promise.all([
          prisma.mockTest.findMany({ where: { published: true }, select: { slug: true }, orderBy: { slug: "asc" } }),
          prisma.skillTest.findMany({ where: { published: true }, select: { slug: true }, orderBy: { slug: "asc" } }),
        ]);
        const revised = (slug: string) => {
          const updated = guideFor(slug)?.updated;
          return updated ? new Date(`${updated}T00:00:00Z`) : null;
        };
        return urlset([...rows.map((r) => ({ path: `/tests/${r.slug}` })), ...skill.map((r) => ({ path: `/skill-tests/${r.slug}`, lastmod: revised(r.slug) }))]);
      }
      case "categories": {
        // The hub pages: the catalogue's topics and companies, the bug hunts'
        // languages and layers, the aptitude sections and topics. Only the
        // hubs that are indexed: a company page with fewer than three
        // problems is served noindex (lib/problem-topics).
        const [hubs, bugs, counts] = await Promise.all([hubIndex(), bugHubIndex(), aptitudeCounts()]);
        const entries: Array<{ path: string }> = [
          ...hubs.topics.map((t) => ({ path: hubPath(t) })),
          ...hubs.companies.filter((c) => c.indexed).map((c) => ({ path: hubPath(c) })),
          ...[...bugs.languages, ...bugs.categories].filter((b) => b.count > 0).map((b) => ({ path: `/bug-hunts/${b.id}` })),
          ...APTITUDE_CATEGORIES.map((c) => ({ path: `/aptitude/${c.id}` })),
          ...APTITUDE_TOPICS.filter((t) => (counts.get(t.id)?.total ?? 0) > 0).map((t) => ({ path: `/aptitude/${t.id}` })),
        ];
        return urlset(entries);
      }
      case "roadmap": {
        // The roadmap's lessons, each with the date it was last revised —
        // authored in the file (`updated`), so a lastmod moves only when
        // the text did.
        return urlset(await lessonSitemapEntries());
      }
    }
  });
}
