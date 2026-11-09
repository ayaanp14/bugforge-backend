/**
 * The daily Short, posted to Instagram as a reel (the owner's ask, 2026-11-08).
 * Part of the daily videos (services/video-studio.ts); the GitHub run's publish job
 * posts (video/src/instagram.ts), this decides whether and keeps the record.
 *
 * Meta's current path for one business posting to its own account is the Instagram
 * API with Unified Login: the app is linked to a business portfolio, the Instagram
 * professional account is one of the portfolio's assets (no Facebook Page needed),
 * and a system user of that portfolio holds a token for the app that never expires.
 * The dashboard offered nothing else on 2026-11-09 (the Instagram-Login path built
 * first, with a sign-in button and 60-day renewals, was gone). So there is no OAuth
 * here: the token and the account's id are environment, set with set-secrets.sh
 * like YouTube's client secret, and calls go to graph.facebook.com.
 *
 * A reel is made from a `video_url` Instagram fetches itself. So the run hands the
 * finished MP4 to this API, which serves it from a random 32-character name for as
 * long as Instagram needs it, then deletes it. No bucket, no new credentials on the
 * runner.
 *
 * Never twice: a run's reel id is kept on the run, and before posting, the claim
 * reads the account's newest posts for one whose caption opens with this title
 * (`reelOnAccount`), so a job that died after Instagram published adopts it.
 * Instagram has no private or unlisted posts, so only a run that went up public on
 * YouTube is posted at all.
 */
