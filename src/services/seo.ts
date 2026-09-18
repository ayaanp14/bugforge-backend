import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { aptitudeTopic } from "../lib/aptitude-topics.js";
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
 */

/** The public site: canonical URLs are built on it. */
export const SITE_ORIGIN = (process.env["SITE_ORIGIN"] ?? "https://codekairo.com").replace(/\/+$/, "");

export interface PageHead {
  path: string;
  title: string;
  description: string;
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
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
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
    const p = await prisma.problem.findFirst({ where: { slug, isPublished: true }, select: { title: true, difficulty: true, description: true } });
    if (!p) return null;
    const difficulty = titleCase(p.difficulty);
    return {
      path: `/problems/${slug}`,
      title: `${p.title} — ${difficulty} Coding Problem — ${BRAND}`,
      description: summarise(p.description, `${p.title}: a ${difficulty.toLowerCase()} coding problem on ${BRAND}, judged by hidden tests in 13 languages.`),
    };
  });
}

function bugHuntHead(id: string): Promise<PageHead | null> {
  return cached(`seo:head:bug:${id}`, HEAD_TTL_MS, async () => {
    const b = await prisma.bugChallenge.findFirst({ where: { id, isPublished: true }, select: { title: true, language: true, bugReport: true, description: true } });
    if (!b) return null;
    return {
      path: `/bug-hunts/${id}`,
      title: `${b.title} — ${titleCase(b.language)} Bug Hunt — ${BRAND}`,
      description: summarise(b.bugReport || b.description, `${b.title}: a debugging challenge on real code — read the bug report, find the bug, fix it and pass the hidden tests.`),
    };
  });
}

async function trackHead(key: string): Promise<PageHead | null> {
  const track = await trackDefinition(key);
  if (!track) return null;
  const lessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
  return {
    path: `/study-plans/${key}`,
    title: `Learn ${track.title}: ${track.modules.length}-Module Study Plan with ${lessons} Lessons — ${BRAND}`,
    description: `${track.blurb} ${track.modules.length} modules, ${lessons} lessons, exercises run on ${track.runtime}, quizzes and checkpoints. Free, with a certificate.`,
  };
}

async function lessonHead(key: string, lessonSlug: string): Promise<PageHead | null> {
  const track = await trackDefinition(key);
  if (!track) return null;
  const lesson = track.modules.flatMap((m) => m.lessons).find((l) => l.slug === lessonSlug);
  if (!lesson) return null;
  const isTest = lesson.kind === "test";
  return {
    path: `/study-plans/${key}/${lessonSlug}`,
    title: `${lesson.title} — ${track.title} ${isTest ? "checkpoint" : "lesson"} — ${BRAND}`,
    description: summarise(lesson.body, `${lesson.title}: a ${track.title} lesson with exercises judged on ${track.runtime} and a graded quiz.`),
  };
}

async function aptitudeTopicHead(topicId: string): Promise<PageHead | null> {
  const topic = aptitudeTopic(topicId);
  if (!topic) return null;
  return {
    path: `/aptitude/${topicId}`,
    title: `${topic.label} Questions with Solutions — Aptitude Practice — ${BRAND}`,
    description: `${topic.blurb} Practice ${topic.label} questions with hints, worked solutions and time targets. Free on ${BRAND}.`,
  };
}

function aptitudeQuestionHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:aptitude:${slug}`, HEAD_TTL_MS, async () => {
    const q = await prisma.aptitudeQuestion.findUnique({ where: { slug }, select: { prompt: true, topic: true } });
    if (!q) return null;
    const label = aptitudeTopic(q.topic)?.label ?? q.topic;
    return {
      path: `/aptitude/q/${slug}`,
      title: `${label} Practice Question — Aptitude — ${BRAND}`,
      description: summarise(q.prompt, `A ${label} aptitude practice question with hints and a worked solution.`),
    };
  });
}

function testHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:test:${slug}`, HEAD_TTL_MS, async () => {
    const t = await prisma.mockTest.findFirst({ where: { slug, published: true }, select: { name: true, company: true, blurb: true } });
    if (!t) return null;
    return {
      path: `/tests/${slug}`,
      // "TCS NQT — Foundation Mock Test — TCS Pattern" would name TCS twice.
      title: t.name.includes(t.company) ? `${t.name} Mock Test — ${BRAND}` : `${t.name} Mock Test — ${t.company} Pattern — ${BRAND}`,
      description: `${t.blurb} A full-length timed mock modelled on the ${t.company} pattern, with a fresh paper every sitting and a full review with solutions.`,
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
