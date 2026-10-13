/**
 * The social growth module: a pack of posts for every platform, every day,
 * for the team to publish — served to the campaign page
 * (frontend campaign/public/social.html) through routes/social.ts.
 *
 * A pack is one day's work: the theme (lib/social/calendar.ts), the
 * catalogue item it is about (services/social-knowledge.ts), the slides
 * (lib/social/slides.ts, drawn as PNG by lib/social/slide-card.ts) and one
 * post per platform, written by the model through lib/ai/provider like
 * every AI feature, under content/prompts/social-posts. It is a
 * `SocialPack` row keyed by the IST day; the `social_daily` job builds
 * today's at 06:00 IST so it is waiting when the team opens the page.
 *
 * Nothing is posted from here: each platform's posting API wants an app
 * review and an OAuth token per account (Quora has none), so the page hands
 * over text, images and a composer link, and a person posts — after reading
 * it, because it is a draft.
 *
 * "Used before" is read from the rows themselves (`itemKey`, `companyKey`
 * of the last USED_WINDOW days), so a problem or a question is not posted
 * twice in that window, and two company days in a row name two companies.
 */

import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { dayKey } from "../lib/clock.js";
import { ai as nvidia, openai, openaiImage, openaiImageModel, type AIProvider } from "../lib/ai/provider.js";
import { promptFor } from "../lib/ai/prompts.js";
import type { Job } from "../lib/scheduler.js";
import {
  FORMAT_SIZE,
  PLATFORMS,
  PLATFORM_IDS,
  SUBREDDITS,
  THEMES,
  addDays,
  themeFor,
  type Format,
  type PlatformId,
  type ThemeId,
} from "../lib/social/calendar.js";
import type { Item } from "../lib/social/item.js";
import { SOCIAL_JSON_SCHEMA, SocialAnswerSchema, assemble, buildSocialMessages, coerceSocial, guardCopy, guardPosts, type Post, type RawPost, type Revision } from "../lib/social/posts.js";
import { slidesFor, type Slide, type SocialCopy } from "../lib/social/slides.js";
import { renderSlide } from "../lib/social/slide-card.js";
import { posterPrompt } from "../lib/social/poster.js";
import { itemFor, siteFacts } from "./social-knowledge.js";
import { SITE_ORIGIN } from "./seo.js";

export class SocialError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** How far from today a day may be built: a backlog behind, the week ahead. */
export const PAST_DAYS = 60;
export const AHEAD_DAYS = 14;
/** Items posted about within this many packs are not picked again. */
const USED_WINDOW = 365;
/** Eight posts — Reddit's and Quora's run to 1,800 characters — the slide words, and a reasoning model's thinking. */
const SOCIAL_TOKENS = 16000;

const json = (v: unknown) => v as Prisma.InputJsonValue;

/**
 * The model for this module: OpenAI, by the owner's choice (2026-10-13 —
 * the campaign site's mail writer is on OpenAI too), with strict structured
 * outputs. A deployment without OPENAI_API_KEY falls back to the NVIDIA
 * provider every other AI feature uses, so the daily job never just stops;
 * each pack records which model wrote it.
 */
const writer = (): AIProvider => (openai.available() ? openai : nvidia);

export interface Pack {
  day: string;
  theme: ThemeId;
  themeLabel: string;
  item: Item;
  copy: SocialCopy;
  slides: Slide[];
  posts: Record<PlatformId, Post>;
  subreddits: string[];
  posted: Partial<Record<PlatformId, string>>;
  model: string;
  via: string;
  generatedAt: string;
  editedAt: string | null;
  /** The day's poster: drawn once, posted everywhere. The bytes are their own route. */
  poster: { ready: boolean; model: string | null; error: string | null };
}

/** Every column but the poster's bytes, which only the image route reads. */
const NO_IMAGE = { image: true } as const;
type Row = Omit<Prisma.SocialPackGetPayload<object>, "image">;

function packOf(row: Row): Pack {
  const theme = row.theme as ThemeId;
  return {
    day: row.day,
    theme,
    themeLabel: THEMES[theme]?.label ?? row.theme,
    item: row.item as unknown as Item,
    copy: row.copy as unknown as SocialCopy,
    slides: row.slides as unknown as Slide[],
    posts: row.posts as unknown as Record<PlatformId, Post>,
    subreddits: SUBREDDITS[theme] ?? [],
    posted: (row.posted ?? {}) as Pack["posted"],
    model: row.model,
    via: row.via,
    generatedAt: row.generatedAt.toISOString(),
    editedAt: row.editedAt?.toISOString() ?? null,
    // `imageModel` is written only beside the bytes, so it says the poster exists.
    poster: { ready: Boolean(row.imageModel), model: row.imageModel, error: row.imageError },
  };
}