import { randomBytes } from "node:crypto";
import { createWriteStream, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { REEL_FILE, reelOnAccount } from "../lib/video-studio.js";
import { VideoError, publicBase, runOf } from "./video-studio.js";

const GRAPH = () => process.env["INSTAGRAM_GRAPH_URL"] ?? "https://graph.facebook.com";
/** The Graph API version the publishing docs showed on 2026-11-08. */
export const IG_VERSION = "v24.0";

const REEL_DIR = path.join(tmpdir(), "codekairo-reels");
/** Long enough for Instagram's processing, short enough that nothing lingers. */
const REEL_TTL_MS = 2 * 60 * 60 * 1000;
/** Instagram's own ceiling for a reel. */
const MAX_REEL_BYTES = 300 * 1024 * 1024;
/** The page asks who the token posts as; Instagram is asked at most this often. */
const ACCOUNT_TTL_MS = 10 * 60 * 1000;

type Graph = { error?: { message?: string; code?: number } };
const graphMessage = (body: Graph) => body.error?.message ?? "no answer";

function credentials(): { token: string; userId: string } | null {
  const token = process.env["INSTAGRAM_ACCESS_TOKEN"];
  const userId = process.env["INSTAGRAM_USER_ID"];
  return token && userId ? { token, userId } : null;
}

let account: { at: number; value: { username: string | null; problem: string | null } } | null = null;

/**
 * For the page: who the token posts as, or why it can't. Read from Instagram so a
 * revoked token or a wrong id shows before tomorrow's run, cached so a page left
 * open doesn't keep asking.
 */
export async function instagramAccount(): Promise<{ username: string | null; problem: string | null } | null> {
  const ig = credentials();
  if (!ig) return null;
  if (account && Date.now() - account.at < ACCOUNT_TTL_MS) return account.value;
  const res = await fetch(`${GRAPH()}/${IG_VERSION}/${ig.userId}?fields=username`, { headers: { Authorization: `Bearer ${ig.token}` } }).catch(() => null);
  const body = ((await res?.json().catch(() => ({}))) ?? {}) as Graph & { username?: string };
  const value = res?.ok ? { username: body.username ?? null, problem: null } : { username: null, problem: `Instagram refused the token or account id (${res?.status ?? "no answer"}): ${graphMessage(body)}` };
  account = { at: Date.now(), value };
  return value;
}

/* ── The runner's side ───────────────────────────────────────────────── */
//
// The run only sends the file and asks; every call to Instagram is made here, so the
// token, which never expires, never leaves this process (YouTube's runs get an
// hour-long token instead; this one couldn't be cut down to that).

async function graph(method: "GET" | "POST", pathAndQuery: string, params: Record<string, string> = {}) {
  const ig = credentials();
  if (!ig) throw new VideoError("Instagram is not set up on the API.", 409);
  const url = `${GRAPH()}/${IG_VERSION}/${pathAndQuery.replace("{ig}", ig.userId)}`;
  const res = await fetch(method === "GET" ? `${url}${url.includes("?") ? "&" : "?"}${new URLSearchParams(params)}` : url, {
    method,
    headers: { Authorization: `Bearer ${ig.token}`, ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    ...(method === "POST" ? { body: new URLSearchParams(params) } : {}),
  });
  const body = (await res.json().catch(() => ({}))) as Graph & Record<string, unknown>;
  if (!res.ok) throw new VideoError(`Instagram ${res.status}: ${graphMessage(body)}`, 502);
  return body;
}

/**
 * Asked before the reel is made: `skip` (a sentence for the run's warnings, or null
 * for "not set up", which the page already says), `mediaId` when it is already on
 * the account, otherwise `go`.
 */
export async function claimReel(id: string, body: { title?: unknown; publish?: unknown }) {
  const title = String(body.title ?? "");
  if (!title) throw new VideoError("A reel claim needs the Short's title.", 400);
  const run = await runOf(id);
  if (run.reelId) return { mediaId: run.reelId, url: run.reelUrl };
  if (!credentials()) return { skip: null };
  if (body.publish !== true) return { skip: "Not on Instagram: the Short didn't go up public, and Instagram has no private posts." };
  const listed = (await graph("GET", "{ig}/media", { fields: "id,caption,permalink", limit: "30" })) as { data?: { id: string; caption?: string; permalink?: string }[] };
  const already = reelOnAccount(title, listed.data ?? []);
  if (already) {
    await prisma.videoRun.update({ where: { id }, data: { reelId: already.id, reelUrl: already.permalink ?? null } });
    return { mediaId: already.id, url: already.permalink ?? null };
  }
  await prisma.videoRun.update({ where: { id }, data: { reelClaimAt: new Date() } });
  return { go: true };
}

function sweepReels() {
  try {
    for (const name of readdirSync(REEL_DIR)) {
      const file = path.join(REEL_DIR, name);
      if (Date.now() - statSync(file).mtimeMs > REEL_TTL_MS) rmSync(file, { force: true });
    }
  } catch {
    // No folder yet.
  }
}

/** The run's MP4 in, streamed to disk with a byte cap. Answers the name the later steps refer to it by. */
export async function stageReel(id: string, req: Request): Promise<{ name: string }> {
  await runOf(id);
  sweepReels();
  if (Number(req.headers["content-length"] ?? 0) > MAX_REEL_BYTES) throw new VideoError("That reel is over Instagram's 300 MB.", 413);
  mkdirSync(REEL_DIR, { recursive: true });
  const name = `${randomBytes(24).toString("base64url")}.mp4`;
  const file = path.join(REEL_DIR, name);
  let bytes = 0;
  const cap = new Transform({
    transform(chunk: Buffer, _enc, done) {
      bytes += chunk.length;
      done(bytes > MAX_REEL_BYTES ? new VideoError("That reel is over Instagram's 300 MB.", 413) : null, chunk);
    },
  });
  try {
    await pipeline(req, cap, createWriteStream(file));
  } catch (err) {
    rmSync(file, { force: true });
    throw err;
  }
  if (!bytes) {
    rmSync(file, { force: true });
    throw new VideoError("The reel arrived empty.", 400);
  }
  return { name };
}

/** The file Instagram asked for, if it is one this API made and still young. */
export function reelFile(name: string): string | null {
  if (!REEL_FILE.test(name)) return null;
  const file = path.join(REEL_DIR, name);
  try {
    return Date.now() - statSync(file).mtimeMs <= REEL_TTL_MS ? file : null;
  } catch {
    return null;
  }
}

/** Instagram's container for the staged file: Instagram starts fetching and processing it from our URL. */
export async function startReel(id: string, req: Request, body: { name?: unknown; caption?: unknown }) {
  await runOf(id);
  const name = String(body.name ?? "");
  if (!reelFile(name)) throw new VideoError("That reel file is gone; send it again.", 410);
  const created = await graph("POST", "{ig}/media", {
    media_type: "REELS",
    video_url: `${publicBase(req)}/api/video-studio/reel-file/${name}`,
    caption: String(body.caption ?? "").slice(0, 2200),
    share_to_feed: "true",
    // A second in, so the cover is the opening scene rather than its very first frame.
    thumb_offset: "1000",
  });
  if (typeof created["id"] !== "string") throw new VideoError("Instagram made no container.", 502);
  return { containerId: created["id"] };
}

const CONTAINER = /^\d{1,40}$/;

/** FINISHED, IN_PROGRESS, ERROR or EXPIRED, with Instagram's own words when it refused. */
export async function reelStatus(id: string, containerId: string) {
  await runOf(id);
  if (!CONTAINER.test(containerId)) throw new VideoError("Not a container id.", 400);
  const state = await graph("GET", containerId, { fields: "status_code,status" });
  return { statusCode: String(state["status_code"] ?? ""), status: String(state["status"] ?? "") };
}

/** Publishes the finished container, records the reel on the run, and deletes our copy. */
export async function publishReel(id: string, body: { name?: unknown; containerId?: unknown }) {
  await runOf(id);
  const containerId = String(body.containerId ?? "");
  if (!CONTAINER.test(containerId)) throw new VideoError("Not a container id.", 400);
  const published = await graph("POST", "{ig}/media_publish", { creation_id: containerId });
  const mediaId = typeof published["id"] === "string" ? published["id"] : "";
  if (!mediaId) throw new VideoError("Instagram published nothing it would name.", 502);
  const permalink = await graph("GET", mediaId, { fields: "permalink" }).then((m) => (typeof m["permalink"] === "string" ? m["permalink"] : null), () => null);
  await prisma.videoRun.update({ where: { id }, data: { reelId: mediaId.slice(0, 40), reelUrl: permalink?.slice(0, 300) ?? null } });
  dropReel(String(body.name ?? ""));
  return { mediaId, url: permalink };
}

/** The run gave up on the reel: delete our copy now rather than in two hours. */
export function dropReel(name: string) {
  if (REEL_FILE.test(name)) rmSync(path.join(REEL_DIR, name), { force: true });
}
