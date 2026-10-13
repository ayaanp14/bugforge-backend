/**
 * The social module's calendar and platform table — pure, pinned by
 * social.test.ts.
 *
 * Why a weekly rotation and not "whatever the model fancies": a feed that
 * grows is one people can predict ("Tuesday is the aptitude one"), and a
 * fixed rotation keeps the mix honest — interview problems most days,
 * motivation once a week, the product itself every other Sunday at most, so
 * the accounts read as a study resource rather than an ad channel. The page
 * can still choose another theme for a day.
 *
 * Days are Indian Standard Time, like the rest of the product's calendar
 * (lib/clock): the audience is in India and the daily job runs at 06:00 IST.
 */

export type ThemeId = "company-dsa" | "aptitude" | "concept" | "cs-fundamentals" | "sql" | "motivation" | "product";

export const THEMES: Record<ThemeId, { label: string; blurb: string }> = {
  "company-dsa": { label: "Company DSA", blurb: "A real interview problem a company is tagged for, with the idea behind it." },
  aptitude: { label: "Aptitude", blurb: "A placement aptitude question: solve it, then the shortcut." },
  concept: { label: "DSA concept", blurb: "One technique from the DSA roadmap, explained." },
  "cs-fundamentals": { label: "CS fundamentals", blurb: "An OS, networks, DBMS or OOP interview question and its crisp answer." },
  sql: { label: "SQL", blurb: "A SQL interview problem to think through." },
  motivation: { label: "Motivation", blurb: "An honest, practical push for someone preparing for placements." },
  product: { label: "Product spotlight", blurb: "One CodeKairo feature, shown through what it lets a student do." },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export const isTheme = (v: unknown): v is ThemeId => typeof v === "string" && v in THEMES;

/** Sunday → Saturday. Sunday alternates SQL and the product by week (see `themeFor`). */
const WEEK: Array<ThemeId | "sunday"> = ["sunday", "company-dsa", "aptitude", "concept", "company-dsa", "cs-fundamentals", "motivation"];

export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

export function themeFor(day: string): ThemeId {
  const t = Date.parse(`${day}T00:00:00Z`);
  const slot = WEEK[new Date(t).getUTCDay()];
  if (slot !== "sunday") return slot;
  return Math.floor(t / (7 * 86_400_000)) % 2 === 0 ? "sql" : "product";
}

/** FNV-1a: the same day and theme always seed the same pick. */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * One element of `list` by seed, skipping keys already used. When every
 * element has been used, repeats are allowed again rather than failing a
 * day — 1,500 problems last years, but a dozen motivation angles do not.
 */
export function pick<T>(list: readonly T[], seed: number, used: ReadonlySet<string>, keyOf: (t: T) => string): T | undefined {
  if (!list.length) return undefined;
  const fresh = list.filter((t) => !used.has(keyOf(t)));
  const from = fresh.length ? fresh : list;
  return from[seed % from.length];
}

/**
 * Motivation angles: the struggle each post starts from. The model writes
 * the post; the angle keeps a month of Saturdays from saying the same thing.
 */
export const MOTIVATION_ANGLES = [
  "Consistency beats intensity: one problem a day for a month against a ten-hour weekend",
  "A rejection is data: what to write down after an interview that went badly",
  "Comparing your prep to a friend's offer or a LinkedIn post",
  "Starting DSA late, in final year, and what to do first",
  "Being afraid of a problem you cannot solve in 20 minutes, and what to do at minute 20",
  "The difference between reading a solution and being able to write it",
  "Nerves before a mock or real interview, and thinking aloud",
  "Burnout during placement season and why a rest day is part of the plan",
  "Debugging as a skill: reading code you did not write",
  "Asking for help, and how to ask a good question",
  "Tracking progress by what you can now solve, not by hours spent",
  "Aptitude rounds feel like school maths: speed comes from patterns, not talent",
] as const;

export type PlatformId = "linkedin" | "instagram" | "x" | "threads" | "facebook" | "reddit" | "quora" | "whatsapp";

export type Format = "portrait" | "square" | "landscape";

/** Pixel sizes of the slide images: 4:5 for the feeds, 1:1, and 16:9 for the link-card platforms. */
export const FORMAT_SIZE: Record<Format, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1600, height: 900 },
};

export const isFormat = (v: unknown): v is Format => typeof v === "string" && v in FORMAT_SIZE;

/**
 * Where the link to the catalogue page goes. The owner's rule (2026-10-13):
 * the problem's link is commented on every platform, so anyone can open the
 * problem from the post — and it suits the platforms too: LinkedIn shows a
 * post with a link in its text to fewer people, most subreddits remove one,
 * an Instagram caption's link is not clickable. On X the comment is a reply
 * under the thread. A WhatsApp channel takes no comments, so its link stays
 * at the end of the message.
 */
export type LinkPlacement = "first-comment" | "end";

export interface Platform {
  label: string;
  format: Format;
  /** What the platform accepts per post (X: per part). */
  maxChars: number;
  link: LinkPlacement;
  /** How many images a post takes, for the page's note. */
  images: string;
  /** The writing brief for this platform, read by the model. */
  guide: string;
}

