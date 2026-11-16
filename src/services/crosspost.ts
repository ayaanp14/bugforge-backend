import { prisma } from "../lib/prisma.js";
import { dayKey, zoned } from "../lib/clock.js";
import { registerJob, type Job } from "../lib/scheduler.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import { LESSON_TAGS, NOTE_TAGS, devtoArticle, interleave, nextToPost, type CrosspostItem, type FigureText } from "../lib/crosspost.js";
import { NOTE_SUBJECTS, notePath, notesFor } from "../lib/cs-notes.js";
import { lessonFigure } from "../lib/lesson-figures/index.js";
import { noteFigure } from "../lib/note-figures/index.js";
import type { Walkthrough } from "../lib/walkthroughs/core.js";
import { roadDefinition } from "./roadmap.js";
import { lessonsInOrder } from "./roadmap-lessons.js";
import { SITE_ORIGIN, headFor } from "./seo.js";

/**
 * The daily cross-post to Dev.to (lib/crosspost.ts holds the rules and why).
 *
 * Off until DEVTO_API_KEY is set (Dev.to → Settings → Extensions → "DEV
 * Community API Keys"; free). `CROSSPOST=off` pauses it with the key kept.
 * One page a day, 10:00–13:00 IST; the admin panel's Jobs tab can run it by
 * hand (POST /api/admin/jobs/crosspost_devto/run).
 *
 * Never twice: the CrossPost row is the claim and is written before the
 * request, and a page Dev.to already holds under our canonical address (one
 * posted by hand, or a run whose answer was lost) is adopted, not reposted.
 */

const PLATFORM = "devto";
const API = "https://dev.to/api";
const TIMEOUT_MS = 30_000;
const NOT_CONFIGURED = "DEVTO_API_KEY not set";

const apiKey = () => process.env["DEVTO_API_KEY"]?.trim() || null;

const figureText = (w: Walkthrough | null): FigureText | null => (w ? { title: w.title, input: w.input, captions: w.frames.map((f) => f.caption) } : null);

/** Every page that can be cross-posted, in the order they go out: the road's lessons and the notes, alternately. */
export async function crosspostQueue(): Promise<CrosspostItem[]> {
  const road = await roadDefinition();
  const lessons: CrosspostItem[] = lessonsInOrder(road).map((l) => ({
    kind: "lesson",
    path: `/roadmap/${l.slug}`,
    slug: l.slug,
    title: l.title,
    seoTitle: l.seoTitle,
    description: l.description,
    answer: l.answer,
    faq: l.faq,
    body: l.body,
    tags: LESSON_TAGS,
    series: "CodeKairo DSA Roadmap",
    home: { path: "/roadmap", label: "DSA roadmap" },
    practice: l.practice.length,
  }));
  const notes: CrosspostItem[] = NOTE_SUBJECTS.flatMap((s) =>
    [...notesFor(s.key)]
      .sort((a, b) => a.order - b.order)
      .map((n): CrosspostItem => ({
        kind: "note",
        path: notePath(n),
        slug: n.slug,
        title: n.title,
        seoTitle: n.seoTitle,
        description: n.description,
        answer: n.answer,
        faq: n.faq,
        body: n.body,
        tags: NOTE_TAGS[s.key] ?? ["computerscience", "interview", "programming"],
        series: `${s.title} for interviews`,
        home: { path: `/notes/${s.key}`, label: `${s.title} notes` },
        practice: 0,
      })),
  );
  return interleave(lessons, notes);
}

/** The Dev.to post for one page, as it would go out — also what scripts/crosspost-preview.ts prints. */
export async function devtoPostFor(item: CrosspostItem) {
  const figure = (name: string) => figureText(item.kind === "lesson" ? lessonFigure(item.slug, name) : noteFigure(item.slug, name));
  // The page's preview card (lib/content-card) is the cover where it has one: lessons do, notes do not.
  const head = await headFor(item.path).catch(() => null);
  const coverImage = head && !("redirect" in head) ? (head.image?.url ?? null) : null;
  return devtoArticle(item, { origin: SITE_ORIGIN, figure, coverImage });
}

interface DevtoArticleRow {
  id: number;
  url: string;
  canonical_url: string | null;
}