/** A day the page may ask for, or a 400. */
export function checkDay(day: unknown): string {
  const today = dayKey();
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day < addDays(today, -PAST_DAYS) || day > addDays(today, AHEAD_DAYS)) {
    throw new SocialError(`Pick a day between ${PAST_DAYS} days ago and ${AHEAD_DAYS} days ahead.`, 400);
  }
  return day;
}

async function usedKeys(exceptDay?: string): Promise<Set<string>> {
  const rows = await prisma.socialPack.findMany({ select: { day: true, itemKey: true, companyKey: true }, orderBy: { day: "desc" }, take: USED_WINDOW });
  const out = new Set<string>();
  for (const r of rows) {
    if (r.day === exceptDay) continue;
    out.add(r.itemKey);
    if (r.companyKey) out.add(`company:${r.companyKey}`);
  }
  return out;
}

interface Written {
  copy: SocialCopy;
  raw: Record<PlatformId, RawPost>;
  model: string;
  promptVersion: number;
}

/** The model's posts and slide words for an item, held to shape. */
async function writePosts(item: Item, revision?: Revision): Promise<Written> {
  const ai = writer();
  if (!ai.available()) throw new SocialError("No AI provider is configured on this deployment: set OPENAI_API_KEY.", 503);
  const prompt = promptFor("social-posts");
  const messages = buildSocialMessages(item, await siteFacts(), prompt.text, revision);
  let parsed;
  try {
    ({ parsed } = await ai.json(messages, SocialAnswerSchema, "social_posts", { maxTokens: SOCIAL_TOKENS, temperature: 0.7, coerce: coerceSocial, jsonSchema: SOCIAL_JSON_SCHEMA }));
  } catch (err) {
    console.error("social: the model failed:", (err as Error).message);
    throw new SocialError("The model could not write the posts. Try again in a minute.", 502);
  }
  const copy = guardCopy(parsed);
  const raw = guardPosts(parsed);
  if (PLATFORM_IDS.every((id) => !raw[id].body && !raw[id].parts.length)) throw new SocialError("The model wrote no posts. Try again.", 502);
  return { copy, raw, model: ai.model(), promptVersion: prompt.version };
}

function postsFor(item: Item, day: string, written: Written): Record<PlatformId, Post> {
  return Object.fromEntries(PLATFORM_IDS.map((id) => [id, assemble(id, written.raw[id], item, day, SITE_ORIGIN)])) as Record<PlatformId, Post>;
}

/**
 * A new item gets a new poster, so its old one is dropped here and drawn
 * after (`drawPoster`); a rewrite keeps the day's item and its poster — the
 * picture is made once, by the owner's ask, and "New poster" on the page
 * draws it again when the words changed.
 */
async function save(day: string, item: Item, written: Written, via: "job" | "page", userId: string | null, keepPosted?: unknown, newItem = true): Promise<Pack> {
  const data = {
    ...(newItem ? { image: null, imageModel: null, imageError: null } : {}),
    theme: item.theme,
    itemKey: item.key,
    companyKey: item.companySlug ?? null,
    item: json(item),
    copy: json(written.copy),
    slides: json(slidesFor(item, written.copy)),
    posts: json(postsFor(item, day, written)),
    posted: json(keepPosted ?? {}),
    model: written.model,
    promptVersion: written.promptVersion,
    via,
    createdById: userId,
    generatedAt: new Date(),
    editedAt: null,
  };
  const row = await prisma.socialPack.upsert({ where: { day }, create: { day, ...data }, update: data, omit: NO_IMAGE });
  forgetImages(day);
  return packOf(row);
}

/* ── The poster ──────────────────────────────────────────────────────── */

/**
 * Draws the day's poster with the image model and stores it on the row.
 * Never fails the day: the posts are already saved, so a refusal or a
 * timeout is kept as `imageError` for the page to show beside a retry.
 */