export const PLATFORMS: Record<PlatformId, Platform> = {
  linkedin: {
    label: "LinkedIn",
    format: "square",
    maxChars: 3000,
    link: "first-comment",
    images: "The poster on its own, or the PDF (poster + slides) as a document post for a swipeable carousel.",
    guide: 'title "". parts []. body: 900 to 1,300 characters. The first line is the hook in under 12 words, then a blank line. Short paragraphs of one or two lines; a few lines may start with "→". Teach one idea from the item. End with a question that invites comments. hashtags: 3 to 5.',
  },
  instagram: {
    label: "Instagram",
    format: "square",
    maxChars: 2200,
    link: "first-comment",
    images: "The poster on its own, or poster + slides as a carousel (up to 20).",
    guide: 'title "". parts []. body: the caption, 400 to 900 characters. The first line is the hook (Instagram cuts the caption after about 125 characters). Tell readers to swipe through the slides, then ask them to comment their answer or save the post. The last line: "The link to the problem is in the first comment." hashtags: 8 to 15, mixing broad and specific.',
  },
  x: {
    label: "X",
    format: "square",
    maxChars: 280,
    link: "first-comment",
    images: "The poster on the first post (up to 4 images).",
    guide: 'title "". parts: a thread of 3 to 6 posts, each at most 270 characters (the link goes in a reply under the thread). Part 1 must stand alone as the hook. body: the same text as part 1. hashtags: 1 or 2.',
  },
  threads: {
    label: "Threads",
    format: "square",
    maxChars: 500,
    link: "first-comment",
    images: "The poster, or poster + slides (up to 10).",
    guide: 'title "". parts []. body: at most 420 characters, conversational, one idea, ending with a question. hashtags: 0 or 1 (Threads takes one topic tag).',
  },
  facebook: {
    label: "Facebook",
    format: "square",
    maxChars: 5000,
    link: "first-comment",
    images: "The poster, or poster + slides as an album.",
    guide: 'title "". parts []. body: 300 to 700 characters, friendly, short paragraphs, ending with a question. hashtags: 2 or 3.',
  },
  reddit: {
    label: "Reddit",
    format: "square",
    maxChars: 40000,
    link: "first-comment",
    images: "Text posts do best; an image post takes the poster.",
    guide:
      "title: at most 120 characters, a genuine and specific discussion title, no clickbait, no brand name. parts []. body: Markdown, 800 to 1,800 characters, that teaches the item properly — for a problem: the task in one sentence, the key idea, the approach as a numbered list, the complexity, the pitfalls; for an aptitude question: the question, the options, and the worked solution inside a spoiler (>!like this!<). End with one plain line saying it comes from the CodeKairo team's practice set, and an open question. hashtags [].",
  },
  quora: {
    label: "Quora",
    format: "square",
    maxChars: 20000,
    link: "first-comment",
    images: "Optional: the poster inside the answer.",
    guide:
      'title: a question people actually search for on Quora, which this answer answers (for example "How do I solve Two Sum in O(n) time?"). parts []. body: the answer, 900 to 1,800 characters, plain paragraphs and one numbered list, an expert\'s tone; answer the question in the first two sentences. End with one line saying the CodeKairo team wrote it. hashtags [].',
  },
  whatsapp: {
    label: "WhatsApp / Telegram",
    format: "square",
    maxChars: 1000,
    link: "end",
    images: "The poster, with the text as its caption.",
    guide: 'title "". parts []. body: for a WhatsApp channel or a Telegram group, at most 600 characters. The first line in *bold* with WhatsApp\'s asterisks. Short lines with line breaks between them. End with a short call to try it. hashtags [].',
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

export const isPlatform = (v: unknown): v is PlatformId => typeof v === "string" && v in PLATFORMS;

/**
 * Communities a Reddit post could go to, for the page to suggest. Names
 * only — every subreddit has its own self-promotion rules, and the page
 * says to read them before posting.
 */
export const SUBREDDITS: Record<ThemeId, string[]> = {
  "company-dsa": ["r/leetcode", "r/developersIndia", "r/csMajors"],
  aptitude: ["r/developersIndia", "r/Indian_Academia"],
  concept: ["r/learnprogramming", "r/leetcode", "r/developersIndia"],
  "cs-fundamentals": ["r/developersIndia", "r/csMajors", "r/learnprogramming"],
  sql: ["r/SQL", "r/learnSQL"],
  motivation: ["r/developersIndia", "r/csMajors"],
  product: ["r/SideProject", "r/developersIndia"],
};

/**
 * The site address with campaign tags. Every PlatformId is a `utm_source`
 * lib/traffic-source.ts already knows, so the admin's "Where visitors come
 * from" names the platform and the day's campaign.
 */
export function trackedUrl(origin: string, path: string, platform: PlatformId, day: string): string {
  const u = new URL(path, origin);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", `daily-${day}`);
  return u.toString();
}