async function devto(method: "GET" | "POST", path: string, body?: unknown): Promise<{ status: number; json: unknown; text: string }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "api-key": apiKey() ?? "",
      Accept: "application/vnd.forem.api-v1+json",
      "Content-Type": "application/json",
      "User-Agent": "codekairo-crosspost",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* an HTML error page: kept as text for the log */
  }
  return { status: res.status, json, text: text.slice(0, 500) };
}

/**
 * Post the next page. Every outcome is a small object for the job's log:
 * posted, adopted (Dev.to already had it), retryLater (rate limit, a bad
 * key, Dev.to down — the claim is let go), failed (Dev.to refused the
 * content — recorded so the queue moves on), unknown (no answer after the
 * request went out — the claim is kept, so it is never posted twice), or
 * done (nothing left).
 */
export async function crosspostToDevto(): Promise<Record<string, unknown>> {
  if (!apiKey()) return { skipped: NOT_CONFIGURED };
  if (process.env["CROSSPOST"] === "off") return { skipped: "CROSSPOST=off" };

  const [queue, rows] = await Promise.all([crosspostQueue(), prisma.crossPost.findMany({ where: { platform: PLATFORM }, select: { path: true } })]);
  const item = nextToPost(queue, new Set(rows.map((r) => r.path)));
  if (!item) return { done: true, posted: rows.length };

  // What Dev.to already holds under our canonical addresses.
  const mine = await devto("GET", "/articles/me/all?per_page=1000");
  if (mine.status !== 200 || !Array.isArray(mine.json)) return { retryLater: item.path, status: mine.status, error: mine.text };
  const canonical = `${SITE_ORIGIN}${item.path}`;
  const existing = (mine.json as DevtoArticleRow[]).find((a) => a.canonical_url === canonical);

  let claimId: string;
  try {
    const row = await prisma.crossPost.create({
      data: existing
        ? { platform: PLATFORM, path: item.path, status: "posted", remoteId: String(existing.id), url: existing.url, postedAt: new Date() }
        : { platform: PLATFORM, path: item.path, status: "posting" },
      select: { id: true },
    });
    claimId = row.id;
  } catch (err) {
    if (isDuplicateKey(err)) return { skipped: "claimed by another run", path: item.path };
    throw err;
  }
  if (existing) return { adopted: item.path, url: existing.url };

  const article = await devtoPostFor(item);
  let res: Awaited<ReturnType<typeof devto>>;
  try {
    res = await devto("POST", "/articles", { article });
  } catch (err) {
    // The request may have reached Dev.to: keep the claim. The next run finds
    // the post by its canonical address if it exists; delete the row to retry.
    const error = err instanceof Error ? err.message : String(err);
    await prisma.crossPost.update({ where: { id: claimId }, data: { error }, select: { id: true } });
    return { unknown: item.path, error };
  }

  if (res.status === 200 || res.status === 201) {
    const posted = res.json as Partial<DevtoArticleRow> | null;
    await prisma.crossPost.update({
      where: { id: claimId },
      data: { status: "posted", remoteId: posted?.id != null ? String(posted.id) : null, url: posted?.url ?? null, postedAt: new Date() },
      select: { id: true },
    });
    return { posted: item.path, url: posted?.url ?? null };
  }
  if (res.status === 400 || res.status === 422) {
    // The content itself was refused: recorded, and the queue moves on.
    await prisma.crossPost.update({ where: { id: claimId }, data: { status: "failed", error: `${res.status}: ${res.text}` }, select: { id: true } });
    return { failed: item.path, status: res.status, error: res.text };
  }
  // A rate limit, a bad key, Dev.to down: nothing was made, try again later.
  await prisma.crossPost.delete({ where: { id: claimId } });
  return { retryLater: item.path, status: res.status, error: res.text };
}

const crosspostJob: Job = {
  name: "crosspost_devto",
  description: "Republishes one roadmap lesson or CS note a day on Dev.to with a canonical link back (10:00–13:00 IST). Off until DEVTO_API_KEY is set.",
  periodOf(now) {
    const h = zoned(now).getUTCHours();
    return h >= 10 && h < 13 ? dayKey(now) : null;
  },
  run: () => crosspostToDevto(),
  // Unconfigured, a run is one env read: no row a day to say so.
  idle: (result) => result["skipped"] === NOT_CONFIGURED,
};

export function registerCrosspostJobs(): void {
  registerJob(crosspostJob);
}