export async function drawPoster(day: string): Promise<Pack> {
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { item: true, copy: true } });
  if (!row) throw new SocialError("No pack for that day.", 404);
  let data: { image: Uint8Array<ArrayBuffer> | null; imageModel: string | null; imageError: string | null };
  if (!openai.available()) {
    data = { image: null, imageModel: null, imageError: "No OPENAI_API_KEY on the API, so no poster was drawn." };
  } else {
    try {
      const { bytes, model } = await openaiImage(posterPrompt(row.item as unknown as Item, row.copy as unknown as SocialCopy), { size: "1024x1024" });
      data = { image: new Uint8Array(bytes), imageModel: model, imageError: null };
    } catch (err) {
      console.error("social: the poster failed:", (err as Error).message);
      data = { image: null, imageModel: null, imageError: (err as Error).message.slice(0, 300) };
    }
  }
  const updated = await prisma.socialPack.update({ where: { day }, data, omit: NO_IMAGE });
  forgetImages(day);
  return packOf(updated);
}

/** The poster's JPEG, or null when the day has none. */
export async function posterJpeg(day: string): Promise<Buffer | null> {
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { image: true } });
  return row?.image ? Buffer.from(row.image) : null;
}

/* ── Reads and writes for the routes ─────────────────────────────────── */

export async function getPack(day: string): Promise<Pack | null> {
  const row = await prisma.socialPack.findUnique({ where: { day }, omit: NO_IMAGE });
  return row ? packOf(row) : null;
}

/** The strip at the top of the page: the week behind and ahead, and the older history. */
export async function socialCalendar() {
  const today = dayKey();
  const from = addDays(today, -6);
  const days = Array.from({ length: 14 }, (_, i) => addDays(from, i));
  const [near, older] = await Promise.all([
    prisma.socialPack.findMany({ where: { day: { in: days } }, select: { day: true, theme: true, item: true, posted: true } }),
    prisma.socialPack.findMany({ where: { day: { lt: from } }, select: { day: true, theme: true, item: true, posted: true }, orderBy: { day: "desc" }, take: 30 }),
  ]);
  const row = (r: (typeof near)[number]) => ({
    day: r.day,
    theme: r.theme,
    title: (r.item as unknown as Item).title,
    postedCount: Object.keys((r.posted ?? {}) as object).length,
  });
  const byDay = new Map(near.map((r) => [r.day, row(r)]));
  return {
    today,
    days: days.map((day) => byDay.get(day) ?? { day, theme: themeFor(day), title: "", postedCount: 0, planned: true }),
    history: older.map(row),
    themes: Object.entries(THEMES).map(([id, t]) => ({ id, ...t })),
    platforms: PLATFORM_IDS.map((id) => ({ id, label: PLATFORMS[id].label, format: PLATFORMS[id].format, maxChars: PLATFORMS[id].maxChars, images: PLATFORMS[id].images, link: PLATFORMS[id].link })),
    canWrite: writer().available(),
    writer: writer().available() ? `${writer().name} · ${writer().model()}` : null,
    painter: openai.available() ? openaiImageModel() : null,
  };
}

/**
 * Builds a day. `new` returns the day as it is when it already exists;
 * `another` picks a different item (the current one stays in "used");
 * `rewrite` keeps the item and rewrites the posts, with the change asked for.
 */
export async function generateDay(input: { day: string; mode: "new" | "another" | "rewrite"; theme?: ThemeId; change?: string }, userId: string | null, via: "job" | "page" = "page"): Promise<Pack> {
  const existing = await prisma.socialPack.findUnique({ where: { day: input.day }, omit: NO_IMAGE });
  if (input.mode === "rewrite") {
    if (!existing) throw new SocialError("There is nothing to rewrite for that day yet.", 404);
    const pack = packOf(existing);
    const previous = { copy: pack.copy, posts: Object.fromEntries(PLATFORM_IDS.map((id) => [id, { title: pack.posts[id]?.title ?? "", text: pack.posts[id]?.text ?? "" }])) };
    const written = await writePosts(pack.item, { previous, change: (input.change ?? "").trim() });
    // Same item, same poster: the picture is drawn once a day.
    return save(input.day, pack.item, written, via, userId, existing.posted, false);
  }
  if (input.mode === "new" && existing) return packOf(existing);
  const theme = input.theme ?? (existing?.theme as ThemeId | undefined) ?? themeFor(input.day);
  const used = await usedKeys(input.mode === "another" ? undefined : input.day);
  // A random salt moves the seed, so "another" lands somewhere new.
  const salt = input.mode === "another" ? `:${Math.random().toString(36).slice(2)}` : "";
  const item = await itemFor(theme, input.day, used, salt).catch((err: Error) => {
    throw new SocialError(err.message, 502);
  });
  await save(input.day, item, await writePosts(item), via, userId);
  return drawPoster(input.day);
}

