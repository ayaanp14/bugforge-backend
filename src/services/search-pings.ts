/**
 * The daily IndexNow sweep: every public page that is new, whose sitemap
 * lastmod moved, or that left the sitemaps since the last run is sent to
 * IndexNow (Bing, Yandex, Naver, Seznam) in one request. Why, and the rules,
 * are in lib/indexnow.ts; the one store is IndexNowPing.
 *
 * The content sitemaps are built in process (sitemapXml, the same answer the
 * Worker proxies); the marketing pages' sitemap is the frontend build's, so it
 * is read off the live site — a failure there only leaves those 57 pages for
 * the next run. The first run sends everything (~5,700 URLs, inside one
 * request's 10,000); after that a day is the handful that changed.
 *
 * Rows are written only after the engines accepted the request (200/202), so
 * a refused or lost request is simply due again tomorrow — nothing is marked
 * sent that was not.
 */
import { prisma } from "../lib/prisma.js";
import { dayKey, zoned } from "../lib/clock.js";
import { registerJob, type Job } from "../lib/scheduler.js";
import { indexNowEnabled, parseSitemap, planPings, submitToIndexNow, type SitemapEntry } from "../lib/indexnow.js";
import { SITEMAP_NAMES, SITE_ORIGIN, sitemapXml } from "./seo.js";

const OFF = "off outside production or with INDEXNOW=off";
/** A row write per statement; MySQL takes far more, this keeps each one small. */
const WRITE_CHUNK = 1000;

async function sitemapEntries(): Promise<{ entries: SitemapEntry[]; unread: string[] }> {
  const unread: string[] = [];
  const parts = await Promise.all([
    ...SITEMAP_NAMES.map(async (name) => {
      const xml = await sitemapXml(name).catch(() => null);
      if (!xml) unread.push(name);
      return xml ? parseSitemap(xml, SITE_ORIGIN) : [];
    }),
    fetch(`${SITE_ORIGIN}/sitemap-pages.xml`, { signal: AbortSignal.timeout(10_000) })
      .then(async (res) => (res.ok ? parseSitemap(await res.text(), SITE_ORIGIN) : (unread.push("pages"), [])))
      .catch(() => (unread.push("pages"), [] as SitemapEntry[])),
  ]);
  return { entries: parts.flat(), unread };
}

export async function sweepSitemapsToIndexNow(): Promise<Record<string, unknown>> {
  if (!indexNowEnabled()) return { skipped: OFF };
  const { entries, unread } = await sitemapEntries();
  // A sitemap that could not be read must not read as every page in it gone.
  if (unread.length) return { skipped: "a sitemap could not be read", unread };

  const rows = await prisma.indexNowPing.findMany({ select: { path: true, lastmod: true } });
  const plan = planPings(entries, new Map(rows.map((r) => [r.path, r.lastmod])));
  if (!plan.send.length) return { urls: entries.length, sent: 0 };

  const status = await submitToIndexNow(plan.send, 30_000);
  if (status !== 200 && status !== 202) return { urls: entries.length, due: plan.send.length, refused: status };

  const now = new Date();
  for (let i = 0; i < plan.upsert.length; i += WRITE_CHUNK) {
    const chunk = plan.upsert.slice(i, i + WRITE_CHUNK);
    await prisma.$transaction([
      prisma.indexNowPing.deleteMany({ where: { path: { in: chunk.map((e) => e.path) } } }),
      prisma.indexNowPing.createMany({ data: chunk.map((e) => ({ path: e.path, lastmod: e.lastmod, sentAt: now })) }),
    ]);
  }
  for (let i = 0; i < plan.remove.length; i += WRITE_CHUNK) {
    await prisma.indexNowPing.deleteMany({ where: { path: { in: plan.remove.slice(i, i + WRITE_CHUNK) } } });
  }
  return { urls: entries.length, sent: plan.send.length, changed: plan.upsert.length, removed: plan.remove.length, deferred: plan.deferred, status };
}

const indexNowSweepJob: Job = {
  name: "indexnow_sitemaps",
  description: "Sends every public page that is new, changed (sitemap lastmod) or removed to IndexNow — Bing, which ChatGPT search and Copilot read (03:00–06:00 IST). Production only; INDEXNOW=off pauses it.",
  periodOf(now) {
    const h = zoned(now).getUTCHours();
    return h >= 3 && h < 6 ? dayKey(now) : null;
  },
  run: () => sweepSitemapsToIndexNow(),
  // Off on a dev server: no row a day to say so.
  idle: (result) => result["skipped"] === OFF,
};

export function registerSearchPingJobs(): void {
  registerJob(indexNowSweepJob);
}
