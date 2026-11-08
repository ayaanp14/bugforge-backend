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
  language: "hinglish" | "english";
}

/**
 * YouTube's limit is 500 characters across the tags, and a tag with a space in it
 * counts its quotes too. Duplicates and "#" are dropped; a tag over 30 characters
 * is a sentence, not a search term.
 */
export function fitTags(tags: string[]): string[] {
  const out: string[] = [];
  let used = 0;
  for (const raw of tags) {
    const tag = clean(raw).replace(/[#,]/g, "").trim().toLowerCase();
    if (!tag || tag.length > 30 || out.includes(tag)) continue;
    const cost = tag.length + (tag.includes(" ") ? 2 : 0) + (out.length ? 1 : 0);
    if (used + cost > 480) break;
    out.push(tag);
    used += cost;
  }
  return out;
}

/** Hinglish narration is spoken Hindi to YouTube: it is what matches the audience's searches and language. */
const audioLanguage = (language: Upload["language"]) => (language === "hinglish" ? "hi" : "en");

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
        tags: fitTags(meta.tags),
        categoryId: EDUCATION,
        // The title and description are English whatever is spoken.
        defaultLanguage: "en",
        defaultAudioLanguage: audioLanguage(meta.language),
      },
      status: {
        privacyStatus: meta.privacy,
        // For students and engineers, not children: "made for kids" would switch off
        // comments, notifications and the end screens, and narrow who it is shown to.
        selfDeclaredMadeForKids: false,
        license: "youtube",
        embeddable: true,
        publicStatsViewable: true,
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

export async function setCaptions(token: string, videoId: string, srtFile: string, language: Upload["language"]): Promise<string | null> {
  const boundary = "codekairo-caption-part";
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ snippet: { videoId, language: audioLanguage(language), name: language === "hinglish" ? "Hinglish" : "English" } })}\r\n`,
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

/**
 * Puts a video on the channel's playlist of that name, making the playlist the
 * first time. Needs only the force-ssl scope the connection already has. A failure
 * is a warning: the video is up either way.
 */
export async function addToPlaylist(token: string, videoId: string, title: string, about: string): Promise<string | null> {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" };
  try {
    let id: string | undefined;
    let page = "";
    do {
      const res = await fetch(`${API}/youtube/v3/playlists?part=snippet&mine=true&maxResults=50${page ? `&pageToken=${page}` : ""}`, { headers });
      if (!res.ok) return `Playlist not set (${res.status}): ${(await res.text()).slice(0, 200)}`;
      const data = (await res.json()) as { items?: { id: string; snippet: { title: string } }[]; nextPageToken?: string };
      id = data.items?.find((p) => p.snippet.title === title)?.id;
      page = id ? "" : (data.nextPageToken ?? "");
    } while (page);
    if (!id) {
      const res = await fetch(`${API}/youtube/v3/playlists?part=snippet,status`, {
        method: "POST",
        headers,
        body: JSON.stringify({ snippet: { title, description: clean(about).slice(0, 4900), defaultLanguage: "en" }, status: { privacyStatus: "public" } }),
      });
      if (!res.ok) return `Playlist not made (${res.status}): ${(await res.text()).slice(0, 200)}`;
      id = ((await res.json()) as { id: string }).id;
    }
    // A playlist made seconds ago, or a video still settling after its upload, is
    // answered 409 SERVICE_UNAVAILABLE ("The operation was aborted.") for a while:
    // both of 2026-11-08's adds failed that way on their first and only try. It is
    // transient, so wait and ask again; an insert that failed added nothing, so a
    // retry cannot put the video on the list twice.
    let failure = "";
    for (const wait of [0, 5, 15, 30, 60]) {
      if (wait) await new Promise((r) => setTimeout(r, wait * 1000));
      const res = await fetch(`${API}/youtube/v3/playlistItems?part=snippet`, {
        method: "POST",
        headers,
        body: JSON.stringify({ snippet: { playlistId: id, resourceId: { kind: "youtube#video", videoId } } }),
      });
      if (res.ok) return null;
      failure = `Not added to the playlist (${res.status}): ${(await res.text()).slice(0, 200)}`;
      if (res.status !== 409 && res.status < 500) break;
    }
    return failure;
  } catch (e) {
    return `Playlist not set: ${(e as Error).message}`;
  }
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
