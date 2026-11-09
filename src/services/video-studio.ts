/**
 * The daily videos: the schedule, the queue, the YouTube connection and the record
 * of what has been posted. The campaign page (frontend/campaign/public/video.js) only
 * draws this.
 *
 * The making is the one part that doesn't run in this process. A video takes Chrome
 * and ffmpeg for tens of minutes, and this instance has 2 GB beside MySQL: a Docker
 * build here has already paged InnoDB's buffer pool into swap (deploy/mysql.cnf). So
 * this starts a run of .github/workflows/daily-video.yml, whose code is video/ in this
 * repository, and the run reports back through the runner routes.
 *
 * The refresh token never leaves here. A run gets an access token good for an hour, so
 * nothing in a workflow (and this repository's logs are public) can outlive it.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { dayKey, zoned } from "../lib/clock.js";
import { prisma } from "../lib/prisma.js";
import { pagePaths, recordSiteVideo } from "./site-videos.js";
import { registerJob, type Job } from "../lib/scheduler.js";
import { CAMPAIGN_URL } from "../lib/sites.js";
import { AUTO_TOPICS, OPEN_TOPIC, VIDEO_FINISHED, VIDEO_LANGUAGES, VIDEO_PRIVACY, VIDEO_STALLED_MS, decideClaim, nextStatus, obviousRepeat, titleKey, videoPeriod, type VideoLanguage, type VideoPrivacy } from "../lib/video-studio.js";

const YOUTUBE_API = () => process.env["YOUTUBE_API_URL"] ?? "https://www.googleapis.com";
const TOKEN_URL = () => process.env["GOOGLE_TOKEN_URL"] ?? "https://oauth2.googleapis.com/token";
const GITHUB_API = () => process.env["GITHUB_API_URL"] ?? "https://api.github.com";
const REPO = () => process.env["VIDEO_GITHUB_REPO"] ?? "ayaanp14/bugforge-backend";
/** GitHub only starts a dispatched workflow whose file is on the default branch. */
const REF = () => process.env["VIDEO_GITHUB_REF"] ?? "main";
const SCOPES = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl";
const STATE_TTL_MS = 10 * 60 * 1000;
/** Enough for the model to know the channel; a run sends it this many of the newest titles. */
const POSTED_FOR_JOB = 300;

export class VideoError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/* ── Secrets ─────────────────────────────────────────────────────────── */

const digest = (text: string) => createHash("sha256").update(text).digest();

/** Compared as digests, so neither the length nor a prefix of the secret shows in the timing. */
export const sameSecret = (given: string, expected: string) => timingSafeEqual(digest(given), digest(expected));

function tokenKey(): Buffer {
  const secret = process.env["VIDEO_RUNNER_SECRET"];
  if (!secret) throw new VideoError("VIDEO_RUNNER_SECRET is not set.", 503);
  return digest(`video-studio:youtube:${secret}`);
}

export function sealToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function openToken(sealed: string): string {
  const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), iv!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(body!), decipher.final()]).toString("utf8");
}

export function signState(at: string): string {
  return createHash("sha256").update(`${tokenKey().toString("hex")}:oauth:${at}`).digest("hex");
}

/* ── Settings ────────────────────────────────────────────────────────── */

export const settings = () => prisma.videoSettings.upsert({ where: { id: "studio" }, create: { id: "studio" }, update: {} });

export async function saveSettings(body: { enabled?: unknown; privacy?: unknown; language?: unknown }) {
  await settings();
  await prisma.videoSettings.update({
    where: { id: "studio" },
    data: {
      ...(typeof body.enabled === "boolean" ? { enabled: body.enabled } : {}),
      ...(VIDEO_PRIVACY.includes(body.privacy as VideoPrivacy) ? { privacy: body.privacy as string } : {}),
      ...(VIDEO_LANGUAGES.includes(body.language as VideoLanguage) ? { language: body.language as string } : {}),
    },
  });
}

/* ── YouTube ─────────────────────────────────────────────────────────── */

/** This API's address as the outside world reaches it: Google redirects to it, and Instagram fetches reels from it. */
export const publicBase = (req: Request) => (process.env["BACKEND_PUBLIC_URL"] ?? `${req.protocol}://${req.get("host") ?? "localhost:3001"}`).replace(/\/+$/, "");
const callbackUri = (req: Request) => `${publicBase(req)}/api/video-studio/youtube/callback`;

