import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { APTITUDE_CANONICAL, APTITUDE_CATEGORIES, APTITUDE_TOPICS, aptitudeCanonicalSlug, aptitudeTopic, aptitudeCategory } from "../lib/aptitude-topics.js";
import { escapeHtml, markdownToHtml } from "../lib/markdown-html.js";
import { BUG_HUBS, bugHub } from "../lib/bug-hubs.js";
import { isCompanyTag } from "../lib/companies.js";
import { trackDefinition, trackList } from "./study-plans.js";
import { roadDefinition } from "./roadmap.js";
import { hubIndex, hubPage, hubsForTags, relatedProblems, type HubSummary } from "./problem-hubs.js";
import { getCatalogue } from "./dashboard.js";
import { bugHubIndex, bugHubPage, bugPath } from "./bug-hunts.js";
import { topicOrder } from "./aptitude-bank.js";

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
export const titles = {
  problem: (title: string, difficulty: string) => `${title} — ${difficulty} Coding Problem & Solution — ${BRAND}`,
  topicHub: (label: string, count: number) => `${label} Coding Problems: ${count} Practice Questions with Solutions — ${BRAND}`,
  companyHub: (label: string, count: number) => `${label} Coding Interview Questions: ${count} Tagged Problems to Practise — ${BRAND}`,
  bugHunt: (title: string, language: string) => `${title} — ${language} Bug Hunt — ${BRAND}`,
  bugHub: (label: string, count: number, kind: "language" | "category") =>
    kind === "language" ? `${label} Debugging Practice: ${count} Bug Hunts on Real Code — ${BRAND}` : `${label} Bug Hunts: ${count} Debugging Challenges — ${BRAND}`,
  aptitudeCategory: (label: string, topics: number, questions: number) => `${label} Questions with Solutions: ${topics} Topics, ${questions} Practice Questions — ${BRAND}`,
  aptitudeTopic: (label: string) => `${label} Questions with Solutions — Aptitude Practice — ${BRAND}`,
  aptitudeQuestion: (title: string, topicLabel: string) => `${title} — ${topicLabel} Aptitude Question with Solution — ${BRAND}`,
  studyTrack: (language: string, modules: number, lessons: number) => `Learn ${language}: ${modules}-Module Study Plan with ${lessons} Lessons — ${BRAND}`,
  studyLesson: (lesson: string, language: string, checkpoint: boolean) => `${lesson} — ${language} ${checkpoint ? "checkpoint" : "lesson"} — ${BRAND}`,
  test: (name: string, company: string) => (name.includes(company) ? `${name} Mock Test — ${BRAND}` : `${name} Mock Test — ${company} Pattern — ${BRAND}`),
};

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
/** "305 easy · 271 medium · 22 hard" */
const difficultySplit = (counts: Record<string, number>) =>
  ["EASY", "MEDIUM", "HARD"]
    .map((d) => [d, counts[d] ?? counts[d.toLowerCase()] ?? 0] as const)
    .filter(([, n]) => n > 0)
    .map(([d, n]) => `${n} ${d.toLowerCase()}`)
    .join(" · ");
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const HOME: Crumb = { name: "Home", path: "/" };
const SECTION = {
  challenges: { name: "Coding problems", path: "/challenges" },
  bugHunts: { name: "Bug hunts", path: "/bug-hunts" },
  studyPlans: { name: "Study plans", path: "/study-plans" },
  aptitude: { name: "Aptitude", path: "/aptitude" },
  tests: { name: "Placement tests", path: "/tests" },
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
  let m: RegExpExecArray | null;
  if (path === "/challenges") return challengesIndex();
  if ((m = /^\/challenges\/company\/([a-z0-9-]+)$/.exec(path))) return hubHead("company", m[1]);
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
  if (path === "/roadmap") return roadmapIndex();
  return null;
}

/* ── Coding problems ─────────────────────────────────────────────── */

