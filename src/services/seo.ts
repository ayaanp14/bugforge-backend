import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { aptitudeTopic, aptitudeCategory } from "../lib/aptitude-topics.js";
import { escapeHtml, markdownToHtml } from "../lib/markdown-html.js";
import { trackDefinition, trackList } from "./study-plans.js";

/**
 * What a search engine is told about the app's public content.
 *
 * The SPA opens its content pages — problems, bug hunts, study lessons,
 * aptitude questions, placement test patterns — to visitors, and the
 * Cloudflare Worker in front of it completes each page's <head> before the
 * HTML leaves the edge, so a crawler that never runs JavaScript still reads
 * the right title and description. `headFor` answers that lookup per URL;
 * the sitemap builders enumerate the same URLs for /sitemap.xml. Both are
 * cached: the Worker caches a head at the edge for an hour and a sitemap
 * for a day, and here every builder sits behind the in-process cache too,
 * so a crawl of thousands of URLs costs the database very little.
 *
 * The words are the same ones the pages set at runtime (the SPA's
 * hooks/useDocumentTitle callers) — a crawler must not see one title in
 * the HTML and another after render. Change one, change the other.
 *
 * Beyond the head, each answer carries what a crawler that never runs
 * JavaScript would otherwise never see: `content`, the page's own text
 * rendered to a safe HTML subset (lib/markdown-html) — the statement and
 * editorial of a problem, the report of a bug hunt, a track's modules and
 * lessons as links, a lesson's body and exercises, a question's prompt
 * and options (never its answer), a test's sections — which the Worker
 * writes into the page's <div id="root"> (the SPA's lib/seo/prerender);
 * and `facts`, the fields the page's typed structured-data node names
 * (the SPA's PageFacts: difficulty, tags, modules, minutes), so the
 * JSON-LD the edge writes and the JSON-LD the page sets are identical.
 * Nothing here is sent that the page does not show a visitor.
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
}

export interface PageHead {
  path: string;
  title: string;
  description: string;
  /** What the page's structured data names about it. */
  facts?: PageFacts;
  /** The page's text as safe HTML, for the prerendered body. */
  content?: string;
  /** The page's breadcrumb label — its own name, without the title's suffixes. */
  crumb?: string;
}

const BRAND = "CodeKairo";
const DESCRIPTION_MAX = 158;

/** A meta description from Markdown — the SPA's lib/seo/summary, mirrored. */
export function summarise(markdown: string, fallback = "", max = DESCRIPTION_MAX): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/<[^>]+>/g, " ")
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

const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);
/** "javascript" as the product prints it; the SPA's BugWorkspaceLoader does the same. */
const languageName = (s: string) => (s.toLowerCase() === "javascript" ? "JavaScript" : s.toLowerCase() === "typescript" ? "TypeScript" : titleCase(s));

const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const h = escapeHtml;
/** A "Difficulty: Easy · Topics: Arrays" strip, from whatever is known. */
const factList = (pairs: Array<[string, string | undefined]>) =>
  `<ul class="facts">${pairs.filter((p): p is [string, string] => Boolean(p[1])).map(([k, v]) => `<li><strong>${h(k)}:</strong> ${h(v)}</li>`).join("")}</ul>`;
const section = (title: string, html: string) => (html.trim() ? `<section><h2>${h(title)}</h2>${html}</section>` : "");
const linkList = (items: Array<{ href: string; label: string }>) => `<ul>${items.map((it) => `<li><a href="${h(it.href)}">${h(it.label)}</a></li>`).join("")}</ul>`;

const HEAD_TTL_MS = 60 * 60 * 1000;

/**
 * The head for one public URL, or null when nothing lives there — the
 * Worker then serves a real 404 rather than a page claiming a problem that
 * does not exist. Only the shapes the SPA's PUBLIC_APP_ROUTES declares are
 * answered; anything else is null too.
 */