export function youtubeConsentUrl(req: Request): string {
  const clientId = process.env["YOUTUBE_CLIENT_ID"];
  if (!clientId || !process.env["YOUTUBE_CLIENT_SECRET"]) throw new VideoError("Set YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET on the API first.", 503);
  const at = String(Date.now());
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUri(req),
    response_type: "code",
    scope: SCOPES,
    // Both are needed for a refresh token, and for a new one on reconnecting.
    access_type: "offline",
    prompt: "consent",
    state: `${at}.${signState(at)}`,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

async function exchange(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env["YOUTUBE_CLIENT_ID"] ?? "", client_secret: process.env["YOUTUBE_CLIENT_SECRET"] ?? "", ...body }),
  });
  return (await res.json()) as { access_token?: string; refresh_token?: string; error?: string; error_description?: string };
}

/** Anyone can open the callback, so nothing is stored without a state this API signed in the last ten minutes. Answers the sentence for the page. */
export async function youtubeCallback(req: Request): Promise<string> {
  const [at, mac] = String(req.query["state"] ?? "").split(".");
  if (!at || !mac || Date.now() - Number(at) > STATE_TTL_MS || !sameSecret(mac, signState(at))) return "The sign-in link expired. Try again.";
  const code = req.query["code"];
  if (typeof code !== "string") return req.query["error"] === "access_denied" ? "Google access was declined." : "Google sent no code.";
  const tokens = await exchange({ code, grant_type: "authorization_code", redirect_uri: callbackUri(req) });
  if (!tokens.refresh_token || !tokens.access_token) return tokens.error_description ?? "Google gave no refresh token. Try again.";
  const res = await fetch(`${YOUTUBE_API()}/youtube/v3/channels?part=snippet&mine=true`, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  const channel = ((await res.json()) as { items?: { id: string; snippet: { title: string } }[] }).items?.[0];
  if (!channel) return "That Google account has no YouTube channel.";
  await settings();
  await prisma.videoSettings.update({
    where: { id: "studio" },
    data: { refreshToken: sealToken(tokens.refresh_token), channelId: channel.id, channelTitle: channel.snippet.title, connectedAt: new Date(), tokenBroken: false },
  });
  await syncChannel(tokens.access_token).catch((err) => console.error("[video-studio] first channel read failed:", err));
  return "connected";
}

export async function disconnectYoutube() {
  await settings();
  await prisma.videoSettings.update({ where: { id: "studio" }, data: { refreshToken: null, channelId: null, channelTitle: null, connectedAt: null, tokenBroken: false } });
}

async function accessToken(): Promise<string> {
  const row = await settings();
  if (!row.refreshToken) throw new VideoError("YouTube is not connected on the campaign page.", 409);
  const tokens = await exchange({ refresh_token: openToken(row.refreshToken), grant_type: "refresh_token" });
  if (!tokens.access_token) {
    await prisma.videoSettings.update({ where: { id: "studio" }, data: { tokenBroken: true } });
    throw new VideoError(`Google refused the YouTube connection (${tokens.error ?? "no token"}). Reconnect it on the campaign page.`, 409);
  }
  if (row.tokenBroken) await prisma.videoSettings.update({ where: { id: "studio" }, data: { tokenBroken: false } });
  return tokens.access_token;
}

/**
 * The channel's own uploads list into PostedVideo, so what the "never again" check
 * reads is what is really on YouTube, including everything posted by hand before
 * this existed. 1 quota unit a page, of the 10,000 a day.
 */
async function syncChannel(token: string): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };
  const channels = await fetch(`${YOUTUBE_API()}/youtube/v3/channels?part=contentDetails&mine=true`, { headers });
  if (!channels.ok) throw new Error(`channels.list ${channels.status}`);
  const uploads = ((await channels.json()) as { items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }).items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) return;
  let pageToken = "";
  for (let page = 0; page < 40; page++) {
    const res = await fetch(`${YOUTUBE_API()}/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${uploads}${pageToken ? `&pageToken=${pageToken}` : ""}`, { headers });
    if (!res.ok) throw new Error(`playlistItems.list ${res.status}`);
    const body = (await res.json()) as { nextPageToken?: string; items?: { snippet: { title: string; publishedAt?: string; resourceId: { videoId: string } } }[] };
    const items = body.items ?? [];
    await prisma.postedVideo.createMany({
      skipDuplicates: true,
      data: items.map((i) => ({
        youtubeId: i.snippet.resourceId.videoId,
        title: i.snippet.title.slice(0, 200),
        titleKey: titleKey(i.snippet.title),
        publishedAt: i.snippet.publishedAt ? new Date(i.snippet.publishedAt) : null,
      })),
    });
    if (!body.nextPageToken) return;
    pageToken = body.nextPageToken;
  }
}

