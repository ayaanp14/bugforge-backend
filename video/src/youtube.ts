/**
 * The upload itself: YouTube's resumable protocol over plain fetch. A failed
 * chunk asks how far the last attempt got rather than starting over, so one bad
 * minute on the network cannot post the day's video twice.
 */
import { readFileSync, statSync } from "node:fs";
import type { Timeline } from "./types.ts";

const API = process.env["YOUTUBE_API_URL"] || "https://www.googleapis.com";
const CHUNK = 16 * 1024 * 1024;
const EDUCATION = "27";

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** YouTube refuses `<` and `>` in both fields, and a title over 100 characters. */
const clean = (s: string) => s.replace(/[<>]/g, "");

export interface Upload {
  title: string;
  description: string;
  tags: string[];
  privacy: "public" | "unlisted" | "private";
}

export async function uploadVideo(token: string, file: string, meta: Upload): Promise<string> {
  const size = statSync(file).size;
  const start = await fetch(`${API}/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(size),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify({
      snippet: {
        title: clean(meta.title).slice(0, 100),
        description: clean(meta.description).slice(0, 4900),
        // YouTube's limit is 500 characters across all of them.
        tags: meta.tags.slice(0, 15).filter((_, i, all) => all.slice(0, i + 1).join(",").length <= 450),
        categoryId: EDUCATION,
        defaultLanguage: "en",
        defaultAudioLanguage: "en",
      },
      status: {
        privacyStatus: meta.privacy,
        selfDeclaredMadeForKids: false,
        // The field covers realistic altered content (a real person made to say
        // something, a scene that never happened). A labelled diagram animation is not.
        containsSyntheticMedia: false,
      },
    }),
  });
  if (!start.ok) throw new Error(`YouTube refused the upload: ${start.status} ${(await start.text()).slice(0, 500)}`);
  const session = start.headers.get("location");
  if (!session) throw new Error("YouTube gave no upload address.");

  const bytes = readFileSync(file);
  let sent = 0;
  let failures = 0;
  while (true) {
    const end = Math.min(sent + CHUNK, size);
    let res: Response | null = null;
    try {
      res = await fetch(session, {
        method: "PUT",
        headers: { "Content-Length": String(end - sent), "Content-Range": `bytes ${sent}-${end - 1}/${size}` },
        body: bytes.subarray(sent, end),
      });
    } catch (e) {
      console.warn(`  upload: ${(e as Error).message}`);
    }
    if (res && (res.status === 200 || res.status === 201)) {
      const video = (await res.json()) as { id: string };
      return video.id;
    }
    if (res && res.status === 308) {
      const range = res.headers.get("range");
      sent = range ? Number(range.split("-")[1]) + 1 : 0;
      failures = 0;
      continue;
    }
    if (res && res.status < 500) throw new Error(`YouTube stopped the upload: ${res.status} ${(await res.text()).slice(0, 500)}`);
    if (++failures > 6) throw new Error("YouTube kept failing during the upload.");
    await sleep(failures * 10_000);
    // Where did that attempt really get to?
    const probe = await fetch(session, { method: "PUT", headers: { "Content-Length": "0", "Content-Range": `bytes */${size}` } }).catch(() => null);
    if (probe && (probe.status === 200 || probe.status === 201)) return ((await probe.json()) as { id: string }).id;
    if (probe?.status === 308) {
      const range = probe.headers.get("range");
      sent = range ? Number(range.split("-")[1]) + 1 : 0;
    }
  }
}

/** A channel that hasn't verified a phone number can't set thumbnails, which shouldn't sink a published video. */
export async function setThumbnail(token: string, videoId: string, file: string): Promise<string | null> {
  const res = await fetch(`${API}/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/jpeg" },
    body: readFileSync(file),
  });
  return res.ok ? null : `Thumbnail not set (${res.status}): ${(await res.text()).slice(0, 200)}`;
}

export async function setCaptions(token: string, videoId: string, srtFile: string): Promise<string | null> {
  const boundary = "codekairo-caption-part";
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ snippet: { videoId, language: "en", name: "English" } })}\r\n`,
    `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n${readFileSync(srtFile, "utf8")}\r\n`,
    `--${boundary}--`,
  ].join("");
  const res = await fetch(`${API}/upload/youtube/v3/captions?part=snippet&uploadType=multipart`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  return res.ok ? null : `Captions not set (${res.status}): ${(await res.text()).slice(0, 200)}`;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** YouTube's rule: starts at 0:00, at least three, each at least ten seconds long. */
export function chapters(timeline: Timeline): string {
  const out: { at: number; title: string }[] = [];
  for (const s of timeline.scenes) {
    const last = out[out.length - 1];
    if (!last || s.start - last.at >= 10) out.push({ at: out.length ? s.start : 0, title: s.title });
  }
  if (timeline.duration - out[out.length - 1]!.at < 10) out.pop();
  return out.length >= 3 ? `Chapters\n${out.map((c) => `${clock(c.at)} ${c.title}`).join("\n")}` : "";
}
