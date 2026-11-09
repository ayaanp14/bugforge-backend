/**
 * Our YouTube videos on the site's own pages (the owner's ask, 2026-11-09: the
 * channel's videos had a handful of views while the problem pages they explain
 * get search traffic every day). The daily video's publish job names each
 * upload's pages (the problem and the lesson behind it, video/src/site.ts) and
 * recordUpload in services/video-studio.ts writes a row per page for a public
 * upload; a problem's editorial answer carries them (routes/problems.ts), so a
 * video sits behind the same tab, and the same "help taken" rule, as the editorial.
 */
import { prisma } from "../lib/prisma.js";

/** A page path we link videos to: lower-case letters, digits, dashes and slashes, nothing else. */
const PAGE = /^\/[a-z0-9-]+(\/[a-z0-9-]+){0,3}$/;

export interface SiteVideo {
  id: string;
  title: string;
  kind: "video" | "short";
  seconds: number | null;
}

/** Paths from the publish job's body, kept only if they look like one of our pages. */
export function pagePaths(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const paths = raw.map((p) => String(p ?? "").trim()).filter((p) => p.length <= 200 && PAGE.test(p));
  return [...new Set(paths)].slice(0, 4);
}

export async function recordSiteVideo(paths: string[], video: { youtubeId: string; kind: "video" | "short"; title: string; seconds: number | null }) {
  for (const path of paths) {
    await prisma.siteVideo.upsert({
      where: { path_youtubeId: { path, youtubeId: video.youtubeId } },
      create: { path, ...video },
      update: { title: video.title, seconds: video.seconds },
    });
  }
}

/**
 * The newest long video for a page. Shorts are recorded too but not shown: on the
 * site the long explanation is the one worth a reader's time (the owner's call,
 * 2026-11-09, the day both went up).
 */
export async function videosForPath(path: string): Promise<SiteVideo[]> {
  const row = await prisma.siteVideo.findFirst({ where: { path, kind: "video" }, orderBy: { createdAt: "desc" } });
  return row ? [{ id: row.youtubeId, title: row.title, kind: "video", seconds: row.seconds }] : [];
}
