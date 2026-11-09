/**
 * The Short as an Instagram reel. The API (src/services/video-instagram.ts) holds
 * the token and makes every call to Instagram; this sends the file and its cover,
 * waits for Instagram to process it and asks for the publish. Every failure here
 * is a sentence for the run's warnings, never a failed run: the videos are on
 * YouTube either way.
 */
import { readFileSync } from "node:fs";
import { claimReel, dropReel, publishReel, reelStatus, stageReel, startReel } from "./runner.ts";

/** Meta suggests checking a container about once a minute; a reel this size is usually ready in one or two. */
const POLL_MS = 20_000;
const POLL_LIMIT_MS = 12 * 60_000;

export interface Reel {
  file: string;
  /** The designed cover (cover.jpg), or null for a frame of the video. */
  cover: string | null;
  /** The caption's first line: how a re-run recognises the reel on the account. */
  title: string;
  caption: string;
  audioName: string;
  /** Only a run that went up public on YouTube; Instagram has no private posts. */
  publish: boolean;
}

/** Null when it is on Instagram (or was meant to be skipped quietly), else what went wrong. */
export async function postReel(runId: string, reel: Reel): Promise<string | null> {
  const staged: string[] = [];
  let published = false;
  try {
    const claim = await claimReel(runId, reel.title, reel.publish);
    if ("skip" in claim) return claim.skip;
    if ("mediaId" in claim) {
      console.log(`reel already up: ${claim.url ?? claim.mediaId}`);
      return null;
    }
    const name = (await stageReel(runId, readFileSync(reel.file))).name;
    staged.push(name);
    // A cover that fails to stage costs the reel nothing: Instagram takes a frame instead.
    const cover = reel.cover ? await stageReel(runId, readFileSync(reel.cover), "image/jpeg").then((r) => r.name, () => undefined) : undefined;
    if (cover) staged.push(cover);
    const { containerId } = await startReel(runId, name, reel.caption, { cover, audioName: reel.audioName });
    const started = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      const state = await reelStatus(runId, containerId);
      if (state.statusCode === "FINISHED") break;
      if (state.statusCode === "ERROR" || state.statusCode === "EXPIRED") return `Not on Instagram: it refused the video (${state.status || state.statusCode}).`;
      if (Date.now() - started > POLL_LIMIT_MS) return "Not on Instagram: it was still processing the video after 12 minutes.";
    }
    const posted = await publishReel(runId, name, containerId, cover);
    published = true; // the API deleted its copies
    console.log(`reel: ${posted.url ?? posted.mediaId}`);
    return null;
  } catch (e) {
    return `Not on Instagram: ${(e as Error).message}`;
  } finally {
    if (!published) for (const name of staged) await dropReel(runId, name);
  }
}