/** What counts as already made: everything on the channel, and every run that didn't fail. */
async function earlierTopics(excludeRun?: string): Promise<string[]> {
  const [posted, runs] = await Promise.all([
    prisma.postedVideo.findMany({ select: { title: true }, orderBy: { createdAt: "desc" }, take: POSTED_FOR_JOB }),
    prisma.videoRun.findMany({ where: { OR: [{ status: { not: "failed" } }, { landscapeId: { not: null } }], ...(excludeRun ? { id: { not: excludeRun } } : {}) }, select: { prompt: true, title: true }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  return [...new Set([...posted.map((p) => p.title), ...runs.flatMap((r) => [r.prompt, ...(r.title ? [r.title] : [])])])].filter((t) => t !== OPEN_TOPIC);
}

/* ── Starting a run ──────────────────────────────────────────────────── */

async function dispatch(runId: string): Promise<string | null> {
  const token = process.env["GITHUB_DISPATCH_TOKEN"];
  if (!token) return "GITHUB_DISPATCH_TOKEN is not set on the API.";
  const res = await fetch(`${GITHUB_API()}/repos/${REPO()}/actions/workflows/daily-video.yml/dispatches`, {
    method: "POST",
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "User-Agent": "codekairo-api", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ ref: REF(), inputs: { run_id: runId } }),
  });
  return res.ok ? null : `GitHub refused to start the run (${res.status}): ${(await res.text()).slice(0, 300)}`;
}

/** The queue's first unused prompt, else the next automatic topic, else Claude's own pick. Repeats are skipped and used up as it goes. */
async function nextTopic(earlier: string[]): Promise<{ prompt: string; commit: () => Promise<void> }> {
  for (const item of await prisma.videoTopic.findMany({ orderBy: { createdAt: "asc" } })) {
    if (obviousRepeat(item.prompt, earlier)) {
      await prisma.videoTopic.delete({ where: { id: item.id } });
      continue;
    }
    return { prompt: item.prompt, commit: async () => void (await prisma.videoTopic.delete({ where: { id: item.id } }).catch(() => undefined)) };
  }
  const row = await settings();
  for (let at = row.autoNext; at < AUTO_TOPICS.length; at++) {
    const prompt = AUTO_TOPICS[at]!;
    if (obviousRepeat(prompt, earlier)) continue;
    return { prompt, commit: async () => void (await prisma.videoSettings.update({ where: { id: "studio" }, data: { autoNext: at + 1 } })) };
  }
  // The list has had its turn. The channel keeps going rather than stopping one
  // morning: the script step is told everything already posted.
  return { prompt: OPEN_TOPIC, commit: async () => undefined };
}

async function startRun(prompt: string, source: "schedule" | "auto" | "typed"): Promise<{ id: string; problem: string | null }> {
  const row = await settings();
  const run = await prisma.videoRun.create({ data: { prompt, source, privacy: row.privacy, language: row.language } });
  const problem = await dispatch(run.id);
  if (problem) await prisma.videoRun.update({ where: { id: run.id }, data: { status: "failed", error: problem } });
  return { id: run.id, problem };
}

/** Paying Claude for a video that cannot be posted is the one mistake worth checking for up front. */
async function refuseIfUnready(): Promise<void> {
  const row = await settings();
  if (!row.refreshToken || row.tokenBroken) throw new VideoError("Connect YouTube first: without it, a finished video has nowhere to go.", 409);
  const busy = await prisma.videoRun.findFirst({ where: { status: { notIn: [...VIDEO_FINISHED] }, updatedAt: { gt: new Date(Date.now() - VIDEO_STALLED_MS) } } });
  if (busy) throw new VideoError("A video is being made right now. Wait for it to finish.", 409);
}

export async function runNow(typed: string): Promise<string> {
  await refuseIfUnready();
  const earlier = await earlierTopics();
  if (typed) {
    const repeat = obviousRepeat(typed, earlier);
    if (repeat) throw new VideoError(`Already posted: "${repeat}". Ask for a different topic or a new angle on it.`, 409);
    const started = await startRun(typed, "typed");
    if (started.problem) throw new VideoError(started.problem, 502);
    return started.id;
  }
  const next = await nextTopic(earlier);
  const started = await startRun(next.prompt, "auto");
  if (started.problem) throw new VideoError(started.problem, 502);
  await next.commit();
  return started.id;
}

/** A topic is used up only once GitHub has taken the run, so a failed start tries it again tomorrow. */
const dailyVideoJob: Job = {
  name: "daily_video",
  description: "Makes the day's landscape video and Short, and posts them to YouTube. Does nothing until switched on in the Videos tab at campaign.codekairo.com.",
  periodOf(now) {
    const z = zoned(now);
    return videoPeriod(z.getUTCHours(), z.getUTCMinutes(), dayKey(now));
  },
  async run() {
    const row = await settings();
    if (!row.enabled) return { skipped: "switched off" };
    await refuseIfUnready();
    const next = await nextTopic(await earlierTopics());
    const started = await startRun(next.prompt, "schedule");
    if (started.problem) throw new Error(started.problem);
    await next.commit();
    return { run: started.id, prompt: next.prompt };
  },
};

export const registerVideoJobs = () => registerJob(dailyVideoJob);

/* ── What the page draws ─────────────────────────────────────────────── */

export async function studioState() {
  // A run the workflow never finished reporting on shouldn't look alive for ever.
  await prisma.videoRun.updateMany({
    where: { status: { notIn: [...VIDEO_FINISHED] }, updatedAt: { lt: new Date(Date.now() - VIDEO_STALLED_MS) } },
    data: { status: "failed", error: "No word from the workflow for three hours. Check its log on GitHub." },
  });
  const [row, queue, runs, posted] = await Promise.all([
    settings(),
    prisma.videoTopic.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, prompt: true } }),
    prisma.videoRun.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.postedVideo.count(),
  ]);
  const missing = ["VIDEO_RUNNER_SECRET", "GITHUB_DISPATCH_TOKEN", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"].filter((k) => !process.env[k]);
  return {
    settings: { enabled: row.enabled, privacy: row.privacy, language: row.language },
    queue,
    runs,
    missing,
    posted,
    nextAuto: AUTO_TOPICS[row.autoNext] ?? "Claude picks a topic the channel hasn't covered.",
    logs: `https://github.com/${REPO()}/actions/workflows/daily-video.yml`,
    youtube: row.refreshToken ? { channelTitle: row.channelTitle, channelId: row.channelId, connectedAt: row.connectedAt, broken: row.tokenBroken } : null,
  };
}