export async function headFor(path: string): Promise<PageHead | null> {
  let m: RegExpExecArray | null;
  if ((m = /^\/problems\/([a-z0-9][a-z0-9-]*)$/.exec(path))) return problemHead(m[1]);
  if ((m = /^\/bug-hunts\/([a-z0-9][a-z0-9-]*)$/.exec(path))) return bugHuntHead(m[1]);
  if ((m = /^\/study-plans\/([a-z0-9-]+)$/.exec(path))) return trackHead(m[1]);
  if ((m = /^\/study-plans\/([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(path))) {
    if (m[2] === "certificate" || m[2] === "m") return null;
    return lessonHead(m[1], m[2]);
  }
  if ((m = /^\/aptitude\/q\/([a-z0-9-]+)$/.exec(path))) return aptitudeQuestionHead(m[1]);
  if ((m = /^\/aptitude\/([a-z0-9-]+)$/.exec(path))) return aptitudeTopicHead(m[1]);
  if ((m = /^\/tests\/([a-z0-9-]+)$/.exec(path))) {
    if (m[1] === "attempt" || m[1] === "result") return null;
    return testHead(m[1]);
  }
  return null;
}

function problemHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:problem:${slug}`, HEAD_TTL_MS, async () => {
    const p = await prisma.problem.findFirst({
      where: { slug, isPublished: true },
      select: { title: true, difficulty: true, description: true, tags: true, editorial: true, timeLimitMs: true, memoryLimitMb: true },
    });
    if (!p) return null;
    const difficulty = titleCase(p.difficulty);
    const tags = asStrings(p.tags);
    // The statement and the editorial's prose — both readable by a visitor
    // on the page. Not the hints (opened one at a time there) and not the
    // reference solutions.
    const content =
      factList([
        ["Difficulty", difficulty],
        ["Tags", tags.length ? tags.join(", ") : undefined],
        ["Time limit", `${p.timeLimitMs / 1000} s`],
        ["Memory limit", `${p.memoryLimitMb} MB`],
        ["Languages", "JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Kotlin, Swift, Rust, PHP and Ruby"],
      ]) +
      section("Problem statement", markdownToHtml(p.description)) +
      (p.editorial ? section("Editorial", markdownToHtml(p.editorial, 12_000)) : "");
    return {
      path: `/problems/${slug}`,
      title: `${p.title} — ${difficulty} Coding Problem — ${BRAND}`,
      description: summarise(p.description, `${p.title}: a ${difficulty.toLowerCase()} coding problem on ${BRAND}, judged by hidden tests in 13 languages.`),
      facts: { difficulty, keywords: tags },
      content,
      crumb: p.title,
    };
  });
}

function bugHuntHead(id: string): Promise<PageHead | null> {
  return cached(`seo:head:bug:${id}`, HEAD_TTL_MS, async () => {
    const b = await prisma.bugChallenge.findFirst({
      where: { id, isPublished: true },
      select: { title: true, language: true, bugReport: true, description: true, difficulty: true, category: true, tags: true },
    });
    if (!b) return null;
    const language = languageName(b.language);
    const difficulty = titleCase(b.difficulty);
    const keywords = [b.category, ...asStrings(b.tags)].filter(Boolean);
    // The briefing and the report a visitor reads before opening the files;
    // the project files and the tests are the exercise itself.
    const content =
      factList([
        ["Language", language],
        ["Difficulty", difficulty],
        ["Category", b.category],
        ["Reward", "50 XP for a complete fix"],
      ]) +
      section("Briefing", markdownToHtml(b.description)) +
      section("Bug report", markdownToHtml(b.bugReport));
    return {
      path: `/bug-hunts/${id}`,
      title: `${b.title} — ${language} Bug Hunt — ${BRAND}`,
      description: summarise(b.bugReport || b.description, `${b.title}: a debugging challenge on real code — read the bug report, find the bug, fix it and pass the hidden tests.`),
      facts: { difficulty, language, keywords },
      content,
      crumb: b.title,
    };
  });
}

async function trackHead(key: string): Promise<PageHead | null> {
  const track = await trackDefinition(key);
  if (!track) return null;
  const lessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
  const minutes = track.modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.minutes, 0), 0);
  // Every module and every lesson as a link: the crawl path into the
  // track, and the syllabus a reader would want anyway.
  const modules = track.modules
    .map(
      (m, i) =>
        `<section><h3>Module ${i + 1}: ${h(m.title)}</h3><p>${h(m.blurb)}</p>${linkList(
          m.lessons.map((l) => ({ href: `/study-plans/${key}/${l.slug}`, label: `${l.title}${l.kind === "test" ? " (checkpoint)" : ""} · ${l.minutes} min` })),
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
    section("Syllabus", modules);
  return {
    path: `/study-plans/${key}`,
    title: `Learn ${track.title}: ${track.modules.length}-Module Study Plan with ${lessons} Lessons — ${BRAND}`,
    description: `${track.blurb} ${track.modules.length} modules, ${lessons} lessons, exercises run on ${track.runtime}, quizzes and checkpoints. Free, with a certificate.`,
    facts: { language: track.title, modules: track.modules.map((m) => m.title), lessons, minutes },
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
  const isTest = lesson.kind === "test";
  // The reading and the exercise prompts — what a visitor sees on the page.
  // Solutions, hidden cases and quiz answers never leave the server; the
  // quiz prompts are left out too, so the page reads as a lesson rather
  // than a test paper.
  const exercises = lesson.exercises.map((x) => `<section><h3>${h(x.title)}</h3>${markdownToHtml(x.prompt, 4_000)}</section>`).join("");
  const siblings = mod.lessons.map((l) => ({ href: `/study-plans/${key}/${l.slug}`, label: `${l.title}${l.slug === lessonSlug ? " (this lesson)" : ""}` }));
  const content =
    factList([
      ["Course", `${track.title} study plan`],
      ["Module", mod.title],
      ["Kind", isTest ? "Checkpoint — cleared at 70%" : "Lesson"],
      ["Reading time", `${lesson.minutes} min`],
      ["Runtime", track.runtime],
    ]) +
    (isTest ? `<p>${h(lesson.title)} is the checkpoint that closes the ${h(mod.title)} module: a graded quiz and whole-program exercises, passed at 70%.</p>` : "") +
    section(isTest ? "Instructions" : "Lesson", markdownToHtml(lesson.body)) +
    section(lesson.exercises.length === 1 ? "Exercise" : "Exercises", exercises) +
    section(`In this module: ${mod.title}`, linkList(siblings));
  return {
    path: `/study-plans/${key}/${lessonSlug}`,
    title: `${lesson.title} — ${track.title} ${isTest ? "checkpoint" : "lesson"} — ${BRAND}`,
    description: summarise(lesson.body, `${lesson.title}: a ${track.title} lesson with exercises judged on ${track.runtime} and a graded quiz.`),
    facts: { minutes: lesson.minutes, checkpoint: isTest, language: track.title, track: { title: `${track.title} study plan`, path: `/study-plans/${key}` } },
    content,
    crumb: lesson.title,
  };
}

function aptitudeTopicHead(topicId: string): Promise<PageHead | null> {
  const topic = aptitudeTopic(topicId);
  if (!topic) return Promise.resolve(null);
  return cached(`seo:head:aptitude-topic:${topicId}`, HEAD_TTL_MS, async () => {
    // Every question of the topic as a link — the crawl path into the bank.
    const rows = await prisma.aptitudeQuestion.findMany({ where: { topic: topicId }, select: { slug: true, title: true, difficulty: true }, orderBy: { orderIndex: "asc" }, take: 300 });
    const category = aptitudeCategory(topic.category)?.label ?? topic.category;
    const content =
      factList([
        ["Section", category],
        ["Questions", String(rows.length)],
        ["Cost", "Free, unlimited on every plan"],
      ]) +
      `<p>${h(topic.blurb)}</p>` +
      section("Questions", linkList(rows.map((r) => ({ href: `/aptitude/q/${r.slug}`, label: `${r.title} (${titleCase(r.difficulty)})` }))));
    return {
      path: `/aptitude/${topicId}`,
      title: `${topic.label} Questions with Solutions — Aptitude Practice — ${BRAND}`,
      description: `${topic.blurb} Practice ${topic.label} questions with hints, worked solutions and time targets. Free on ${BRAND}.`,
      facts: { topic: `${topic.label} (${category})` },
      content,
      crumb: topic.label,
    };
  });
}

function aptitudeQuestionHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:aptitude:${slug}`, HEAD_TTL_MS, async () => {
    const q = await prisma.aptitudeQuestion.findUnique({ where: { slug }, select: { prompt: true, topic: true, title: true, options: true, difficulty: true, timeTargetSec: true } });
    if (!q) return null;
    const label = aptitudeTopic(q.topic)?.label ?? q.topic;
    const difficulty = titleCase(q.difficulty);
    // The prompt and the options — what a visitor sees. The answer, the
    // hints and the solution are withheld until an attempt, on the page
    // and here alike.
    const options = asStrings(q.options);
    const content =
      factList([
        ["Topic", label],
        ["Difficulty", difficulty],
        ["Time target", `${q.timeTargetSec} seconds`],
      ]) +
      section("Question", markdownToHtml(q.prompt, 6_000)) +
      section("Options", `<ol type="A">${options.map((o) => `<li>${markdownToHtml(o, 500).replace(/^<p>|<\/p>$/g, "")}</li>`).join("")}</ol>`) +
      "<p>Sign in to check an answer, open the hints and read the worked solution.</p>";
    return {
      path: `/aptitude/q/${slug}`,
      title: `${label} Practice Question — Aptitude — ${BRAND}`,
      description: summarise(q.prompt, `A ${label} aptitude practice question with hints and a worked solution.`),
      facts: { difficulty, topic: label, minutes: q.timeTargetSec / 60 },
      content,
      crumb: q.title,
    };
  });
}

function testHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:test:${slug}`, HEAD_TTL_MS, async () => {
    const t = await prisma.mockTest.findFirst({
      where: { slug, published: true },
      select: {
        name: true, company: true, blurb: true, instructions: true, durationSec: true, totalQuestions: true, negativeMark: true, sectionalTiming: true, highlights: true, sourceNote: true,
        sections: { orderBy: { orderIndex: "asc" }, select: { name: true, durationSec: true, questionCount: true, kind: true, marksPerQuestion: true } },
      },
    });
    if (!t) return null;
    const minutes = Math.round(t.durationSec / 60);
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
      section("Sections", `<table><thead><tr><th>Section</th><th>Questions</th><th>Time</th><th>Kind</th><th>Marks each</th></tr></thead><tbody>${rows}</tbody></table>`) +
      section("Instructions", markdownToHtml(t.instructions, 6_000)) +
      (t.sourceNote ? section("About this pattern", `<p>${h(t.sourceNote)}</p>`) : "") +
      `<p>Modelled on the published pattern; not affiliated with ${h(t.company)}. Every sitting draws a fresh paper.</p>`;
    return {
      path: `/tests/${slug}`,
      // "TCS NQT — Foundation Mock Test — TCS Pattern" would name TCS twice.
      title: t.name.includes(t.company) ? `${t.name} Mock Test — ${BRAND}` : `${t.name} Mock Test — ${t.company} Pattern — ${BRAND}`,
      description: `${t.blurb} A full-length timed mock modelled on the ${t.company} pattern, with a fresh paper every sitting and a full review with solutions.`,
      facts: { company: t.company, minutes, questions: t.totalQuestions },
      content,
      crumb: t.name,
    };
  });
}

/* ── Sitemaps ─────────────────────────────────────────────────── */

export const SITEMAP_NAMES = ["problems", "bug-hunts", "study-plans", "aptitude", "tests"] as const;
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
 * declared, which the route answers with a 404.
 */
export function sitemapXml(name: string): Promise<string | null> {
  if (!(SITEMAP_NAMES as readonly string[]).includes(name)) return Promise.resolve(null);
  return cached(`seo:sitemap:${name}`, SITEMAP_TTL_MS, async () => {
    switch (name as SitemapName) {
      case "problems": {
        // No updatedAt on these two tables; a creation date would only say
        // when the row appeared, so no lastmod is claimed at all.
        const rows = await prisma.problem.findMany({ where: { isPublished: true }, select: { slug: true }, orderBy: { createdAt: "asc" } });
        return urlset(rows.map((r) => ({ path: `/problems/${r.slug}` })));
      }
      case "bug-hunts": {
        const rows = await prisma.bugChallenge.findMany({ where: { isPublished: true }, select: { id: true }, orderBy: { createdAt: "asc" } });
        return urlset(rows.map((r) => ({ path: `/bug-hunts/${r.id}` })));
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
        const rows = await prisma.aptitudeQuestion.findMany({ select: { slug: true, topic: true, updatedAt: true }, orderBy: { slug: "asc" } });
        const topics = [...new Set(rows.map((r) => r.topic))].filter((t) => aptitudeTopic(t));
        return urlset([...topics.map((t) => ({ path: `/aptitude/${t}` })), ...rows.map((r) => ({ path: `/aptitude/q/${r.slug}`, lastmod: r.updatedAt }))]);
      }
      case "tests": {
        const rows = await prisma.mockTest.findMany({ where: { published: true }, select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } });
        return urlset(rows.map((r) => ({ path: `/tests/${r.slug}`, lastmod: r.updatedAt })));
      }
    }
  });
}
