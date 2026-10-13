/**
 * The day's posts: what the model is sent, the shape it must answer in, and
 * how each answer is held to that shape — pure, pinned by social.test.ts.
 * The call itself is services/social.ts (through lib/ai/provider, like every
 * AI feature); the rules the model follows are the prompt file
 * content/prompts/social-posts/v<N>.md.
 *
 * One call for all eight platforms rather than one each: the model sees
 * every post it is writing, so it can be told to open each with a different
 * line instead of pasting one post eight times — and a day costs one
 * request.
 *
 * The model writes no URL and no hashtag sign. `assemble` adds the tracked
 * link to the catalogue page as the post's first comment (calendar.ts
 * LinkPlacement; `commentFor` words it) and the hashtags in each
 * platform's form; `block` strips any URL the model wrote
 * anyway, so a post can never link somewhere we do not own.
 */

import { z } from "zod";
import type { AIMessage } from "../ai/provider.js";
import { COMPANY_RENAMED, COMPANY_TAGS } from "../companies.js";
import { PLATFORMS, PLATFORM_IDS, THEMES, trackedUrl, type PlatformId, type ThemeId } from "./calendar.js";
import type { Item } from "./item.js";
import type { SocialCopy } from "./slides.js";

export interface RawPost {
  title: string;
  body: string;
  parts: string[];
  hashtags: string[];
}

/** A post as the page shows it: the text to paste, and where the link goes. */
export interface Post {
  platform: PlatformId;
  title: string;
  text: string;
  parts: string[];
  /** Paste as the first comment (LinkedIn, Reddit); "" when the link is in the text. */
  firstComment: string;
  link: string;
  hashtags: string[];
  /** What a person should check before posting (a company the catalogue does not tag, another site's name). */
  warnings: string[];
}

const PostSchema = z.object({
  title: z.string(),
  body: z.string(),
  parts: z.array(z.string()),
  hashtags: z.array(z.string()),
});

export const SocialAnswerSchema = z.object({
  hook: z.string(),
  sub: z.string(),
  points: z.array(z.string()),
  takeaway: z.string(),
  altText: z.string(),
  imageScene: z.string(),
  posts: z.object(Object.fromEntries(PLATFORM_IDS.map((id) => [id, PostSchema])) as Record<PlatformId, typeof PostSchema>),
});
export type SocialAnswer = z.infer<typeof SocialAnswerSchema>;

/**
 * The same shape as a strict JSON Schema, for a provider that decodes to one
 * (OpenAI's structured outputs, lib/ai/provider). Strict mode wants every
 * property required and no others allowed. Keep it in step with the Zod
 * schema above, which still validates the answer.
 */
const POST_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "body", "parts", "hashtags"],
  properties: {
    title: { type: "string", description: "Reddit's title or Quora's question; empty elsewhere." },
    body: { type: "string" },
    parts: { type: "array", items: { type: "string" }, description: "X's thread; empty elsewhere." },
    hashtags: { type: "array", items: { type: "string" }, description: "Single CamelCase words, no # sign." },
  },
};
export const SOCIAL_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["hook", "sub", "points", "takeaway", "altText", "imageScene", "posts"],
  properties: {
    hook: { type: "string" },
    sub: { type: "string" },
    points: { type: "array", items: { type: "string" } },
    takeaway: { type: "string" },
    altText: { type: "string" },
    imageScene: { type: "string", description: "The poster's picture, in one or two sentences: what to draw, no words." },
    posts: { type: "object", additionalProperties: false, required: [...PLATFORM_IDS], properties: Object.fromEntries(PLATFORM_IDS.map((id) => [id, POST_JSON_SCHEMA])) },
  },
};

/**
 * The model answers as prose JSON (no strict decoding — lib/ai/provider says
 * why), so the usual slips are repaired before Zod sees the answer: a
 * missing post or field becomes empty, a string where a list belongs
 * becomes a one-item list, a platform keyed in another case is found.
 */