export async function addToQueue(prompt: string) {
  if (!prompt) throw new VideoError("Write what the video is about.", 400);
  const repeat = obviousRepeat(prompt, await earlierTopics());
  if (repeat) throw new VideoError(`Already posted: "${repeat}". Ask for a different topic or a new angle on it.`, 409);
  await prisma.videoTopic.create({ data: { prompt } });
}

export const removeFromQueue = (id: string) => prisma.videoTopic.deleteMany({ where: { id } });

/* ── The runner's routes ─────────────────────────────────────────────── */

export async function runOf(id: string) {
  const run = await prisma.videoRun.findUnique({ where: { id } });
  if (!run) throw new VideoError("No such run.", 404);
  return run;
}

export async function jobFor(id: string) {
  const run = await runOf(id);
  // Read fresh, so the model's "already posted" list includes this morning's hand uploads.
  await accessToken().then(syncChannel).catch((err) => console.error("[video-studio] channel read failed:", err));
  return { id: run.id, prompt: run.prompt, privacy: run.privacy, language: run.language, source: run.source, posted: await earlierTopics(run.id) };
}

/** The run's first step found its topic was already made. A typed prompt stops there; otherwise the next in line takes its place. */
export async function replaceTopic(id: string, duplicateOf: string) {
  const run = await runOf(id);
  if (run.source === "typed") throw new VideoError(`Already posted: "${duplicateOf}". Ask for a different topic or a new angle on it.`, 409);
  const earlier = [...(await earlierTopics(id)), run.prompt, duplicateOf];
  const next = await nextTopic(earlier);
  await next.commit();
  await prisma.videoRun.update({ where: { id }, data: { prompt: next.prompt } });
  return { prompt: next.prompt };
}