export async function markPosted(day: string, platform: PlatformId, posted: boolean): Promise<Pack["posted"]> {
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { posted: true } });
  if (!row) throw new SocialError("No pack for that day.", 404);
  const next = { ...((row.posted ?? {}) as Record<string, string>) };
  if (posted) next[platform] = new Date().toISOString();
  else delete next[platform];
  await prisma.socialPack.update({ where: { day }, data: { posted: json(next) } });
  return next;
}

/** A person's edit of one post, kept so whoever posts later pastes the edited text. */
export async function editPost(day: string, platform: PlatformId, edit: { title?: unknown; text?: unknown; firstComment?: unknown }): Promise<Post> {
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { posts: true } });
  if (!row) throw new SocialError("No pack for that day.", 404);
  const posts = row.posts as unknown as Record<PlatformId, Post>;
  const str = (v: unknown, max: number, fallback: string) => (typeof v === "string" ? v.slice(0, max) : fallback);
  const before = posts[platform];
  const post: Post = {
    ...before,
    title: str(edit.title, 300, before.title),
    text: str(edit.text, 40_000, before.text),
    firstComment: str(edit.firstComment, 2_000, before.firstComment),
  };
  await prisma.socialPack.update({ where: { day }, data: { posts: json({ ...posts, [platform]: post }), editedAt: new Date() } });
  return post;
}

/* ── Images ──────────────────────────────────────────────────────────── */

/**
 * The last slides drawn. A slide is ~80 ms on the card worker; the page
 * shows a day's six to nine slides at once and re-asks on every visit, so a
 * small LRU (~120 × ~80 KB) keeps a session from redrawing them. Dropped
 * per day whenever a day is rebuilt.
 */
const MAX_CACHED = 120;
const recent = new Map<string, Buffer>();

function forgetImages(day: string): void {
  for (const k of recent.keys()) if (k.startsWith(`${day}|`)) recent.delete(k);
}

export async function slidePng(day: string, index: number, format: Format): Promise<Buffer> {
  const key = `${day}|${format}|${index}`;
  const hit = recent.get(key);
  if (hit) {
    recent.delete(key);
    recent.set(key, hit);
    return hit;
  }
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { slides: true } });
  const slides = (row?.slides ?? []) as unknown as Slide[];
  const slide = slides[index];
  if (!slide) throw new SocialError("No such slide.", 404);
  const png = await renderSlide(slide, index, slides.length, format);
  recent.set(key, png);
  if (recent.size > MAX_CACHED) recent.delete(recent.keys().next().value as string);
  return png;
}

/**
 * The poster then every slide as one PDF, a page each — what LinkedIn takes
 * as a document post and shows as a swipeable carousel (its most-shared
 * format for this kind of content). pdfkit, as the resume export uses it.
 */
export async function slidesPdf(day: string, format: Format): Promise<Buffer> {
  const row = await prisma.socialPack.findUnique({ where: { day }, select: { slides: true, image: true } });
  const slides = (row?.slides ?? []) as unknown as Slide[];
  if (!slides.length) throw new SocialError("No pack for that day.", 404);
  const pages: Buffer[] = row?.image ? [Buffer.from(row.image)] : [];
  for (let i = 0; i < slides.length; i++) pages.push(await slidePng(day, i, format));
  // Half the pixel size in points (540 pt for the square set), which LinkedIn renders at full width.
  const { width, height } = FORMAT_SIZE[format];
  const w = width / 2;
  const h = height / 2;
  const pngs = pages;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [w, h], margin: 0, autoFirstPage: false, info: { Title: `CodeKairo — ${day}`, Author: "CodeKairo" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const png of pngs) {
      doc.addPage({ size: [w, h], margin: 0 });
      doc.image(png, 0, 0, { width: w, height: h });
    }
    doc.end();
  });
}

/* ── The daily job ───────────────────────────────────────────────────── */

/**
 * Today's pack at 06:00–09:00 IST, once a day (lib/scheduler's JobRun
 * claim). Quiet when no AI provider is configured; a day already built from
 * the page is left alone.
 */
export const socialDailyJob: Job = {
  name: "social_daily",
  description: "Builds today's social media posts and slides (the campaign page's Social module).",
  periodOf(now) {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(now));
    return hour >= 6 && hour < 9 ? dayKey(now) : null;
  },
  async run(now) {
    if (!writer().available()) return { skipped: "no AI provider" };
    const day = dayKey(now);
    const existing = await prisma.socialPack.findUnique({ where: { day }, select: { day: true } });
    if (existing) return { skipped: "already built" };
    const pack = await generateDay({ day, mode: "new" }, null, "job");
    return { day, theme: pack.theme, item: pack.item.key };
  },
};