export function coerceSocial(raw: unknown): unknown {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
  const list = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : typeof v === "string" && v.trim() ? [v] : []);
  const postsIn = (r.posts && typeof r.posts === "object" ? r.posts : {}) as Record<string, unknown>;
  const byLower = new Map(Object.entries(postsIn).map(([k, v]) => [k.toLowerCase().replace(/[^a-z]/g, ""), v]));
  const posts = Object.fromEntries(
    PLATFORM_IDS.map((id) => {
      const p = (byLower.get(id) ?? (id === "x" ? byLower.get("twitter") : undefined) ?? {}) as Record<string, unknown>;
      return [id, { title: str(p.title), body: str(p.body ?? p.text), parts: list(p.parts ?? p.thread), hashtags: list(p.hashtags) }];
    }),
  );
  return { hook: str(r.hook), sub: str(r.sub), points: list(r.points), takeaway: str(r.takeaway), altText: str(r.altText), imageScene: str(r.imageScene), posts };
}

/* ── What the model is sent ──────────────────────────────────────────── */

const THEME_BRIEF: Record<ThemeId, string> = {
  "company-dsa":
    'A real interview problem from the catalogue, tagged for the company in the item. Lead with the company and the problem ("Amazon asks this array question"). Teach the idea behind the solution in words, never the code.',
  aptitude:
    "A placement aptitude question. Challenge the reader to solve it inside the time target and comment the option letter. Teach the shortcut. Never give the answer in the first line, in the first X part, or anywhere in the Instagram, LinkedIn, Threads, Facebook or WhatsApp posts — those send readers to the last slide. Reddit and Quora may give the full worked solution (Reddit inside a spoiler); X gives it in its last part.",
  concept: "A DSA technique from the roadmap tutorial in the item. Say when to reach for it and the core idea, in plain words, using the item's FAQ.",
  "cs-fundamentals": "A CS fundamentals interview question (operating systems, networks, DBMS or OOP) from the notes in the item. Give the crisp answer an interviewer wants, using the item's FAQ.",
  sql: "A SQL interview problem. Get readers thinking about the query — which tables, which join, which filter, which order. Never write the solution query.",
  motivation:
    'A motivating post for someone preparing for placements, built on the angle in the item. Honest and practical, not fluffy: name a real struggle, then give one concrete thing to do today. No invented stories, no "a student told us".',
  product: "One CodeKairo feature (the item). Not an ad: lead with the problem it solves for a student, then what they can do with it.",
};

const POINTS_BRIEF: Record<ThemeId, string> = {
  motivation: "3 to 5 slides, each one or two sentences (at most 30 words), building one idea from the struggle to the action",
  product: "3 or 4 things a student can do with the feature, each at most 20 words",
  sql: "3 questions to ask yourself before writing the query, each at most 20 words, never the answer",
  "company-dsa": "[] (the slides quote the catalogue)",
  aptitude: "[] (the slides quote the catalogue)",
  concept: "[] (the slides quote the catalogue)",
  "cs-fundamentals": "[] (the slides quote the catalogue)",
};

/** What the model is shown of the item: its facts, trimmed to what a post can use. */
function itemForModel(item: Item): Record<string, unknown> {
  const { key: _key, path: _path, theme: _theme, companySlug: _slug, ...rest } = item;
  const out: Record<string, unknown> = { ...rest };
  if (item.statement) out.statement = item.statement.slice(0, 1500);
  if (item.companies) out.companies = item.companies.slice(0, 12);
  if (item.options && item.answer !== undefined) out.correctOption = `${"ABCDEFGH"[item.answer]}: ${item.options[item.answer]}`;
  return out;
}

export interface SiteFacts {
  /** One paragraph about CodeKairo, with live counts. */
  summary: string;
  features: Array<{ name: string; summary: string }>;
}

