/**
 * Cross-posting: one roadmap lesson or CS note a day republished on Dev.to,
 * with its canonical link back here (services/crosspost.ts runs it).
 *
 * The owner's ask (2026-11-17): reach readers for free, every day, without
 * writing anything new. Dev.to's own pages rank and its feed has readers;
 * `canonical_url` tells search engines the original is ours, so the copy
 * adds reach without competing with the page. Hashnode was the other
 * candidate and was dropped: since 13 May 2026 its API needs a paid Pro plan.
 *
 * Pure: the order of the queue and the Markdown a post carries. Our pages
 * are not plain Markdown — code groups (one program in four languages and
 * its output), `@figure` animations, `@walkthrough` — so each is turned into
 * what Dev.to can show: labelled fences, the figure's steps as a numbered
 * list with a link to the animation, and every site link made absolute with
 * utm tags, so the visits it sends are filed as this campaign
 * (lib/traffic-source).
 */

import { lessonBlocks } from "./roadmap-lessons.js";

export type CrosspostKind = "lesson" | "note";

export interface CrosspostItem {
  kind: CrosspostKind;
  /** The page republished: /roadmap/<slug> or /notes/<subject>/<slug>. */
  path: string;
  /** The lesson's or note's slug — also what its figures are filed under. */
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  /** The page's direct answer to its own question. */
  answer: string;
  faq: ReadonlyArray<{ q: string; a: string }>;
  body: string;
  /** Dev.to tags, at most four. */
  tags: readonly string[];
  /** The Dev.to series the post joins, so a reader of one sees the rest. */
  series: string;
  /** Where the post's closing line points: the roadmap, or the note's subject. */
  home: { path: string; label: string };
  /** How many practice problems the page lists, for the closing line (lessons). */
  practice: number;
}

/** A figure's words: its heading, its example and a caption per step (lib/walkthroughs Frame). */
export interface FigureText {
  title: string;
  input: string;
  captions: readonly string[];
}

/** Lessons and notes alternately, so both audiences get a post every other day. */
export function interleave<T>(a: readonly T[], b: readonly T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

/** The first page in the queue not yet claimed on the platform. */
export function nextToPost(queue: readonly CrosspostItem[], taken: ReadonlySet<string>): CrosspostItem | null {
  return queue.find((item) => !taken.has(item.path)) ?? null;
}

/** Dev.to keeps a tag's letters and digits only, lower-cased; a post takes at most four. */
export function devtoTags(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const t of raw) {
    const tag = t.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (tag) seen.add(tag);
    if (seen.size === 4) break;
  }
  return [...seen];
}

/** The tags a lesson or a subject's notes carry: tags Dev.to readers already follow. */
export const LESSON_TAGS = ["dsa", "algorithms", "programming", "interview"] as const;
export const NOTE_TAGS: Readonly<Record<string, readonly string[]>> = {
  "operating-systems": ["computerscience", "interview", "programming", "beginners"],
  "computer-networks": ["networking", "computerscience", "interview", "programming"],
  dbms: ["database", "sql", "computerscience", "interview"],
  oop: ["oop", "programming", "computerscience", "interview"],
  "system-design": ["systemdesign", "architecture", "interview", "programming"],
  "low-level-design": ["designpatterns", "oop", "systemdesign", "interview"],
};

/** A link to a page of ours from a post: absolute, with the campaign's utm tags before any fragment. */
export function siteLink(origin: string, path: string, campaign: string): string {
  const hash = path.indexOf("#");
  const [base, fragment] = hash >= 0 ? [path.slice(0, hash), path.slice(hash)] : [path, ""];
  const sep = base.includes("?") ? "&" : "?";
  return `${origin}${base}${sep}utm_source=devto&utm_medium=crosspost&utm_campaign=${encodeURIComponent(campaign)}${fragment}`;
}

/**
 * Every Markdown link to one of our pages (`](/problems/two-sum)`) made
 * absolute and tagged; an in-page anchor (`](#why)`) points at the original
 * page's anchor, since the copy's headings get Dev.to's own ids.
 */
export function absolutize(markdown: string, origin: string, page: string, campaign: string): string {
  return markdown
    .replace(/\]\(\/(?!\/)([^)\s]*)\)/g, (_m, rest: string) => `](${siteLink(origin, `/${rest}`, campaign)})`)
    .replace(/\]\(#([^)\s]+)\)/g, (_m, id: string) => `](${siteLink(origin, `${page}#${id}`, campaign)})`);
}