export async function reportStatus(id: string, body: Record<string, unknown>) {
  const run = await runOf(id);
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
  await prisma.videoRun.update({
    where: { id },
    data: {
      ...(typeof body["status"] === "string" ? { status: nextStatus(run.status, body["status"]).slice(0, 24) } : {}),
      ...(str(body["title"], 200) !== undefined ? { title: str(body["title"], 200) } : {}),
      ...(str(body["model"], 60) !== undefined ? { model: str(body["model"], 60) } : {}),
      ...(str(body["error"], 2000) !== undefined ? { error: str(body["error"], 2000) } : {}),
      ...(str(body["logUrl"], 300) !== undefined ? { logUrl: str(body["logUrl"], 300) } : {}),
      ...(str(body["privacy"], 16) !== undefined ? { privacy: str(body["privacy"], 16) } : {}),
      ...(typeof body["usd"] === "number" ? { usd: body["usd"] } : {}),
      ...(typeof body["cleared"] === "boolean" ? { cleared: body["cleared"] } : {}),
      ...(Array.isArray(body["warnings"]) ? { warnings: body["warnings"].map(String).slice(0, 20) } : {}),
    },
  });
}

type Cut = "landscape" | "short";
const asCut = (v: unknown): Cut => {
  if (v === "landscape" || v === "short") return v;
  throw new VideoError("Unknown format.", 400);
};

/**
 * Called immediately before each upload: reads the channel again, then either hands
 * back the video this run already posted, refuses, or gives a token to upload with.
 * Either way nothing goes up that is already there.
 */
export async function claimUpload(id: string, body: { format?: unknown; title?: unknown; sha256?: unknown }) {
  const format = asCut(body.format);
  const title = String(body.title ?? "");
  const sha256 = String(body.sha256 ?? "");
  if (!title || !/^[a-f0-9]{64}$/.test(sha256)) throw new VideoError("A claim needs the title and the file's sha256.", 400);
  const run = await runOf(id);
  const token = await accessToken();
  await syncChannel(token).catch((err) => console.error("[video-studio] channel read failed:", err));
  const key = titleKey(title);
  const posted = await prisma.postedVideo.findMany({ where: { OR: [{ titleKey: key }, { sha256 }] } });
  const existingId = format === "landscape" ? run.landscapeId : run.shortId;
  const claimedAt = format === "landscape" ? run.landscapeClaimAt : run.shortClaimAt;
  const decision = decideClaim({ runId: id, existingId, claimedAt, title, sha256, posted });
  const idField = format === "landscape" ? "landscapeId" : "shortId";
  if (decision.kind === "refuse") throw new VideoError(decision.reason, 409);
  if (decision.kind === "already") {
    await prisma.videoRun.update({ where: { id }, data: { [idField]: decision.videoId } });
    await prisma.postedVideo.updateMany({ where: { youtubeId: decision.videoId }, data: { runId: id, sha256 } });
    return { videoId: decision.videoId };
  }
  await prisma.videoRun.update({ where: { id }, data: { [format === "landscape" ? "landscapeClaimAt" : "shortClaimAt"]: new Date() } });
  return { accessToken: token };
}

/** Into the ledger as well as the run, so the next day's check sees it before YouTube's list does. */
export async function recordUpload(id: string, body: { format?: unknown; videoId?: unknown; title?: unknown; sha256?: unknown; pages?: unknown; public?: unknown; seconds?: unknown }) {
  const format = asCut(body.format);
  const videoId = String(body.videoId ?? "");
  const title = String(body.title ?? "").slice(0, 200);
  const sha256 = String(body.sha256 ?? "");
  if (!videoId || !title) throw new VideoError("An upload needs its video id and title.", 400);
  await runOf(id);
  await prisma.$transaction([
    prisma.videoRun.update({ where: { id }, data: { [format === "landscape" ? "landscapeId" : "shortId"]: videoId } }),
    prisma.postedVideo.upsert({
      where: { youtubeId: videoId },
      create: { youtubeId: videoId, title, titleKey: titleKey(title), sha256, runId: id, publishedAt: new Date() },
      update: { sha256, runId: id },
    }),
  ]);
  // Shown on the site's pages only when anyone can watch it.
  if (body.public === true) {
    const seconds = typeof body.seconds === "number" && Number.isFinite(body.seconds) ? Math.round(body.seconds) : null;
    await recordSiteVideo(pagePaths(body.pages), { youtubeId: videoId, kind: format === "short" ? "short" : "video", title, seconds });
  }
}

export const CAMPAIGN_PAGE = `${CAMPAIGN_URL}/?tab=videos`;