/** The previous draft, when a day is being rewritten. */
export interface Revision {
  previous: { copy: SocialCopy; posts: Record<string, { title: string; text: string }> };
  change: string;
}

/** Untrusted parts (the item, the change asked for) are fenced, as every prompt here fences data. */
export function buildSocialMessages(item: Item, site: SiteFacts, rules: string, revision?: Revision): AIMessage[] {
  const theme = item.theme;
  const brief = [
    `TODAY'S THEME: ${THEMES[theme].label}. ${THEME_BRIEF[theme]}`,
    `POINTS FOR THIS THEME: ${POINTS_BRIEF[theme]}.`,
    "PLATFORMS:",
    ...PLATFORM_IDS.map((id) => `- ${id} (${PLATFORMS[id].label}): ${PLATFORMS[id].guide}`),
    "",
    "SITE FACTS:",
    site.summary,
    ...site.features.map((f) => `- ${f.name}: ${f.summary}`),
  ].join("\n");
  const user = [`BEGIN ITEM\n${JSON.stringify(itemForModel(item))}\nEND ITEM`];
  if (revision) {
    user.push(
      `BEGIN PREVIOUS DRAFT\n${JSON.stringify(revision.previous).slice(0, 12_000)}\nEND PREVIOUS DRAFT`,
      revision.change
        ? `BEGIN CHANGE ASKED FOR\n${revision.change.slice(0, 500)}\nEND CHANGE ASKED FOR\nApply it and keep the rest unless the change implies otherwise.`
        : "Write a fresh take on the same item: different hooks, different first lines.",
    );
  }
  return [
    { role: "system", content: `${rules}\n\n${brief}` },
    { role: "user", content: user.join("\n\n") },
  ];
}

/* ── Holding the answer to its shape ─────────────────────────────────── */

const line = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Keeps line breaks (posts are multi-line); drops other control characters and anything that looks like a URL. */
export function block(s: string, max: number): string {
  return s
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

const tag = (s: string) => s.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 40);

export function guardCopy(a: SocialAnswer): SocialCopy {
  return {
    hook: line(a.hook, 80),
    sub: line(a.sub, 140),
    points: a.points.map((p) => line(p, 260)).filter(Boolean).slice(0, 5),
    takeaway: line(a.takeaway, 120),
    altText: line(a.altText, 250),
    imageScene: line(a.imageScene, 400),
  };
}

export function guardPosts(a: SocialAnswer): Record<PlatformId, RawPost> {
  return Object.fromEntries(
    PLATFORM_IDS.map((id) => {
      const p = a.posts[id];
      return [
        id,
        {
          title: line(p.title, 300),
          body: block(p.body, PLATFORMS[id].maxChars),
          parts: p.parts.map((x) => block(x, 280)).filter(Boolean).slice(0, 8),
          hashtags: [...new Set(p.hashtags.map(tag).filter(Boolean))].slice(0, 20),
        },
      ];
    }),
  ) as Record<PlatformId, RawPost>;
}

/* ── Names the posts must not carry ───────────────────────────────────── */

/**
 * Other practice sites. A post naming one sends readers there, and a
 * hashtag like #LeetCodeStyle was the model's first instinct.
 */
const OTHER_SITES = ["LeetCode", "GeeksforGeeks", "GfG", "HackerRank", "HackerEarth", "CodeChef", "Codeforces", "InterviewBit", "Coding Ninjas", "AlgoExpert", "NeetCode", "Striver"];

/** Words, split at spaces, punctuation and camel case ("LeetCodeStyle" → leet, code, style). */
const tokens = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean).map((t) => t.toLowerCase());
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The names from `names` that `text` mentions as whole words — run together
 * across up to four words, so "Capital One", "#CapitalOne" and
 * "GeeksForGeeks" all count, but "isolation" does not mention Ola.
 */