/** Dev.to runs `{% … %}` as Liquid anywhere in a post, code included; a fence that holds it is shown raw. */
export function liquidSafe(fence: string): string {
  return /\{%|%\}/.test(fence) ? `{% raw %}\n${fence}\n{% endraw %}` : fence;
}

const LANGUAGE_LABEL: Readonly<Record<string, string>> = { cpp: "C++", java: "Java", python: "Python", javascript: "JavaScript" };

/** A fence long enough for its contents (a program that itself holds ``` gets ````). */
function fence(language: string, code: string): string {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((m) => m[0].length));
  const ticks = "`".repeat(longest + 1);
  return liquidSafe(`${ticks}${language}\n${code.replace(/\n+$/, "")}\n${ticks}`);
}

function figureMarkdown(f: FigureText, animated: string | null): string {
  const head = `**Figure: ${f.title}**${f.input ? ` — \`${f.input.replace(/`/g, "'")}\`` : ""}`;
  const steps = f.captions.length === 1 ? f.captions[0] : f.captions.map((c, i) => `${i + 1}. ${c}`).join("\n");
  const watch = animated ? `*▶ [Watch this figure animated, step by step](${animated})*` : null;
  return [head, steps, watch].filter(Boolean).join("\n\n");
}

export interface DevtoArticle {
  title: string;
  body_markdown: string;
  published: boolean;
  /**
   * An array. The Forem v1 docs type it as a comma-separated string, but the
   * first post (2026-11-17) sent that way went up with tags Dev.to chose
   * itself (algorithms, beginners, performance, tutorial); the same four sent
   * as an array stuck.
   */
  tags: string[];
  canonical_url: string;
  description: string;
  series: string;
  main_image?: string;
}

/**
 * The post for one page. `figure` resolves an `@figure` name to its words
 * (null when the page has no such figure — the line is then dropped, as the
 * page itself would show nothing); `coverImage` is the page's preview card.
 */
export function devtoArticle(
  item: CrosspostItem,
  opts: { origin: string; figure: (name: string) => FigureText | null; coverImage?: string | null },
): DevtoArticle {
  const { origin } = opts;
  const campaign = item.slug;
  const original = `${origin}${item.path}`;
  const tracked = siteLink(origin, item.path, campaign);
  let animatedLinked = false;

  const parts: string[] = [
    `*First published on [CodeKairo](${tracked}), where the figures in this ${item.kind === "lesson" ? "lesson" : "note"} are animated step by step.*`,
    `> **In short:** ${item.answer}`,
  ];
  for (const block of lessonBlocks(item.body)) {
    if (block.kind === "text") {
      parts.push(absolutize(block.markdown.trim(), origin, item.path, campaign));
    } else if (block.kind === "code") {
      // The page shows one language at a time; a post shows them in turn, each named.
      for (const s of block.samples) parts.push(`**${LANGUAGE_LABEL[s.language] ?? s.language}**\n\n${fence(s.language, s.code)}`);
      if (block.output !== null) parts.push(`**Output**\n\n${fence("text", block.output)}`);
    } else if (block.kind === "figure") {
      const f = opts.figure(block.name);
      if (!f) continue;
      // The animation is linked once — under the first animated figure — not after every one.
      const link = !animatedLinked && f.captions.length > 1 ? tracked : null;
      if (link) animatedLinked = true;
      parts.push(figureMarkdown(f, link));
    } else {
      parts.push(`*▶ The step-by-step walkthrough for this topic is on [CodeKairo](${tracked}).*`);
    }
  }
  if (item.faq.length) {
    parts.push("## Common questions");
    for (const { q, a } of item.faq) parts.push(`**${q}**\n\n${absolutize(a, origin, item.path, campaign)}`);
  }
  const practice =
    item.kind === "lesson" && item.practice > 0
      ? ` The ${item.practice} practice problems for it are at the end of the [original lesson](${tracked}) — solve them in any of 13 languages, free.`
      : ` Read it with the animated figures on [CodeKairo](${tracked}).`;
  parts.push(`---\n\n*This is part of CodeKairo's free [${item.home.label}](${siteLink(origin, item.home.path, campaign)}).${practice}*`);

  return {
    title: item.seoTitle.slice(0, 128),
    body_markdown: parts.join("\n\n") + "\n",
    published: true,
    tags: devtoTags(item.tags),
    canonical_url: original,
    description: item.description,
    series: item.series,
    ...(opts.coverImage ? { main_image: opts.coverImage } : {}),
  };
}