const hubPath = (hub: HubSummary) => (hub.kind === "topic" ? `/challenges/${hub.slug}` : `/challenges/company/${hub.slug}`);
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
  return cached(`seo:head:problem:v2:${slug}`, HEAD_TTL_MS, async () => {
    const p = await prisma.problem.findFirst({
      where: { slug, isPublished: true },
      select: { title: true, difficulty: true, description: true, tags: true, editorial: true, solutions: true, timeLimitMs: true, memoryLimitMb: true },
    });
    if (!p) return null;
    const difficulty = titleCase(p.difficulty);
    const tags = asStrings(p.tags);
    const topics = tags.filter((t) => !isCompanyTag(t));
    const [hubs, related] = await Promise.all([hubsForTags(tags), relatedProblems(slug, tags, p.difficulty)]);
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
      section("Problem statement", markdownToHtml(p.description), "statement") +
      (p.editorial ? section(`How to solve ${p.title}`, markdownToHtml(p.editorial, 12_000), "editorial") : "") +
      (solutionHtml ? section("Reference solution", solutionHtml, "solution") : "") +
      (related.length ? section(primary ? `More ${primary.label.toLowerCase()} problems` : "Related problems", linkList(related.map(problemRow)), "related") : "") +
      (primary ? `<p>${link(hubPath(primary), `All ${primary.count} ${primary.label.toLowerCase()} problems`)} · ${link("/challenges", "the whole catalogue")}</p>` : "");
    return {
      path: `/problems/${slug}`,
      title: titles.problem(p.title, difficulty),
      description: summarise(p.description, `${p.title}: a ${difficulty.toLowerCase()} coding problem on ${BRAND}, judged by hidden tests in 13 languages.`),
      facts: { difficulty, keywords: topics, trail },
      content,
      crumb: p.title,
    };
  });
}

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
  const content =
    factList([
      ["Problems", String(page.count)],
      ["By difficulty", difficultySplit(page.byDifficulty)],
      ["Languages", LANGUAGE_LIST],
      ["Cost", "Free on every plan; sign in to run and submit"],
    ]) +
    `<p>${h(page.blurb)}</p>` +
    section(`Every ${noun}`, levels.join(""), "problems") +
    (page.related.length ? section(kind === "topic" ? "Other topics" : "Other companies", linkList(page.related.map((r) => ({ href: hubPath(r), label: r.label, note: `${r.count} problems` }))), "related") : "");
  return {
    path,
    title: kind === "topic" ? titles.topicHub(page.label, page.count) : titles.companyHub(page.label, page.count),
    description:
      kind === "topic"
        ? `${page.count} ${page.label.toLowerCase()} coding problems with editorials and reference solutions in 13 languages — ${difficultySplit(page.byDifficulty)} — judged by hidden tests. Read any problem free on ${BRAND}.`
        : `${page.count} coding problems the ${BRAND} catalogue tags as commonly asked at ${page.label} — ${difficultySplit(page.byDifficulty)} — each with an editorial and solutions in 13 languages. Practise free.`,
    facts: { topic: page.label, count: page.count, keywords: kind === "topic" ? [page.label] : undefined, company: kind === "company" ? page.label : undefined, trail },
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
      description: summarise(b.bugReport || b.description, `${b.title}: a debugging challenge on real ${language} code — read the bug report, find the bug, fix it and pass the hidden tests.`),
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
    description: `${page.count} ${page.noun} — ${difficultySplit(page.byDifficulty)} — each a small project with a planted bug, a bug report, the code as shipped and hidden tests that decide whether the fix is complete. Read any hunt free on ${BRAND}.`,
    facts: { language: page.kind === "language" ? page.label : undefined, topic: page.kind === "category" ? page.label : undefined, count: page.count, trail },
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
        `<section><h3>Module ${i + 1}: ${h(m.title)}</h3><p>${h(m.blurb)}</p>${linkList(
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
    title: titles.studyTrack(track.title, track.modules.length, lessons),
    description: `${track.blurb} ${track.modules.length} modules, ${lessons} lessons, exercises run on ${track.runtime}, quizzes and checkpoints. Free, with a certificate.`,
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
  const trail: Crumb[] = [HOME, SECTION.studyPlans, { name: `${track.title} study plan`, path: `/study-plans/${key}` }, { name: lesson.title, path }];
  // The reading and the exercise prompts — what a visitor sees on the page.
  // Solutions, hidden cases and quiz answers never leave the server; the
  // quiz prompts are left out too, so the page reads as a lesson rather
  // than a test paper.
  const exercises = lesson.exercises.map((x) => `<section><h3>${h(x.title)}</h3>${markdownToHtml(x.prompt, 4_000)}</section>`).join("");
  const at = mod.lessons.findIndex((l) => l.slug === lessonSlug);
  const prev = mod.lessons[at - 1];
  const next = mod.lessons[at + 1];
  const siblings = mod.lessons.map((l) => ({ href: `/study-plans/${key}/${l.slug}`, label: `${l.title}${l.slug === lessonSlug ? " (this lesson)" : ""}` }));
  const content =
    factList([
      ["Course", link(`/study-plans/${key}`, `${track.title} study plan`), { html: true }],
      ["Module", mod.title],
      ["Kind", isTest ? "Checkpoint — cleared at 70%" : "Lesson"],
      ["Reading time", `${lesson.minutes} min`],
      ["Runtime", track.runtime],
    ]) +
    (isTest ? `<p>${h(lesson.title)} is the checkpoint that closes the ${h(mod.title)} module: a graded quiz and whole-program exercises, passed at 70%.</p>` : "") +
    section(isTest ? "Instructions" : "Lesson", markdownToHtml(lesson.body), "lesson") +
    section(lesson.exercises.length === 1 ? "Exercise" : "Exercises", exercises, "exercises") +
    section(`In this module: ${mod.title}`, linkList(siblings), "module") +
    `<p>${prev ? link(`/study-plans/${key}/${prev.slug}`, `← ${prev.title}`) : ""}${prev && next ? " · " : ""}${next ? link(`/study-plans/${key}/${next.slug}`, `${next.title} →`) : ""}</p>`;
  return {
    path,
    title: titles.studyLesson(lesson.title, track.title, isTest),
    description: summarise(lesson.body, `${lesson.title}: a ${track.title} lesson with exercises judged on ${track.runtime} and a graded quiz.`),
    facts: { minutes: lesson.minutes, checkpoint: isTest, language: track.title, track: { title: `${track.title} study plan`, path: `/study-plans/${key}` }, trail },
    content,
    crumb: lesson.title,
  };
}

/** The study plans index's child list: every track with its module count. */
async function studyPlansIndex(): Promise<PageHead> {
  const tracks = await trackList();
  const content = section(
    "The tracks",
    linkList(tracks.map((t) => ({ href: `/study-plans/${t.key}`, label: `${t.title} study plan`, note: `${t.modules} modules · ${t.lessons} lessons · about ${Math.round(t.minutes / 60)} hours · ${t.runtime}` }))),
    "tracks",
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
    section(
      `${category.label} topics`,
      `<ul>${topics.map((t) => `<li>${link(`/aptitude/${t.id}`, t.label)} <span class="note">${counts.get(t.id)?.total ?? 0} questions</span> — ${h(t.blurb)}</li>`).join("")}</ul>`,
      "topics",
    ) +
    section("Other sections", linkList(APTITUDE_CATEGORIES.filter((c) => c.id !== id).map((c) => ({ href: `/aptitude/${c.id}`, label: c.label }))), "related");
  return {
    path,
    title: titles.aptitudeCategory(category.label, topics.length, questions),
    description: `${category.blurb} ${questions} ${category.label.toLowerCase()} questions across ${topics.length} topics, each with a time target, hints, a worked solution and an approach note. Free on ${BRAND}.`,
    facts: { topic: category.label, count: questions, trail },
    content,
    crumb: category.label,
  };
}

function aptitudeTopicHead(topicId: string): Promise<PageHead | null> {
  const topic = aptitudeTopic(topicId);
  if (!topic) return Promise.resolve(null);
  return cached(`seo:head:aptitude-topic:v2:${topicId}`, HEAD_TTL_MS, async () => {
    // Every question of the topic as a link — the crawl path into the bank.
    const rows = await prisma.aptitudeQuestion.findMany({ where: { topic: topicId }, select: { slug: true, title: true, difficulty: true }, orderBy: { orderIndex: "asc" }, take: 500 });
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
      section("Questions", linkList(rows.map((r) => ({ href: `/aptitude/q/${r.slug}`, label: r.title, note: titleCase(r.difficulty) }))), "questions") +
      (siblings.length ? section(`More ${categoryLabel.toLowerCase()} topics`, linkList(siblings.map((t) => ({ href: `/aptitude/${t.id}`, label: t.label }))), "related") : "");
    return {
      path,
      title: titles.aptitudeTopic(topic.label),
      description: `${topic.blurb} ${rows.length} ${topic.label} questions with hints, worked solutions and time targets — ${difficultySplit(byDifficulty)}. Free on ${BRAND}.`,
      facts: { topic: `${topic.label} (${categoryLabel})`, count: rows.length, trail },
      content,
      crumb: topic.label,
    };
  });
}

function aptitudeQuestionHead(slug: string): Promise<PageHead | null> {
  return cached(`seo:head:aptitude:v2:${slug}`, HEAD_TTL_MS, async () => {
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
    const inlineMd = (s: string) => markdownToHtml(s, 500).replace(/^<p>|<\/p>$/g, "");
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
      description: `${q.title}: ${summarise(q.prompt, `a ${label} aptitude question with a worked solution.`, 110)} Answer and worked solution on ${BRAND}.`,
      facts: { difficulty, topic: label, minutes: q.timeTargetSec / 60, options, answer: q.answer, trail },
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
  return cached(`seo:head:test:v2:${slug}`, HEAD_TTL_MS, async () => {
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
    const others = await prisma.mockTest.findMany({ where: { published: true, family: t.family, NOT: { slug } }, select: { slug: true, name: true, company: true }, orderBy: { orderIndex: "asc" }, take: 8 });
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
      (t.sourceNote ? section("About this pattern", `<p>${h(t.sourceNote)}</p>`, "source") : "") +
      `<p>Modelled on the published pattern; not affiliated with ${h(t.company)}. Every sitting draws a fresh paper from ${link("/aptitude", "the aptitude bank")}${t.sections.some((s) => s.kind === "coding") ? ` and ${link("/challenges", "the problem catalogue")}` : ""}.</p>` +
      (others.length ? section("Similar patterns", linkList(others.map((o) => ({ href: `/tests/${o.slug}`, label: o.name, note: o.company }))), "related") : "");
    return {
      path,
      title: titles.test(t.name, t.company),
      description: `${t.blurb} A full-length timed mock modelled on the ${t.company} pattern, with a fresh paper every sitting and a full review with solutions.`,
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

/* ── The roadmap ─────────────────────────────────────────────────── */

/** The roadmap index's child list: every tier, its stages, their problems. */
async function roadmapIndex(): Promise<PageHead> {
  const road = await roadDefinition();
  const tiers = road.tiers
    .map((tier) => {
      const stages = road.stages.filter((s) => s.tier === tier.id);
      return `<section><h3>${h(tier.title)}</h3><p>${h(tier.blurb)} The chest at the end pays ${tier.rewardXp} XP${tier.interviewCredits ? ` and ${plural(tier.interviewCredits, "bonus mock interview")}` : ""}.</p>${stages
        .map((s) => `<h4>Stage ${road.stages.indexOf(s) + 1}: ${h(s.title)}</h4><p>${h(s.blurb)} Cleared at ${s.required} of ${s.problems.length} solved.</p>${linkList(s.problems.map(problemRow))}`)
        .join("")}</section>`;
    })
    .join("");
  return { path: "/roadmap", title: "DSA roadmap", description: "", content: section("The road, stage by stage", tiers, "stages"), section: "index" };
}

/* ── Sitemaps ─────────────────────────────────────────────────── */

export const SITEMAP_NAMES = ["problems", "bug-hunts", "study-plans", "aptitude", "tests", "categories"] as const;
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
  return cached(`seo:sitemap:v2:${name}`, SITEMAP_TTL_MS, async () => {
    switch (name as SitemapName) {
      case "problems": {
        // No updatedAt on the problem table; a creation date would only say
        // when the row appeared, so no lastmod is claimed at all.
        const rows = await prisma.problem.findMany({ where: { isPublished: true }, select: { slug: true }, orderBy: { createdAt: "asc" } });
        return urlset(rows.map((r) => ({ path: `/problems/${r.slug}` })));
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
        const rows = await prisma.aptitudeQuestion.findMany({ select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } });
        return urlset(rows.filter((r) => !(r.slug in APTITUDE_CANONICAL)).map((r) => ({ path: `/aptitude/q/${r.slug}`, lastmod: r.updatedAt })));
      }
      case "tests": {
        const rows = await prisma.mockTest.findMany({ where: { published: true }, select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } });
        return urlset(rows.map((r) => ({ path: `/tests/${r.slug}`, lastmod: r.updatedAt })));
      }
      case "categories": {
        // The hub pages: the catalogue's topics and companies, the bug hunts'
        // languages and layers, the aptitude sections and topics. Only the
        // hubs that exist (a topic below MIN_HUB_PROBLEMS has no page).
        const [hubs, bugs, counts] = await Promise.all([hubIndex(), bugHubIndex(), aptitudeCounts()]);
        const entries: Array<{ path: string }> = [
          ...hubs.topics.map((t) => ({ path: hubPath(t) })),
          ...hubs.companies.map((c) => ({ path: hubPath(c) })),
          ...[...bugs.languages, ...bugs.categories].filter((b) => b.count > 0).map((b) => ({ path: `/bug-hunts/${b.id}` })),
          ...APTITUDE_CATEGORIES.map((c) => ({ path: `/aptitude/${c.id}` })),
          ...APTITUDE_TOPICS.filter((t) => (counts.get(t.id)?.total ?? 0) > 0).map((t) => ({ path: `/aptitude/${t.id}` })),
        ];
        return urlset(entries);
      }
    }
  });
}