export function mentions(text: string, names: readonly string[]): string[] {
  const t = tokens(text);
  return names.filter((name) => {
    const target = squash(name);
    for (let i = 0; i < t.length; i++) {
      let run = "";
      for (let j = i; j < Math.min(t.length, i + 4); j++) {
        run += t[j];
        if (run === target) return true;
        if (run.length >= target.length) break;
      }
    }
    return false;
  });
}

/**
 * The companies a post may not name: every company tag but the item's own
 * (a renamed tag counts as its new name — Facebook as Meta), and never the
 * platform the post is for ("share it on LinkedIn" is not a company claim).
 */
function foreignCompanies(item: Item, id: PlatformId): string[] {
  const own = new Set([item.company, ...(item.companies ?? [])].filter((c): c is string => Boolean(c)));
  for (const [old, now] of Object.entries(COMPANY_RENAMED)) if (own.has(now)) own.add(old);
  const platform = squash(PLATFORMS[id].label.split(" ")[0]);
  return COMPANY_TAGS.filter((c) => !own.has(c) && squash(c) !== platform && !(id === "x" && c === "Twitter"));
}

/**
 * The comment that carries the catalogue link: one sentence naming what the
 * link opens, so a reader scrolling the comments knows it is the problem
 * itself (or the question, the tutorial, the notes) and not an advert.
 */
export function commentFor(item: Item, link: string): string {
  switch (item.theme) {
    case "company-dsa":
      return `Solve "${item.title}" on CodeKairo: ${link}`;
    case "aptitude":
      return `Try this question, then see the worked solution: ${link}`;
    case "concept":
      return `The full tutorial, with code in four languages: ${link}`;
    case "cs-fundamentals":
      return `The full notes on ${item.title}: ${link}`;
    case "sql":
      return `Write the query for "${item.title}" on CodeKairo: ${link}`;
    case "motivation":
      return `Start the DSA roadmap here: ${link}`;
    case "product":
      return `Try ${item.title} on CodeKairo: ${link}`;
  }
}

/** The link and the hashtags put where each platform wants them; names the post must not carry dropped or flagged. */
export function assemble(id: PlatformId, rawIn: RawPost, item: Item, day: string, origin: string): Post {
  const link = trackedUrl(origin, item.path, id, day);
  const banned = [...foreignCompanies(item, id), ...OTHER_SITES];
  // A hashtag is the model's to drop; prose is a person's to fix, so it is flagged.
  const raw = { ...rawIn, hashtags: rawIn.hashtags.filter((t) => !mentions(t, banned).length) };
  const prose = [raw.title, raw.body, ...raw.parts].join("\n");
  const named = mentions(prose, foreignCompanies(item, id));
  const sites = mentions(prose, OTHER_SITES);
  const warnings = [
    ...(named.length ? [`Names ${named.join(", ")}, which the catalogue does not tag this ${item.theme === "company-dsa" ? "problem" : "item"} with.`] : []),
    ...(sites.length ? [`Mentions ${sites.join(", ")}.`] : []),
  ];
  const tagLine = raw.hashtags.map((t) => `#${t}`).join(" ");
  const join = (...xs: string[]) => xs.filter(Boolean).join("\n\n");
  let text: string;
  let parts = raw.parts;
  let firstComment = "";
  if (id === "x") {
    // The thread carries no link; the comment is the reply under it.
    const thread = parts.length ? [...parts] : [raw.body];
    if (tagLine && thread[0].length + 1 + tagLine.length <= 280) thread[0] += ` ${tagLine}`;
    parts = thread;
    text = thread.join("\n\n");
    firstComment = commentFor(item, link);
  } else if (PLATFORMS[id].link === "first-comment") {
    text = join(raw.body, tagLine);
    firstComment = commentFor(item, link);
  } else {
    text = join(raw.body, commentFor(item, link), tagLine);
  }
  return { platform: id, title: raw.title, text, parts, firstComment, link, hashtags: raw.hashtags, warnings };
}
